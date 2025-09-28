
import React, { useState, useCallback } from 'react';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchView: () => void;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5 mr-3">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.618-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,36.219,44,30.561,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log('Logging in with:', { email, password });
    onSuccess();
  }, [email, password, onSuccess]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          required
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
        />
      </div>
       <div className="text-right">
        <a href="#" className="text-sm font-medium text-purple-600 hover:text-purple-500">
          Forgot Password?
        </a>
      </div>
      <button
        type="submit"
        className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-transform transform hover:scale-105"
      >
        Login
      </button>
      <p className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchView} className="font-medium text-purple-600 hover:text-purple-500">
          Sign up
        </button>
      </p>
    </form>
  );
};

export default LoginForm;
