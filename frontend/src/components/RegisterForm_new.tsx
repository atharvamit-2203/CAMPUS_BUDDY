'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/services/api';
import { College } from '@/types/auth';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchView: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchView }) => {
  const [collegeId, setCollegeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const { register, isLoading } = useAuth();

  // Load colleges on component mount
  useEffect(() => {
    const loadColleges = async () => {
      try {
        const collegeData = await authAPI.getColleges();
        setColleges(collegeData);
      } catch (err) {
        console.error('Failed to load colleges:', err);
        setError('Failed to load colleges. Please refresh the page.');
      } finally {
        setLoadingColleges(false);
      }
    };

    loadColleges();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please enter the same password.');
      return;
    }

    if (!collegeId) {
      setError('Please select a college.');
      return;
    }

    try {
      await register({
        college_id: collegeId,
        full_name: fullName,
        username,
        email,
        password,
        course,
        semester: semester || '1',
        role: 'student' // Default to student role
      });
      console.log('Registration successful');
      onSuccess();
    } catch (err: unknown) {
      console.error('Registration failed:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setError(axiosError.response?.data?.detail || 'Registration failed. Please try again.');
      } else {
        setError('Registration failed. Please try again.');
      }
    }
  }, [collegeId, fullName, username, email, course, semester, password, confirmPassword, register, onSuccess]);

  const inputStyles = "block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
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
            disabled={isLoading}
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
            disabled={isLoading}
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
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="college" className="block text-sm font-medium text-gray-700 mb-1">College</label>
        <select 
          id="college"
          value={collegeId} 
          onChange={(e) => setCollegeId(e.target.value)} 
          className={inputStyles} 
          required 
          disabled={isLoading || loadingColleges}
        >
          <option value="">
            {loadingColleges ? 'Loading colleges...' : 'Select your college'}
          </option>
          {colleges.map((college) => (
            <option key={college.id} value={college.id}>
              {college.name} - {college.city}, {college.state}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <select 
            id="course"
            value={course} 
            onChange={(e) => setCourse(e.target.value)} 
            className={inputStyles} 
            required 
            disabled={isLoading}
          >
            <option value="">Select Course</option>
            <option value="MBA TECH">MBA TECH</option>
            <option value="B TECH CE">B TECH CE</option>
            <option value="B TECH AIDS">B TECH AIDS</option>
          </select>
        </div>
        <div>
          <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
          <select 
            id="semester"
            value={semester} 
            onChange={(e) => setSemester(e.target.value)} 
            className={inputStyles} 
            required
            disabled={isLoading}
          >
            <option value="">Select Semester</option>
            <option value="1">1</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="7">7</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="password-register" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            id="password-register"
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className={inputStyles} 
            required 
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>
      </div>

      <button
        type="submit"
        className={`w-full bg-gray-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-transform transform hover:scale-105 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchView} className="font-medium text-purple-600 hover:text-purple-500">
          Log in
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;
