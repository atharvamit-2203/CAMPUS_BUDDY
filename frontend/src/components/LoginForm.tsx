'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchView: () => void;
  userType?: 'student' | 'faculty' | 'organization';
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchView, userType = 'student' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      
      // Redirect based on user type after successful login
      if (userType === 'student') {
        router.push('/dashboard/student');
      } else if (userType === 'faculty') {
        router.push('/dashboard/faculty');
      } else if (userType === 'organization') {
        router.push('/dashboard/organization');
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error && typeof error === 'object') {
        if ('message' in error) {
          const errorMessage = (error as Error).message;
          if (errorMessage.includes('fetch')) {
            setError('Cannot connect to server. Please ensure the backend server is running on port 8000.');
          } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
            setError('Invalid email or password. Please check your credentials.');
          } else {
            setError(`Login failed: ${errorMessage}`);
          }
        } else if ('response' in error) {
          const axiosError = error as { response?: { data?: { detail?: string } } };
          setError(axiosError.response?.data?.detail || 'Login failed. Please check your credentials.');
        } else {
          setError('Login failed. Please check your internet connection and try again.');
        }
      } else if (typeof error === 'string') {
        setError(error);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, login, router, userType, onSuccess]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="password-login" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          id="password-login"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          required
          disabled={isLoading}
        />
      </div>
       <div className="text-right">
        <a href="#" className="text-sm font-medium text-purple-600 hover:text-purple-500">
          Forgot Password?
        </a>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <button type="button" onClick={onSwitchView} className="font-medium text-purple-600 hover:text-purple-500" disabled={isLoading}>
          Sign up
        </button>
      </p>
    </form>
  );
};

export default LoginForm;
