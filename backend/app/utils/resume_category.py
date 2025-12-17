def detect_resume_category(text: str) -> str:
    text = text.lower()

    it_keywords = [
        "python", "java", "javascript", "react", "node", "sql",
        "machine learning", "deep learning", "api", "backend", "frontend",
        "docker", "kubernetes", "cloud", "aws", "azure", "devops"
    ]

    hr_keywords = [
        "recruitment", "talent", "hr", "human resource",
        "payroll", "onboarding", "compliance", "employee relations"
    ]

    managerial_keywords = [
        "manager", "leadership", "team lead", "project management",
        "stakeholder", "strategy", "planning", "execution"
    ]

    scores = {
        "IT": sum(k in text for k in it_keywords),
        "HR": sum(k in text for k in hr_keywords),
        "Managerial": sum(k in text for k in managerial_keywords),
    }

    return max(scores, key=scores.get) if max(scores.values()) > 0 else "General"
