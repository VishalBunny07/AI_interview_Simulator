SCORING_PROGRESS = {}

def init_progress(session_id: int, total: int):
    SCORING_PROGRESS[session_id] = {"current": 0, "total": total}

def update_progress(session_id: int):
    if session_id in SCORING_PROGRESS:
        SCORING_PROGRESS[session_id]["current"] += 1

def get_progress(session_id: int):
    return SCORING_PROGRESS.get(session_id, {"current": 0, "total": 0})

def clear_progress(session_id: int):
    SCORING_PROGRESS.pop(session_id, None)
