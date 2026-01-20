PROMPTS = {
    "IT": [
        "Generate one technical interview question based on this resume:",
        "Ask a problem-solving or coding-related interview question from this resume:",
        "Generate a system design or backend interview question from this resume:",
        "Ask a real-world software engineering interview question from this resume:",
        "Focus on skills, projects, problem solving. Avoid repetition.\n\n{chunk}"
    ],

    "HR": [
        "Generate one HR interview question based on this resume:",
        "Ask a behavioral interview question related to HR responsibilities:",
        "Generate a question about recruitment, onboarding, or employee relations:",
        "Ask a situational HR interview question from this resume:",
        "Focus on communication, teamwork, conflict handling. Avoid repetition.\n\n{chunk}"
    ],

    "Managerial": [
        "Generate one leadership interview question based on this resume:",
        "Ask a project management interview question from this resume:",
        "Generate a decision-making or strategy interview question:",
        "Ask a stakeholder or team-handling interview question from this resume:",
        "Generate ONE managerial interview question based on the resume below. ",
        "Focus on leadership, decision making, planning. Avoid repetition.\n\n{chunk}"
    ],

    "General": [
        "Generate one general interview question from this resume:",
        "Ask a strengths and experience-based interview question:",
        "Generate a role-agnostic interview question from this resume:",
        "Avoid repetition.\n\n{chunk}"
    ],
    
    
    "Easy": [
        "Ask a simple beginner interview question based on this resume:\n{chunk}",
        "Ask a basic conceptual question from this resume:\n{chunk}"
    ],
     
    "Medium": [
        "Ask an intermediate-level interview question requiring explanation:\n{chunk}",
        "Ask a practical interview question from this resume:\n{chunk}"
    ],
    
    "Hard": [
        "Ask an advanced interview question involving edge cases or optimization:\n{chunk}",
        "Ask a deep technical interview question from this resume:\n{chunk}"
    ]
}