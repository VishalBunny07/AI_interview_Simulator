IDEAL_CACHE = {}

def get_cached_ideal_answer(question: str):
    return IDEAL_CACHE.get(question)

def set_cached_ideal_answer(question: str, answer: str):
    IDEAL_CACHE[question] = answer
