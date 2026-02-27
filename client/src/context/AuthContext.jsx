import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, loading: false };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('velora_token');
    if (token) {
      api.setToken(token);
      api.getProfile()
        .then(user => dispatch({ type: 'SET_USER', payload: user }))
        .catch(() => {
          api.setToken(null);
          dispatch({ type: 'LOGOUT' });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (data) => {
    const result = await api.login(data);
    api.setToken(result.access_token);
    dispatch({ type: 'SET_USER', payload: result.user });
    return result;
  };

  const register = async (data) => {
    const result = await api.register(data);
    api.setToken(result.access_token);
    dispatch({ type: 'SET_USER', payload: result.user });
    return result;
  };

  const logout = () => {
    api.setToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (data) => {
    dispatch({ type: 'UPDATE_USER', payload: data });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
