import re
from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("all-MiniLM-L6-v2")

MAX_SCORE_PER_QUESTION = 10
MIN_SIMILARITY = 0.35
MIN_WORDS = 15

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text.strip()

def score_answer(user_answer: str, ideal_answer: str) -> dict:
    user_answer = clean_text(user_answer)
    ideal_answer = clean_text(ideal_answer)

    words = len(user_answer.split())

    
    if words < MIN_WORDS:
        return {
            "score": 0,
            "why_lost": ["Answer too short"],
            "breakdown": {"technical": 0, "clarity": 0, "communication": 0}
        }

    user_emb = model.encode(user_answer, convert_to_tensor=True)
    ideal_emb = model.encode(ideal_answer, convert_to_tensor=True)
    similarity = util.cos_sim(user_emb, ideal_emb).item()

    if similarity < MIN_SIMILARITY:
        return {
            "score": 2,
            "why_lost": ["Answer not relevant to the question"],
            "breakdown": {"technical": 2, "clarity": 1, "communication": 1}
        }

    
    technical = min(10, int(similarity * 10))
    communication = min(10, max(4, words // 20))
    clarity = min(10, int(similarity * 8))

    final = int(
        technical * 0.5 +
        clarity * 0.3 +
        communication * 0.2
    )

    final = min(final, MAX_SCORE_PER_QUESTION)

    why_lost = []
    if technical < 5: why_lost.append("Weak technical relevance")
    if clarity < 5: why_lost.append("Explanation lacks clarity")
    if communication < 5: why_lost.append("Answer could be more structured")

    return {
        "score": final,
        "breakdown": {
            "technical": technical,
            "clarity": clarity,
            "communication": communication
        },
        "why_lost": why_lost or ["Good balanced answer"]
    }
