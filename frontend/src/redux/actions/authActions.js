import api from '../../services/api';
import {
  AUTH_LOADING,
  AUTH_SUCCESS,
  AUTH_FAILURE,
  LOGOUT,
  CLEAR_AUTH_ERROR,
  SET_USER,
  UPDATE_USER
} from './types';

// Set token in localStorage and api defaults
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    // The api interceptor will handle adding the Bearer token
  } else {
    localStorage.removeItem('token');
  }
};

// Load user from token
export const loadUser = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    setAuthToken(token);
    
    try {
      dispatch({ type: AUTH_LOADING });
      
      const res = await api.get('/auth/verify');
      
      dispatch({
        type: AUTH_SUCCESS,
        payload: {
          token,
          user: res.data.user
        }
      });
    } catch (error) {
      console.error('Load user error:', error);
      dispatch({
        type: AUTH_FAILURE,
        payload: error.response?.data?.message || 'Failed to load user'
      });
      setAuthToken(null);
    }
  }
};

// Register user
export const register = (userData) => async (dispatch) => {
  try {
    dispatch({ type: AUTH_LOADING });
    
    const res = await api.post('/auth/register', userData);
    
    const { token, user } = res.data;
    
    setAuthToken(token);
    
    dispatch({
      type: AUTH_SUCCESS,
      payload: {
        token,
        user
      }
    });
    
    return { success: true, message: res.data.message };
  } catch (error) {
    console.error('Registration error:', error);
    const errorMessage = error.response?.data?.message || 'Registration failed';
    const errors = error.response?.data?.errors || [];
    
    dispatch({
      type: AUTH_FAILURE,
      payload: errorMessage
    });
    
    return { 
      success: false, 
      message: errorMessage, 
      errors 
    };
  }
};

// Login user
export const login = (email, password) => async (dispatch) => {
  try {
    console.log('Attempting login for:', email);
    
    // Clear any existing auth state before attempting login
    setAuthToken(null);
    dispatch({ type: AUTH_LOADING });
    
    const res = await api.post('/auth/login', { email, password });
    console.log('Login response:', res.data);
    
    const { token, user } = res.data;
    
    setAuthToken(token);
    
    dispatch({
      type: AUTH_SUCCESS,
      payload: {
        token,
        user
      }
    });
    
    return { success: true, message: res.data.message };
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error response:', error.response?.data);
    const errorMessage = error.response?.data?.message || 'Login failed';
    
    // Clear auth state on login failure
    setAuthToken(null);
    
    dispatch({
      type: AUTH_FAILURE,
      payload: errorMessage
    });
    
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};

// Logout user
export const logout = () => (dispatch) => {
  setAuthToken(null);
  dispatch({ type: LOGOUT });
};

// Clear auth error
export const clearAuthError = () => (dispatch) => {
  dispatch({ type: CLEAR_AUTH_ERROR });
};

// Get user profile
export const getUserProfile = () => async (dispatch) => {
  try {
    const res = await api.get('/auth/profile');
    
    dispatch({
      type: SET_USER,
      payload: res.data.user
    });
    
    return { success: true, user: res.data.user };
  } catch (error) {
    console.error('Get profile error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to get profile' 
    };
  }
};

// Update user profile
export const updateProfile = (profileData) => async (dispatch) => {
  try {
    console.log('Redux updateProfile - sending data:', profileData);
    console.log('Redux updateProfile - token exists:', !!localStorage.getItem('token'));
    
    const res = await api.put('/auth/profile', profileData);
    
    console.log('Redux updateProfile - response:', res.data);
    
    dispatch({
      type: UPDATE_USER,
      payload: res.data.user
    });
    
    return { success: true, message: res.data.message };
  } catch (error) {
    console.error('Redux updateProfile error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    if (error.response?.status === 401) {
      // Token is invalid or expired, logout user
      console.log('Authentication failed, logging out user');
      dispatch(logout());
    } else {
      dispatch({
        type: AUTH_FAILURE,
        payload: error.response?.data?.message || 'Failed to update profile' 
      });
    }
    
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to update profile',
      errors: error.response?.data?.errors || []
    };
  }
};
