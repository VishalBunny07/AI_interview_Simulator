INTERVIEWER_STATE = {}

def init_interviewer(session_id):
    INTERVIEWER_STATE[session_id] = []
    
def add_reaction(session_id, reaction):
    if session_id in INTERVIEWER_STATE:
        INTERVIEWER_STATE[session_id].append(reaction)
        
def get_reactions(session_id):
    return INTERVIEWER_STATE.get(session_id, [])

def clear_reactions(session_id: int):
    INTERVIEWER_STATE.pop(session_id, None)

def clear_interviewer(session_id):
    INTERVIEWER_STATE.pop(session_id, None)