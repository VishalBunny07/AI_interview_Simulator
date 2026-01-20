FOLLOWUP_PROMPTS = {
    "clarification": (
        "The candidate's answer was unclear. "
        "Ask a follow-up interview question to clarify their understanding:\n"
        "Question: {question}\nAnswer: {answer}"
    ),

    "depth": (
        "The candidate answered but lacked depth. "
        "Ask a follow-up interview question to probe deeper:\n"
        "Question: {question}\nAnswer: {answer}"
    ),

    "advanced": (
        "The candidate answered well. "
        "Ask a more advanced follow-up interview question:\n"
        "Question: {question}\nAnswer: {answer}"
    ),

    "rephrase": (
        "The candidate gave a meaningless answer. "
        "Ask them to rephrase or explain more clearly:\n"
        "Question: {question}"
    )
}
