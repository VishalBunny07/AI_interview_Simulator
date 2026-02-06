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
from app.utils.interviewer_personalities import INTERVIEWER_PERSONALITIES
import re

router = APIRouter()
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


question_model = None
scoring_model = None

def load_question_generator():
    global question_model
    if question_model is None:
        question_model = pipeline(
            "text2text-generation",
            model="google/flan-t5-base",
            device=-1
        )
    return question_model

def load_scoring_model():
    global scoring_model
    if scoring_model is None:
        scoring_model = pipeline(
            "text2text-generation",
            model="google/flan-t5-small",
            device=-1
        )
    return scoring_model


def resolve_next_difficulty(score: int) -> str:
    if score <= 3:
        return "Easy"
    elif score <= 6:
        return "Medium"
    return "Hard"

def normalize_resume(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"(\b\w+\b)(?:\s+\1){2,}", r"\1", text, flags=re.I)
    text = re.sub(r"\b\d{4}[-–]\w+\s*\d{4}\b", "", text)
    return text.strip()

def is_repetitive(q: str) -> bool:
    words = q.lower().split()
    return len(words) < 6 or (len(set(words)) / max(len(words), 1)) < 0.45

def clean_question(raw_q: str) -> str:
    if not raw_q:
        return ""
    q = raw_q.strip().replace("\n", " ")
    if "?" in q:
        q = q.split("?")[0].strip() + "?"
    return q

def is_bad_question(q: str) -> bool:
    ql = q.lower().strip()

    banned_starts = (
            "do you have",
            "what is",
            "what was",
            "how did you feel",
            "how did you describe",
            "describe the interviewer",
            "about the interview",
            "interview experience"
    )

    banned_keywords = (
            "resume",
            "github",
            "portfolio",
            "cgpa",
            "school",
            "college",
            "interviewer"
        )

    return (
            ql.startswith(banned_starts)
            or any(k in ql for k in banned_keywords)
            or len(ql.split()) < 7
        )

    
def extract_experience_signals(text: str) -> list[str]:
    """
    Robust experience signal extractor for resumes
    Works with bullets, projects, work experience, and mixed casing
    """
    text = re.sub(r"\s+", " ", text)
    text = text.replace("•", ".").replace("-", ".")
    
    raw_lines = [l.strip() for l in re.split(r"[.\n]", text) if len(l.strip()) > 25]

    action_verbs = [
        "developed", "designed", "built", "implemented", "created",
        "led", "managed", "taught", "trained", "handled",
        "optimized", "improved", "analyzed", "deployed",
        "integrated", "tested", "maintained"
    ]

    banned_sections = [
        "skills", "languages", "education", "certification",
        "hobbies", "personal", "interests"
    ]

    signals = []

    for line in raw_lines:
        l = line.lower()

        if any(b in l for b in banned_sections):
            continue

        if any(v in l for v in action_verbs):
            signals.append(line.strip())
            continue

        if (
            any(t in l for t in ["project", "application", "system", "model", "website"])
            and len(line.split()) >= 8
        ):
            signals.append(line.strip())

    signals = list(dict.fromkeys(signals))
    if len(signals) < 5:
        fallback = [
            "Worked on real-world projects requiring problem-solving and decision-making",
            "Handled responsibilities involving planning, execution, and improvement",
            "Faced challenges while delivering outcomes under constraints",
            "Collaborated with others to achieve project goals",
            "Applied technical and analytical skills to practical tasks"
        ]
        signals.extend(fallback)

    return signals[:10]


def domain_instruction(category: str) -> str:
    return {
        "IT": "Focus on technical decisions, implementation, and problem-solving.",
        "HR": "Focus on people management, communication, and conflict handling.",
        "Managerial": "Focus on leadership, planning, decision-making, and ownership.",
        "General": "Focus on experience, challenges, and learning."
    }.get(category, "Focus on experience and decision-making.")


