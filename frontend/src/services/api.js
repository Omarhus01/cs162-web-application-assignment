/**
 * API Service
 * ===========
 * Centralized API calls to the Flask backend.
 * Handles authentication token management and all HTTP requests.
 */

import axios from 'axios';

// Base URL for API (Flask backend)
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: send cookies with requests
});

// Request interceptor - no need to add token, cookies are automatic
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url);
    console.error('Error data:', error.response?.data);
    console.error('Full error:', error);
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      console.log('🚪 Unauthorized - redirecting to login');
      console.log('STOPPING HERE - Check the errors above!');
      // TEMPORARILY DISABLED: window.location.href = '/login';
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// AUTHENTICATION
// =============================================================================

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getUser: () => api.get('/auth/user'),
};

// =============================================================================
// TODO LISTS
// =============================================================================

export const listsAPI = {
  getAll: () => api.get('/lists'),
  getOne: (listId) => api.get(`/lists/${listId}`),
  create: (listData) => api.post('/lists', listData),
  delete: (listId) => api.delete(`/lists/${listId}`),
};

// =============================================================================
// TASKS
// =============================================================================

export const tasksAPI = {
  create: (taskData) => api.post('/tasks', taskData),
  update: (taskId, taskData) => api.put(`/tasks/${taskId}`, taskData),
  delete: (taskId) => api.delete(`/tasks/${taskId}`),
  toggle: (taskId) => api.patch(`/tasks/${taskId}/toggle`),
  collapse: (taskId, collapsed) => 
    api.patch(`/tasks/${taskId}/collapse`, { collapsed }),
  move: (taskId, newListId) => 
    api.patch(`/tasks/${taskId}/move`, { new_list_id: newListId }),
};

export default api;
