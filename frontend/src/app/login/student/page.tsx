'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthView } from '../../../types/auth';
import LoginForm from '../../../components/LoginForm';
import RegisterForm from '../../../components/RegisterForm';
import LottieAnimation from '../../../components/LottieAnimation';
import Image from 'next/image';

const Logo = () => (
  <div className="flex items-center space-x-3">
    <Image 
      src="/CampusBuddyLogo.png" 
      alt="Campus Buddy Logo" 
      width={128} 
      height={128} 
      className="w-32 h-auto min-w-32"
    />
  </div>
);

export default function StudentLogin() {
  const [view, setView] = useState<AuthView>(AuthView.Login);
  const router = useRouter();

  const handleRegisterSuccess = useCallback(() => {
    // In a real app, you'd navigate to interests page or dashboard
    router.push('/student/interests');
  }, [router]);

  const switchView = useCallback((newView: AuthView) => {
    setView(newView);
  }, []);

  return (
    <div className="min-h-screen bg-[#EADFFD] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl lg:max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          {/* Back Button */}
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

          {/* Sample Credentials for Testing */}
          {view === AuthView.Login && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Sample Student Credentials for Testing:</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <div><strong>Email:</strong> arjun.sharma@mpstme.edu.in</div>
                <div><strong>Password:</strong> testpassword123</div>
                <div className="text-blue-600 text-xs mt-1">Use these credentials to test the student login</div>
              </div>
            </div>
          )}
          
          {view === AuthView.Login ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h1>
              <p className="text-gray-600 mb-8">Welcome back! Please enter your details.</p>
              <LoginForm onSwitchView={() => switchView(AuthView.Register)} userType="student" />
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h1>
              <p className="text-gray-600 mb-8">Let&apos;s get you started!</p>
              <RegisterForm onSuccess={handleRegisterSuccess} onSwitchView={() => switchView(AuthView.Login)} />
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center justify-center bg-[#2D2D2D] p-8">
          <LottieAnimation 
            src="/ConnectionPeople.json" 
            className="w-full h-auto max-w-lg"
          />
        </div>

      </div>
    </div>
  );
}