def get_question_templates(category: str):

    core = [
        "Tell me about a time you had to overcome a major challenge while {experience}.",
        "What was the most difficult decision you made during {experience}?",
        "Looking back, what would you do differently in {experience}?",
        "What did you learn personally and professionally from {experience}?",
        "How did you measure success in {experience}?",
        "What risks were involved in {experience}, and how did you handle them?",
        "How did you prioritize tasks during {experience}?",
        "What surprised you the most while working on {experience}?",
        "How did this experience shape your future approach to similar work?",
        "What was the biggest mistake you made during {experience}, and what did it teach you?"
    ]

    technical = [
        "How did you design the architecture for {experience}?",
        "What technical trade-offs did you consider during {experience}?",
        "How did you debug or troubleshoot issues in {experience}?",
        "What performance optimizations did you implement in {experience}?",
        "How did you ensure scalability or reliability in {experience}?",
        "What technologies did you choose for {experience}, and why?",
        "How did you handle failures or edge cases in {experience}?",
        "What was the most complex technical problem in {experience}?",
        "How did you test and validate your solution in {experience}?",
        "If you rebuilt {experience} today, what would you change technically?",
        "How did collaboration with other developers impact {experience}?",
        "What security considerations were important in {experience}?",
        "How did you manage database or API design in {experience}?",
        "What bottlenecks did you encounter in {experience} and how did you fix them?",
        "How did you ensure code quality during {experience}?"
    ]

    hr = [
        "How did you handle conflict between team members during {experience}?",
        "What communication strategy worked best in {experience}?",
        "How did you motivate others while managing {experience}?",
        "What challenges did you face with stakeholder expectations in {experience}?",
        "How did you build trust within the team during {experience}?",
        "What difficult conversation did you have during {experience}?",
        "How did you ensure fairness and inclusion in {experience}?",
        "What feedback did you receive during {experience}, and how did you respond?",
        "How did you manage stress or pressure in {experience}?",
        "What leadership qualities did you demonstrate in {experience}?"
    ]

    managerial = [
        "How did you plan and execute {experience} from start to finish?",
        "What strategic decisions were critical in {experience}?",
        "How did you allocate resources during {experience}?",
        "What risks threatened {experience}, and how did you mitigate them?",
        "How did you track progress and performance in {experience}?",
        "What trade-offs did you make between speed, cost, and quality in {experience}?",
        "How did you align stakeholders during {experience}?",
        "What would you improve in your leadership approach after {experience}?",
        "How did you handle uncertainty or changing requirements in {experience}?",
        "What impact did {experience} create for the organization?"
    ]

    collaboration = [
        "How did you collaborate with others during {experience}?",
        "How did you handle disagreements or differing opinions in {experience}?",
        "How did you communicate progress or issues during {experience}?",
        "What role did you personally play in {experience}?"
    ]

    leadership = [
        "How did you plan and execute {experience}?",
        "How did you prioritize tasks during {experience}?",
        "What risks did you identify in {experience}, and how did you manage them?",
        "How did you make decisions under pressure during {experience}?",
        "How did you take ownership of outcomes in {experience}?"
    ]

    reflective = [
        "What would you do differently if you faced {experience} again?",
        "What was the biggest lesson from {experience}?",
        "How did {experience} influence your professional growth?"
    ]

    if category == "IT":
        return technical + core + reflective

    if category == "HR":
        return hr + collaboration + core

    if category == "Managerial":
        return managerial + leadership + core

    return core + reflective


    

def simplify_signal(signal: str) -> str:
    signal = signal.strip()
    signal = re.sub(r"\b(project|experience|work experience)\b", "", signal, flags=re.I)
    signal = signal.lower().capitalize()
    words = signal.split()
    if len(words) > 20:
        signal = " ".join(words[:20]) + "..."

    return signal.rstrip(".")

INTERVIEWER_PERSONALITIES = {
    "technical": {
        "tone": "Be specific and focus on technical depth."
    },
    "mentor": {
        "tone": "Explain clearly and include what you learned."
    },
    "hr": {
        "tone": "Focus on communication, teamwork, and behavior."
    },
    "manager": {
        "tone": "Justify decisions and business impact."
    }
}


def apply_personality_tone(question: str, personality: str) -> str:
    tone = INTERVIEWER_PERSONALITIES.get(personality, {}).get("tone", "")
    if not tone:
        return question

    endings = [
        f"{question} {tone}",
        f"{question} Please elaborate.",
        f"{question} Give a real example.",
        f"{question} Explain your reasoning."
    ]

    return random.choice(endings)

def generate_questions(
    text: str,
    resume_category: str,
    difficulty: str,
    personality: str = "technical",
    asked_before=None,
    num_questions: int = 8
):
    asked_before = set(asked_before or [])
    questions = []

    text = normalize_resume(text)
    signals = extract_experience_signals(text)

    if not signals:
        signals = [text[:200]]

    templates = get_question_templates(resume_category)

    random.shuffle(signals)

    for signal in signals:
        if len(questions) >= num_questions:
            break

        template = random.choice(templates)

        if random.random() < 0.3:
            template = template.replace("How did you", "Can you explain how you")
        if random.random() < 0.2:
            template = template.replace("What", "Could you describe what")

        q = clean_question(template.format(experience=simplify_signal(signal)))

        if not q or q in asked_before:
            continue

        q = apply_personality_tone(q, personality)

        questions.append({
            "question": q,
            "difficulty": difficulty
        })
        asked_before.add(q)

    GENERIC = [
        "Can you describe a challenging project and how you solved it?",
        "What key decision shaped one of your projects?",
        "How do you approach problems when requirements are unclear?",
        "What mistake taught you the most?",
        "How do you balance quality and deadlines?"
    ]

    i = 0
    while len(questions) < num_questions:
        q = apply_personality_tone(GENERIC[i % len(GENERIC)], personality)

        if q not in asked_before:
            questions.append({
                "question": q,
                "difficulty": difficulty
            })
            asked_before.add(q)

        i += 1

    return questions

