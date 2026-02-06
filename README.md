# AI Interview Simulator

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
```text
AI-Interview-Simulator/
├── 📁 ai_model/
│   ├── 📁 dataset/
│   ├── 📄 interview_score_model.ipynb
│   ├── 📄 scoring_model_weights.npz
│   └── 📄 training_data.jsonl
├── 📁 backend/
│   ├── 📁 app/
│   │   ├── 📁 routes/
│   │   │   ├── 🐍 auth.py
│   │   │   └── 🐍 interview.py
│   │   ├── 📁 services/
│   │   │   └── 🐍 ai_service.py
│   │   ├── 📁 utils/
│   │   │   ├── 🐍 followup_prompts.py
│   │   │   ├── 🐍 ideal_answer_cache.py
│   │   │   ├── 🐍 interviewer_personalities.py
│   │   │   ├── 🐍 interviewer_state.py
│   │   │   ├── 🐍 question_prompts.py
│   │   │   ├── 🐍 resume_category.py
│   │   │   └── 🐍 scoring_progress.py
│   │   ├── 🐍 __init__.py
│   │   ├── 🐍 database.py
│   │   ├── 🐍 main.py
│   │   ├── 🐍 ml_resume_category.py
│   │   ├── 🐍 ml_scoring.py
│   │   └── 🐍 models.py
│   ├── 📁 db_backup/
│   │   └── 📄 ai_interview.sql
│   ├── 📁 migrations/
│   │   ├── 📁 versions/
│   │   │   ├── 🐍 4de7f41c4835_recreate_tables.py
│   │   │   └── 🐍 eb80cd39fbbf_add_resume_category.py
│   │   ├── 📄 README
│   │   ├── 🐍 env.py
│   │   └── 📄 script.py.mako
│   ├── ⚙️ alembic.ini
│   └── 📄 requirements.txt
├── 📁 docs/
├── 📁 frontend/
│   ├── 📁 public/
│   │   ├── 📄 favicon.ico
│   │   ├── 🌐 index.html
│   │   ├── 🖼️ logo192.png
│   │   ├── 🖼️ logo512.png
│   │   ├── ⚙️ manifest.json
│   │   └── 📄 robots.txt
│   ├── 📁 src/
│   │   ├── 📁 pages/
│   │   │   ├── 📄 Dashboard.js
│   │   │   ├── 📄 Login.js
│   │   │   ├── 📄 Register.js
│   │   │   ├── 📄 ViewDetails.js
│   │   │   └── 📄 interview.js
│   │   ├── 📁 utils/
│   │   │   └── 📄 api.js
│   │   ├── 🎨 App.css
│   │   ├── 📄 App.js
│   │   ├── 📄 App.test.js
│   │   ├── 🎨 index.css
│   │   ├── 📄 index.js
│   │   ├── 🖼️ logo.svg
│   │   ├── 📄 reportWebVitals.js
│   │   └── 📄 setupTests.js
│   ├── ⚙️ .gitignore
│   ├── 📝 README.md
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   ├── 📄 postcss.config.js
│   └── 📄 tailwind.config.js
├── ⚙️ .gitignore
├── 📝 README.md
├── 📄 requirements.txt
└── 🐍 test.py
```


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

![Home Screen](https://github.com/user-attachments/assets/f1e79d6d-0353-4e05-a483-024f1a9d0094)


2. Register Screen

![Register](https://github.com/user-attachments/assets/264a4cbf-cbad-4f3b-a88f-a6606b129faf)



3. Login Screen

![Login](https://github.com/user-attachments/assets/f0cf08ba-2106-45db-80e7-5b5b5510768e)


4. Dashboard

![Dashboard](https://github.com/user-attachments/assets/4dd9737d-bdb9-40ac-a499-b005dec0bc1e)

5. Interview Page

![Interview Page](https://github.com/user-attachments/assets/09faae83-67f2-409b-a79c-b94f32bef7b5)


6. Result Page

![Result Page](https://github.com/user-attachments/assets/7f19ea80-35cb-46c4-9ea9-6e6c6ed61917)
