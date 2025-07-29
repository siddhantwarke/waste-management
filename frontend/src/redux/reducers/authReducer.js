import {
  AUTH_LOADING,
  AUTH_SUCCESS,
  AUTH_FAILURE,
  LOGOUT,
  CLEAR_AUTH_ERROR,
  SET_USER,
  UPDATE_USER
} from '../actions/types';

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  user: null,
  error: null
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case AUTH_LOADING:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_SUCCESS:
      return {
        ...state,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        user: action.payload.user,
        error: null
      };
    
    case AUTH_FAILURE:
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload
      };
    
    case SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true
      };
    
    case UPDATE_USER:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload
        }
      };
    
    case CLEAR_AUTH_ERROR:
      return {
        ...state,
        error: null
      };
    
    case LOGOUT:
      return {
        ...initialState,
        token: null
      };
    
    default:
      return state;
  }
};

export default authReducer;
