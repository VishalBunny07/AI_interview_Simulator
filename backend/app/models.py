from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    resume_text = Column(String, nullable=False)
    resume_category = Column(String, nullable=True)   
    generated_questions = Column(JSON, nullable=False)
    user_answers = Column(JSON, default=list)  
    feedback = Column(JSON, default=dict)     
    score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
