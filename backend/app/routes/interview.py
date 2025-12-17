from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form, BackgroundTasks
from sqlalchemy.orm import Session
from transformers import pipeline
import PyPDF2
import io
from app.utils.scoring_progress import init_progress, update_progress, get_progress, clear_progress
from app.database import SessionLocal
from app.models import InterviewSession
from app.ml_scoring import score_answer
from app.utils.resume_category import detect_resume_category
from app.utils.ideal_answer_cache import (
    get_cached_ideal_answer,
    set_cached_ideal_answer
)

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



def generate_questions(text: str, num_questions: int = 8):
    model = load_question_generator()
    questions = []

    max_chars = 2500
    chunk_size = 400
    chunks = [text[i:i + chunk_size] for i in range(0, min(len(text), max_chars), chunk_size)]

    for chunk in chunks:
        if len(questions) >= num_questions:
            break

        prompt = f"Generate an interview question from this resume:\n{chunk}"
        result = model(prompt, max_length=64, num_return_sequences=1)
        questions.append(result[0]["generated_text"])

    return questions



def generate_ideal_answer(question: str):
    cached = get_cached_ideal_answer(question)
    if cached:
        return cached

    model = load_question_generator()
    prompt = f"Provide an ideal interview answer for this question:\n{question}"
    result = model(prompt, max_length=96, num_return_sequences=1)

    answer = result[0]["generated_text"]
    set_cached_ideal_answer(question, answer)
    return answer


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


@router.get("/session/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": session.id,
        "questions": session.generated_questions or [],
        "answers": session.user_answers or [],
        "feedback": session.feedback or {},
        "score": session.feedback.get("score") if isinstance(session.feedback, dict) else None,
        "resume_category": session.resume_category,
        "created_at": session.created_at,
    }



@router.post("/upload-resume")
async def upload_resume(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    contents = await file.read()
    pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))

    text = ""
    for page in pdf_reader.pages:
        text += (page.extract_text() or "") + "\n"

    if not text.strip():
        raise HTTPException(status_code=400, detail="Failed to extract text from PDF")

    resume_category = detect_resume_category(text)
    questions = generate_questions(text)

    interview = InterviewSession(
        user_id=user_id,
        resume_text=text,
        generated_questions=questions,
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


def run_scoring (session_id: int, questions: list, answers: list, db: Session):
    interview = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not interview:
        return

    init_progress(session_id, len(questions))

    results = []
    total_score = 0

    for q, a in zip(questions, answers):
        ideal = generate_ideal_answer(q)
        scored = score_answer(a, ideal)

        results.append(scored)
        total_score += scored["score"]

        update_progress(session_id)

    final_score = total_score // max(len(results), 1)

    interview.user_answers = [{"question": q, "answer": a} for q, a in zip(questions, answers)]
    interview.feedback = {
        "score": final_score,
        "details": results
    }
    db.commit()
    clear_progress(session_id)

@router.post("/score-session")
def score_session(payload: dict, db: Session = Depends(get_db)):
    session_id = payload.get("session_id")
    questions = payload.get("questions", [])
    answers = payload.get("answers", [])

    interview = db.query(InterviewSession).filter(
        InterviewSession.id == session_id
    ).first()

    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
     
    results = []
    total_score = 0

    for q, a in zip(questions, answers):
        ideal = generate_ideal_answer(q)
        scored = score_answer(a, ideal)
        results.append(scored)
        total_score += scored["score"]

    final_score = total_score // max(len(results), 1)

    interview.feedback = {
        "score": final_score,
        "details": results
    }
    db.commit()

    return {
        "overall_score": final_score,
        "details": results
    }

@router.get("/score-progress/{session_id}")
def score_progress(session_id: int):
    return get_progress(session_id)

