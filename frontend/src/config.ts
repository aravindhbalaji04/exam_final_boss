// API Configuration
// In production, this will be set via environment variable VITE_API_URL
// In development, defaults to localhost
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000'

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
  },
  EXAMS: {
    LIST: `${API_URL}/exams`,
    GET: (id: number) => `${API_URL}/exams/${id}`,
    CREATE: `${API_URL}/exams`,
    QUESTIONS: (examId: number) => `${API_URL}/exams/${examId}/questions`,
    QUESTION: (examId: number, questionId: number) => `${API_URL}/exams/${examId}/questions/${questionId}`,
    ATTEMPTS: (examId: number) => `${API_URL}/exams/${examId}/attempts`,
  },
  ATTEMPTS: {
    CREATE: `${API_URL}/attempts`,
    SUBMIT: (attemptId: number) => `${API_URL}/attempts/${attemptId}/submit`,
    RESULTS: (attemptId: number) => `${API_URL}/attempts/${attemptId}/results`,
    FULLSCREEN_EXIT: (attemptId: number) => `${API_URL}/attempts/${attemptId}/fullscreen-exit`,
  },
  UPLOAD: {
    IMAGE: `${API_URL}/upload-image`,
  },
  DOCS: `${API_URL}/docs`,
}

