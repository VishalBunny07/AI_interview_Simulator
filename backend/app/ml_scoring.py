from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


model = SentenceTransformer("all-MiniLM-L6-v2")


def score_answer(user_answer: str, ideal_answer: str):

    u = model.encode([user_answer])[0]
    i = model.encode([ideal_answer])[0]

    similarity = cosine_similarity([u], [i])[0][0]
    score = max(0, min(100, similarity * 100))

    
    feedback = []

    if len(user_answer.split()) < 20:
        feedback.append("Your answer is too short. Add more depth.")

    if similarity < 0.6:
        feedback.append("Your answer is missing key concepts.")

    if similarity > 0.8:
        feedback.append("Great job! Very close to the ideal response.")

    return {
        "score": round(score),
        "feedback": feedback,
        "ideal_answer": ideal_answer
    }
