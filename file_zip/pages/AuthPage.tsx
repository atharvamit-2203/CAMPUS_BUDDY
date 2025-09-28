import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthView } from '../types';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import LottieAnimation from '../components/LottieAnimation';
import animationData from '../components/ConnectionPeopleAnimation';
import CampusBuddyLogo from '../CampusBuddyLogo.png';

const Logo = () => (
  <div className="flex items-center space-x-2">
    <img src={CampusBuddyLogo} alt="Campus Buddy Logo" className="h-32 w-auto min-w-32" />
  </div>
);

const AuthPage: React.FC = () => {
  const [view, setView] = useState<AuthView>(AuthView.Login);
  const navigate = useNavigate();

  const handleRegisterSuccess = useCallback(() => {
    navigate('/interests');
  }, [navigate]);
  
  const handleLoginSuccess = useCallback(() => {
    // In a real app, you'd navigate to the student dashboard
    alert("Login successful! Redirecting to dashboard...");
  }, []);

  const switchView = useCallback((newView: AuthView) => {
    setView(newView);
  }, []);

  return (
    <div className="min-h-screen bg-[#EADFFD] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl lg:max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <Logo />
          </div>
          
          {view === AuthView.Login ? (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in</h1>
              <p className="text-gray-600 mb-8">Welcome back! Please enter your details.</p>
              <LoginForm onSuccess={handleLoginSuccess} onSwitchView={() => switchView(AuthView.Register)} />
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h1>
              <p className="text-gray-600 mb-8">Let's get you started!</p>
              <RegisterForm onSuccess={handleRegisterSuccess} onSwitchView={() => switchView(AuthView.Login)} />
            </div>
          )}
        </div>

    <div className="hidden md:flex items-center justify-center bg-[#2D2D2D] p-8">
      <LottieAnimation animationData={animationData} />
    </div>

      </div>
    </div>
  );
};

export default AuthPage;