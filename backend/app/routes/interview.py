from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from sqlalchemy.orm import Session
from transformers import pipeline
import PyPDF2
import io
import random
from pydantic import BaseModel
from app.database import SessionLocal
from app.models import InterviewSession
from app.ml_scoring import score_answer
from app.utils.resume_category import detect_resume_category
from app.utils.ideal_answer_cache import get_cached_ideal_answer, set_cached_ideal_answer
from app.utils.scoring_progress import init_progress, update_progress, get_progress, clear_progress
from app.utils.interviewer_state import INTERVIEWER_STATE, init_interviewer, add_reaction, get_reactions, clear_reactions
from app.utils.question_prompts import PROMPTS
from app.utils.followup_prompts import FOLLOWUP_PROMPTS

router = APIRouter()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


question_generator = None

def load_question_generator():
    global question_generator
    if question_generator is None:
        question_generator = pipeline(
            "text2text-generation",
            model="google/flan-t5-small",
            device=-1
        )
    return question_generator


def resolve_next_difficulty(score: int) -> str:
    if score <= 3:
        return "Easy"
    elif score <= 6:
        return "Medium"
    return "Hard"


def generate_questions(
    text: str,
    resume_category: str,
    difficulty: str,
    asked_before: list = [],
    num_questions: int = 1
):
    model = load_question_generator()
    questions = []

    max_chars = 2500
    chunk_size = 400
    chunks = [
        text[i:i + chunk_size]
        for i in range(0, min(len(text), max_chars), chunk_size)
    ]

    random.shuffle(chunks)
    prompt_pool = PROMPTS.get(difficulty, PROMPTS["Easy"])

    attempts = 0
    while len(questions) < num_questions and attempts < 30:
        chunk = random.choice(chunks)
        prompt = random.choice(prompt_pool).format(chunk=chunk)

        result = model(
            prompt,
            max_length=64,
            do_sample=True,
            temperature=0.9,
            top_p=0.95
        )

        q = result[0]["generated_text"].strip()
        if q and q not in asked_before:
            questions.append({
                "question": q,
                "difficulty": difficulty
            })

        attempts += 1

    return questions


def generate_ideal_answer(question: str):
    cached = get_cached_ideal_answer(question)
    if cached:
        return cached

    model = load_question_generator()
    prompt = f"Provide an ideal interview answer:\n{question}"
    result = model(prompt, max_length=96)

    answer = result[0]["generated_text"]
    set_cached_ideal_answer(question, answer)
    return answer

def generate_followup_question(question: str, answer: str, score: int):
    model = load_question_generator()

    if score < 3:
        instruction = "Ask a simple clarification question based on the candidate's weak answer."
    elif score < 6:
        instruction = "Ask a follow-up question that probes deeper understanding."
    else:
        instruction = "Ask an advanced follow-up question that challenges the candidate."

    prompt = f"""
        You are a professional interviewer.

        Original Question:
        {question}

        Candidate Answer:
        {answer}

        Instruction:
        {instruction}

        Generate ONE concise follow-up interview question.
        """

    result = model(
        prompt,
        max_length=64,
        do_sample=True,
        temperature=0.85
    )

    return result[0]["generated_text"].strip()




def interviewer_reaction_type(score: int, answer: str):
    wc = len(answer.split())
    if wc < 15:
        return "interrupt"
    if score < 4:
        return "probe"
    if score < 7:
        return "clarify"
    return "challenge"

INTERRUPTION_PROMPTS = {
    "interrupt": "Politely interrupt and ask the candidate to be more specific.",
    "probe": "Ask a probing follow-up to understand their reasoning.",
    "clarify": "Ask for clarification with a concrete example.",
    "challenge": "Challenge the answer with a deeper or edge-case question."
}

def generate_interviewer_reaction(question: str, answer: str, score: int):
    model = load_question_generator()
    reaction_type = interviewer_reaction_type(score, answer)

    prompt = f"""
        You are a real interviewer.

        Original Question:
        {question}

        Candidate Answer:
        {answer}

        Instruction:
        {INTERRUPTION_PROMPTS[reaction_type]}

        Respond with ONE sentence only.
        """

    result = model(
        prompt,
        max_length=64,
        do_sample=True,
        temperature=0.85
    )

    return {
        "type": reaction_type,
        "text": result[0]["generated_text"].strip()
    }



