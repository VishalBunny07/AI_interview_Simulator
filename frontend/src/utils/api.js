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


export default api;
