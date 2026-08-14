import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper to format clean error messages from backend responses
export function getErrorMessage(error) {
  if (error.response && error.response.data && error.response.data.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected network error occurred.';
}

export const fetchBoard = async (boardId = 1) => {
  const res = await api.get(`/boards/${boardId}`);
  return res.data;
};

export const fetchBoardStats = async (boardId = 1) => {
  const res = await api.get(`/boards/${boardId}/stats`);
  return res.data;
};

export const fetchTasks = async ({ priority, search, boardId = 1 } = {}) => {
  const params = {};
  if (priority && priority !== 'All') params.priority = priority;
  if (search && search.trim()) params.search = search.trim();
  if (boardId) params.board_id = boardId;

  const res = await api.get('/tasks', { params });
  return res.data;
};

export const createTask = async ({ column_id, title, description, priority = 'Medium' }) => {
  const res = await api.post('/tasks', {
    column_id,
    title,
    description,
    priority
  });
  return res.data;
};

export const updateTask = async (taskId, { title, description, priority }) => {
  const res = await api.put(`/tasks/${taskId}`, {
    title,
    description,
    priority
  });
  return res.data;
};

export const moveTask = async (taskId, column_id) => {
  const res = await api.patch(`/tasks/${taskId}/move`, {
    column_id
  });
  return res.data;
};

export const deleteTask = async (taskId) => {
  const res = await api.delete(`/tasks/${taskId}`);
  return res.data;
};

export default api;