class LiveFollowRequest(BaseModel):
    question: str
    answer: str
    
@router.post("/live-followup")
def live_followup(payload: LiveFollowRequest):
    try:
        question = payload.question
        answer = payload.answer

        ideal = generate_ideal_answer(question)
        scored = score_answer(answer, ideal)

        followup = None
        reaction = None

        if scored["score"] < 7:
            followup = generate_followup_question(question, answer, scored["score"])
            reaction = generate_interviewer_reaction(question, answer, scored["score"])
        else:
            reaction = {
                "type": "acknowledge",
                "text": "Good answer, let's move to the next question."
            }

        return {
            "score": scored["score"],
            "breakdown": scored["breakdown"],
            "why_lost": scored["why_lost"],
            "followup_question": followup,
            "reaction": reaction
        }

    except Exception as e:
        print("LIVE FOLLOWUP ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/sessions/{user_id}")
def get_interview_sessions(user_id: int, db: Session = Depends(get_db)):
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == user_id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )

    return {
        "sessions": [
            {
                "id": s.id,
                "score": s.feedback.get("score") if isinstance(s.feedback, dict) else None,
                "num_questions": len(s.generated_questions or []),
                "created_at": s.created_at,
            }
            for s in sessions
        ]
    }


@router.post("/upload-resume")
async def upload_resume(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    contents = await file.read()
    reader = PyPDF2.PdfReader(io.BytesIO(contents))
    text = "".join(page.extract_text() or "" for page in reader.pages)

    if not text.strip():
        raise HTTPException(status_code=400, detail="Empty resume")

    resume_category = detect_resume_category(text)

    previous = (
        db.query(InterviewSession.asked_questions)
        .filter(InterviewSession.user_id == user_id)
        .all()
    )
    asked_before = [q for row in previous for q in (row[0] or [])]

    questions = generate_questions(
        text=text,
        resume_category=resume_category,
        difficulty="Easy",
        asked_before=asked_before,
        num_questions=8
    )

    interview = InterviewSession(
        user_id=user_id,
        resume_text=text,
        generated_questions=questions,
        asked_questions=[q["question"] for q in questions],
        resume_category=resume_category,
        user_answers=[],
        feedback={}
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return {
        "session_id": interview.id,
        "resume_category": resume_category,
        "generated_questions": questions
    }


@router.post("/score-session")
def score_session(payload: dict, db: Session = Depends(get_db)):
    session_id = payload.get("session_id")
    questions = payload.get("questions", [])
    answers = payload.get("answers", [])

    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")

    interview = db.query(InterviewSession).filter_by(id=session_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Session not found")

    init_progress(session_id, len(questions))
    init_interviewer(session_id)

    results = []
    interviewer_events = []
    followup_questions = []
    total_score = 0
    max_per_question = 10
    
    init_interviewer(session_id)

    for q, a in zip(questions, answers):
        ideal = generate_ideal_answer(q)
        scored = score_answer(a, ideal)

        followup = generate_followup_question(
            q, a, scored["score"])
       
        interviewer_events.append({
            "question": q,
            "score": scored["score"],
            "followup_question": followup
        })
        
        results.append(scored)
        
        total_score += scored["score"]
        update_progress(session_id)

    final_score = int(
        (total_score / (len(results) * max_per_question)) * 100
    )   if results else 0

    interview.user_answers = [
        {"question": q, "answer": a}
        for q, a in zip(questions, answers)
    ]
    interview.feedback = {
        "score": final_score,
        "details": results,
        "followup_questions": interviewer_events
    }

    db.commit()
    clear_progress(session_id)
    clear_reactions(session_id)

    return {
        "overall_score": final_score,
        "details": results,
        "followup_questions": interviewer_events
    }
    
@router.get("/session/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": session.id,
        "generated_questions": session.generated_questions,
        "user_answers": session.user_answers,
        "feedback": session.feedback,
        "resume_category": session.resume_category,
        "created_at": session.created_at
    }

@router.get("/score-progress/{session_id}")
def score_progress(session_id: int):
    return get_progress(session_id)