def generate_ideal_answer(question: str):
    cached = get_cached_ideal_answer(question)
    if cached:
        return cached

    model = load_scoring_model()
    prompt = f"Provide a strong interview answer:\n{question}"

    result = model(prompt, max_length=128)
    answer = result[0]["generated_text"]

    set_cached_ideal_answer(question, answer)
    return answer


def generate_followup_question(question, answer, score, personality):
    model = load_question_generator()

    if personality == "mentor":
        intent = "Ask a gentle clarification follow-up."

    elif personality == "technical":
        intent = "Ask a deep technical follow-up probing implementation details."

    elif personality == "hr":
        intent = "Ask a behavioral follow-up focusing on communication or teamwork."

    else:  
        intent = "Challenge the decision and ask about ownership or impact."

    prompt = f"""
        You are a {personality} interviewer.

        Original Question:
        {question}

        Candidate Answer:
        {answer}

        Instruction:
        {intent}

        Ask ONE open-ended follow-up question.
        """

    result = model(prompt, max_length=64)
    return clean_question(result[0]["generated_text"])


def interviewer_reaction_type(score: int):
    if score < 4:
        return "probe"
    if score < 7:
        return "clarify"
    return "acknowledge"


STATIC_REACTIONS = {
    "probe": [
        "Can you explain that in more detail?",
        "What led you to take that approach?"
    ],
    "clarify": [
        "Can you give a concrete example?",
        "Could you clarify your reasoning?"
    ],
    "acknowledge": [
        "Alright, let’s move to the next question.",
        "That makes sense, let’s continue."
    ]
}


def generate_interviewer_reaction(score: int):
    rtype = interviewer_reaction_type(score)
    return {
        "type": rtype,
        "text": random.choice(STATIC_REACTIONS[rtype])
    }

# I have commented out the dynamic reaction generation because it was producing inconsistent results and sometimes giving inappropriate feedback. The static reactions are more reliable and still provide a good user experience. We can revisit dynamic reactions in the future with a more refined prompt and better model tuning.
# def generate_interviewer_reaction(question: str, answer: str, score: int):
#     model = load_question_generator()
#     reaction_type = interviewer_reaction_type(score, answer)

#     prompt = f"""
#         You are a real interviewer.

#         Original Question:
#         {question}

#         Candidate Answer:
#         {answer}

#         Instruction:
#         {INTERRUPTION_PROMPTS[reaction_type]}

#         Respond with ONE sentence only.
#         """

#     result = model(
#         prompt,
#         max_length=64,
#         do_sample=True,
#         temperature=0.85
#     )

#     return {
#         "type": reaction_type,
#         "text": result[0]["generated_text"].strip()
#     }



class LiveFollowRequest(BaseModel):
    question: str
    answer: str
    
@router.post("/live-followup")
def live_followup(payload: LiveFollowRequest, db: Session = Depends(get_db)):
    try:
        question = payload.question
        answer = payload.answer

        session = db.query(InterviewSession)\
            .order_by(InterviewSession.id.desc())\
            .first()

        personality = session.interviewer_personality if session else "technical"

        ideal = generate_ideal_answer(question)
        scored = score_answer(answer, ideal)

        followup = None
        reaction = None

        if scored["score"] < 7:
            followup = generate_followup_question(
                question,
                answer,
                scored["score"],
                personality
            )
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

    personality = random.choice(list(INTERVIEWER_PERSONALITIES.keys()))

    try:
        questions = generate_questions(
            text=text,
            resume_category=resume_category,
            difficulty="Easy",
            personality=personality,      
            asked_before=asked_before,
            num_questions=8
        )
    except Exception as e:
        print("UPLOAD RESUME ERROR:", e)
        raise HTTPException(status_code=500, detail="Question generation failed")

    interview = InterviewSession(
        user_id=user_id,
        resume_text=text,
        generated_questions=questions,
        asked_questions=[q["question"] for q in questions],
        resume_category=resume_category,
        interviewer_personality=personality,   
        user_answers=[],
        feedback={}
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    return {
        "session_id": interview.id,
        "resume_category": resume_category,
        "interviewer_personality": personality,
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
        question_text = q["question"] if isinstance(q, dict) else q
        ideal = generate_ideal_answer(question_text)
        scored = score_answer(a, ideal)

        followup = generate_followup_question(question_text, a, scored["score"], personality="technical")

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
    interview.score = final_score

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