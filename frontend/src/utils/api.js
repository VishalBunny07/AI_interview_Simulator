import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

// simple retry once on network failure
api.interceptors.response.use(
  res => res,
  async error => {
    const config = error.config;
    if (!config || config.__retry) return Promise.reject(error);
    config.__retry = true;
    return api(config);
  }
);


// Auth APIs
export const loginUser = async (email, password) => {
  const response = await api.post(
    '/auth/login',
    { email, password },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

export const registerUser = async (full_name, email, password) => {
  const response = await api.post(
    '/auth/register',
    { full_name, email, password },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return response.data;
};

// Interview API (multipart)
export const uploadResume = async (formData) => {
  const response = await api.post(
    '/interview/upload-resume',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

// get previous questions
export const getPreviousSessions = async (user_id) => {
  const response = await api.get(`/interview/sessions/${user_id}`);
  return response.data;
};

//for interview results

export const getInterviewDetails = async (sessionId) => {
  const response = await api.get(`/interview/session/${sessionId}`);
  return response.data;
};

export const getSessionDetails = async (sessionId) => {
  const response = await api.get(`/interview/session/${sessionId}`);
  return response.data;
}

//for scoring answers
export const scoreInterview = async (payload) => {
  const response = await api.post("/interview/score-session", payload);
  return response.data;
};


//for getting interviewer reactions
export async function getInterviewerReactions(sessionId) {
  const res = await fetch(`/api/interview/interviewer-reactions/${sessionId}`);
  return res.json();
}

//Live Followup Questions
export const getLiveFollowup = async (question, answer) => {
  const res = await api.post("/interview/live-followup", {
    question,
    answer
  });
  return res.data;
};


//get score progress
export const getScoreProgress = async (sessionId) => {
  const res = await api.get(`/interview/score-progress/${sessionId}`);
  return res.data;
};

// Attach user ID to each request (if available)
api.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem("user_id");

    if (userId) {
      config.headers["X-USER-ID"] = userId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 and 403 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem("user_id");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


export default api;
