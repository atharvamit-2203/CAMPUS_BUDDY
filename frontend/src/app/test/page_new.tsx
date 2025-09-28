'use client';

import React, { useState } from 'react';
import { authAPI } from '@/services/api';

export default function TestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testCORS = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/test-cors');
      const data = await response.json();
      setResult(`CORS Test Successful: ${JSON.stringify(data)}`);
    } catch (error) {
      setResult(`CORS Test Failed: ${error}`);
    }
    setLoading(false);
  };

  const testAPI = async () => {
    setLoading(true);
    try {
      const data = await authAPI.testConnection();
      setResult(`API Test Successful: ${JSON.stringify(data)}`);
    } catch (error) {
      setResult(`API Test Failed: ${error}`);
    }
    setLoading(false);
  };

  const testPassword = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/auth/test-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setResult(`Password Test: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Password Test Failed: ${error}`);
    }
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await authAPI.login({
        email: 'test@faculty.com',
        password: 'testpassword123'
      });
      setResult(`Login Test Successful: ${JSON.stringify(response, null, 2)}`);
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : error instanceof Error ? error.message : 'Unknown error';
      setResult(`Login Test Failed: ${errorMessage}`);
    }
    setLoading(false);
  };

  const createTestUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/auth/test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setResult(`Test User Creation: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      setResult(`Test User Creation Failed: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Backend Connection Test
        </h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testCORS}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Test CORS
          </button>
          
          <button
            onClick={testAPI}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 ml-4"
          >
            Test API Service
          </button>
          
          <button
            onClick={testPassword}
            disabled={loading}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 ml-4"
          >
            Test Bcrypt
          </button>
          
          <button
            onClick={createTestUser}
            disabled={loading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 ml-4"
          >
            Create Test User
          </button>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 ml-4"
          >
            Test Login
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {result || 'Click a button to run a test...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
