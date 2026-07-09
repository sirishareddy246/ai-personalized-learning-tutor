import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

// Attach user id from localStorage if present
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('user_id');
  if (userId) config.headers['x-user-id'] = userId;
  return config;
});

export const uploadDocument = (formData, onProgress) =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
  });

export const getDocuments = () => api.get('/documents');

export const askQuestion = (question, document_id) =>
  api.post('/ask', { question, document_id });

export const generateQuiz = (document_id, difficulty, num_questions) =>
  api.post('/generate-quiz', { document_id, difficulty, num_questions });

export const submitQuiz = (quiz_id, user_answers) =>
  api.post('/submit-quiz', { quiz_id, user_answers });

export const getFeedback = (id) => api.get(`/feedback/${id}`);

export default api;
