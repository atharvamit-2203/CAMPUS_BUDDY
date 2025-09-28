'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchView: () => void;
  userType: 'student' | 'faculty' | 'organization';
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchView, userType }) => {
  const [collegeId, setCollegeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please enter the same password.');
      return;
    }
    setError('');

    try {
      setIsLoading(true);
      await register({
        college_id: collegeId,
        full_name: fullName,
        username,
        email,
        password,
        course,
        year: Number(year) || 1,
        role: userType,
      });
      onSuccess();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err) {
        setError((err as Error).message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [collegeId, fullName, username, email, course, year, password, confirmPassword, userType, register, onSuccess]);

  const inputStyles = "block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input 
            type="text" 
            id="fullName"
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            className={inputStyles} 
            required 
          />
        </div>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input 
            type="text" 
            id="username"
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className={inputStyles} 
            required 
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input 
          type="email" 
          id="email"
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          className={inputStyles} 
          required 
        />
      </div>

      <div>
        <label htmlFor="collegeId" className="block text-sm font-medium text-gray-700 mb-1">College ID</label>
        <input 
          type="text" 
          id="collegeId"
          value={collegeId} 
          onChange={(e) => setCollegeId(e.target.value)} 
          className={inputStyles} 
          required 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <input 
            type="text" 
            id="course"
            value={course} 
            onChange={(e) => setCourse(e.target.value)} 
            className={inputStyles} 
            required 
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input 
            type="number" 
            id="year"
            min="1"
            max="8"
            value={year} 
            onChange={(e) => setYear(e.target.value)} 
            className={inputStyles} 
            required 
          />
        </div>
      </div>

      <div>
        <label htmlFor="password-register" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input 
          type="password" 
          id="password-register"
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className={inputStyles} 
          required 
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input 
          type="password" 
          id="confirmPassword"
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          className={inputStyles} 
          required 
        />
      </div>
      
      {error && <p className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">{error}</p>}
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gray-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-transform transform hover:scale-105 mt-4 disabled:opacity-60"
      >
        {isLoading ? 'Registering...' : 'Register'}
      </button>
       <p className="text-center text-sm text-gray-600 pt-2">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchView} className="font-medium text-purple-600 hover:text-purple-500" disabled={isLoading}>
          Sign in
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;
