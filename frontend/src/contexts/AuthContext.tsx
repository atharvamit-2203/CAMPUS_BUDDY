'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { User, AuthState, RegisterFormData } from '@/types/auth';
import { authAPI } from '@/services/api';

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_INTENDED_ROUTE'; payload: string | null };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  intendedRoute: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        intendedRoute: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        intendedRoute: null,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_INTENDED_ROUTE':
      return {
        ...state,
        intendedRoute: action.payload,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
  logout: () => void;
  setIntendedRoute: (path: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token and get user data
      authAPI.getCurrentUser()
        .then((user) => {
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem('authToken');
          localStorage.removeItem('userRole');
          dispatch({ type: 'SET_LOADING', payload: false });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.login({ email, password });
      
      // Store token and user role
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('userRole', response.user.role);
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: {
            ...response.user,
            college_id: Number(response.user.college_id) || undefined,
role: response.user.role as 'student' | 'faculty' | 'organization' | 'staff' | 'admin',
            is_active: true,
            is_verified: true,
            created_at: new Date().toISOString()
          }, 
          token: response.access_token 
        } 
      });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (userData: RegisterFormData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await authAPI.register(userData);
      
      // Store token and user role
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('userRole', response.user.role);
      
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          user: { 
            ...response.user, 
            college_id: Number(response.user.college_id) || undefined,
role: response.user.role as 'student' | 'faculty' | 'organization' | 'staff' | 'admin',
            is_active: true,
            is_verified: true,
            created_at: new Date().toISOString() 
          }, 
          token: response.access_token 
        } 
      });
      // Redirect to dashboard based on role (default student)
      try {
        if (typeof window !== 'undefined') {
          const role = response.user.role;
          if (role === 'faculty') window.location.href = '/dashboard/faculty';
          else if (role === 'organization') window.location.href = '/dashboard/organization';
          else if (role === 'admin') window.location.href = '/dashboard/admin';
          else window.location.href = '/dashboard/student';
        }
      } catch {}
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    dispatch({ type: 'LOGOUT' });
    if (typeof window !== 'undefined') {
      // Redirect to the first page of Campus Connect
      window.location.href = '/';
    }
  };

  const setIntendedRoute = useCallback((path: string | null) => {
    dispatch({ type: 'SET_INTENDED_ROUTE', payload: path });
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    setIntendedRoute,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
