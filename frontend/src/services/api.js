import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only auto-redirect on 401 for certain endpoints that should definitely redirect
    // Let Redux actions handle 401 errors for other endpoints gracefully
    if (error.response?.status === 401) {
      const config = error.config;
      
      // Don't auto-redirect for profile updates and other user actions
      // Let the Redux actions handle these 401s
      if (config?.url?.includes('/auth/profile') || 
          config?.url?.includes('/auth/verify')) {
        return Promise.reject(error);
      }
      
      // Only auto-redirect for critical auth failures
      console.log('Critical auth failure, redirecting to login');
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
