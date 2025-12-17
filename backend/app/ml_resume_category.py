from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer('all-MiniLM-L6-v2')

CATEGORIES = {
    "IT": "software developer programming python java backend frontend database cloud devops",
    "HR": "human resources recruitment hiring payroll employee relations hr policies onboarding",
    "Managerial": "project management leadership strategy operations planning budgeting team lead"
}

categories_embeddings = {
    k: model.encode(v) for k, v in CATEGORIES.items()
}

def detect_resume_category(resume_text: str) -> str:
    resume_embedding = model.encode(resume_text)
    
    scores = {
        cat: cosine_similarity(
            [resume_embedding], [emb]
        ) [0] [0]
        for cat, emb in categories_embeddings.items()
    }
    
    return max(scores, key=scores.get)