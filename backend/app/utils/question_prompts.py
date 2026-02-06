PROMPTS = {

    "IT": [
        "Based on the resume below, ask ONE open-ended interview question. Do NOT ask factual, exam-style, or reading-comprehension questions. Focus on experience, decisions, challenges, or implementation. Resume: {chunk}",
        "Based on the following resume content, ask ONE clear technical interview question:\n{chunk}",
        "Generate ONE coding or problem-solving interview question using this resume:\n{chunk}",
        "Ask ONE backend, frontend, or system-design interview question from the resume below:\n{chunk}",
        "Create ONE real-world software engineering interview question grounded in this resume:\n{chunk}",
        "Focus on skills, projects, APIs, databases, or architecture. Avoid repetition.\n{chunk}"
    ],

    "HR": [
        "Based on the resume below, ask ONE HR interview question:\n{chunk}",
        "Generate ONE behavioral interview question related to HR responsibilities from this resume:\n{chunk}",
        "Ask ONE interview question about recruitment, onboarding, compliance, or employee relations:\n{chunk}",
        "Create ONE situational HR interview question based on the resume below:\n{chunk}",
        "Focus on communication, conflict resolution, and people management. Avoid repetition.\n{chunk}"
    ],

    "Managerial": [
        "Based on the resume below, ask ONE leadership interview question:\n{chunk}",
        "Generate ONE project-management interview question from this resume:\n{chunk}",
        "Ask ONE decision-making or strategy interview question using this resume:\n{chunk}",
        "Create ONE interview question about stakeholder or team management:\n{chunk}",
        "Focus on leadership, planning, execution, and ownership. Avoid repetition.\n{chunk}"
    ],

    "General": [
        "Ask ONE general interview question based on the resume below:\n{chunk}",
        "Generate ONE experience-based interview question from this resume:\n{chunk}",
        "Ask ONE role-agnostic interview question using the resume content:\n{chunk}",
        "Focus on strengths, experience, and problem-solving. Avoid repetition.\n{chunk}"
    ],

    "Easy": [
        "Ask ONE simple beginner-level interview question based on this resume:\n{chunk}",
        "Generate ONE basic conceptual interview question from the resume:\n{chunk}"
    ],

    "Medium": [
        "Ask ONE intermediate-level interview question requiring explanation or examples:\n{chunk}",
        "Generate ONE practical interview question based on the resume:\n{chunk}"
    ],

    "Hard": [
        "Ask ONE advanced interview question involving edge cases or optimization:\n{chunk}",
        "Generate ONE deep technical or analytical interview question from the resume:\n{chunk}"
    ]
}
