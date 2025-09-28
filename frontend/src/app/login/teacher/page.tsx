'use client';

import React, { useState, useCallback } from 'react';
import LottieAnimation from '@/components/LottieAnimation';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeacherLogin() {
  const router = useRouter();
  const [orgId, setOrgId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSuccess = useCallback(() => {
    // Navigate to the teacher dashboard on successful login
  router.push('/teacher');
  }, [router]);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!orgId.trim() || !password.trim()) {
      setError('Please enter both Faculty ID and password.');
      return;
    }
    setError('');
    // In a real app, you would perform authentication here
  console.log('Logging in with:', { orgId, password });
    handleLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-[#EADFFD] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl lg:max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <Link 
              href="/" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Role Selection
            </Link>
          </div>

          <div>
            <div className="flex justify-center mb-4">
              <Image
                src="/CampusBuddyLogo.png"
                alt="CampusBuddy Logo"
                width={120}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Organization Sign in</h1>
            <p className="text-gray-600 mb-8">Welcome! Please enter your organization's details.</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label 
                  htmlFor="orgId" 
                  className="block text-sm font-medium text-gray-700"
                >
                  Organization ID
                </label>
                <div className="mt-1">
                  <input
                    id="orgId"
                    name="orgId"
                    type="text"
                    autoComplete="username"
                    required
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                    placeholder="your_faculty_id"
                  />
                </div>
              </div>

              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="hidden md:flex bg-[#2D2D2D] items-center justify-center">
          <LottieAnimation src="/status portal.json" className="w-[40rem] h-[40rem]" />
        </div>

      </div>
    </div>
  );
}
