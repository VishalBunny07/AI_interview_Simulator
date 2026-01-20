from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, interview
from app.models import Base
from app.database import engine
from app.routes.interview import load_question_generator
from app.ml_scoring import score_answer

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Interview Simulator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(interview.router, prefix="/interview", tags=["interview"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Interview Simulator API!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

@app.get("/dashboard")
def dashboard():
    return {"message": "This is the dashboard endpoint."}

@app.on_event("startup")
def warmup_models():
    load_question_generator()
    score_answer("test Answer", "test ideal answer")