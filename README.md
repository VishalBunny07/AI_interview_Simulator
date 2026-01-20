# 🎤 AI Interview Simulator

An AI-powered interview simulation platform that analyzes resumes, generates role-based interview questions, evaluates user answers, and provides detailed scoring & feedback.

---

## 🚀 Features

- 📄 Resume upload (PDF)
- 🧠 Resume category detection (IT / HR / Managerial)
- ❓ AI-generated interview questions
- 🎙️ Voice & typing answer modes
- 📊 AI-based answer scoring
- 🧾 Interview history & retake option
- ⚡ Optimized with caching & async scoring
- 🖥️ CPU-friendly (runs without GPU)

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Axios

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL / SQLite (for demo)
- HuggingFace Transformers (FLAN-T5)

### AI / ML
- Question Generation: `google/flan-t5-small`
- Answer Scoring: Embedding + similarity logic
- Resume Classification: Keyword-based NLP

---

## 📂 Project Structure

AI-Interview-Simulator/
│
├── backend/
│ ├── app/
│ │ ├── routes/
│ │ ├── models/
│ │ ├── utils/
│ │ ├── ml_scoring.py
│ │ └── main.py
│ └── requirements.txt
│
├── frontend/
│ ├── src/
│ ├── components/
│ └── package.json
│
└── README.md



---

## ⚙️ Setup Instructions

### Backend
```bash```
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload


```then start frontend```
cd frontend
npm install
npm start

##ScreenShots

1. Home Screen

![home screen](https://github.com/user-attachments/assets/2338574a-f4c9-4e11-bd5d-b3f4109b88c0)

2. Register Screen

![register](https://github.com/user-attachments/assets/3cc50620-dc30-4edd-b74a-886ec11c5b14)


3. Login Screen

![login](https://github.com/user-attachments/assets/bcf9b8f5-d595-4b80-8ef5-6960e39e4936)

4. Dashboard

![Dashboard](https://github.com/user-attachments/assets/fe3b049b-0e30-4bc0-8066-0a860c92a049)
