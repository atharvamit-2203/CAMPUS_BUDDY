import React, { useState, useCallback } from 'react';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchView: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchView }) => {
  const [collegeId, setCollegeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please enter the same password.');
      return;
    }
    setError('');
    console.log('Registering with:', { collegeId, fullName, username, course, year });
    onSuccess();
  }, [collegeId, fullName, username, course, year, password, confirmPassword, onSuccess]);

  const inputStyles = "block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputStyles} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={inputStyles} required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">College ID</label>
        <input type="text" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className={inputStyles} required />
      </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
          <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} className={inputStyles} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input type="text" value={year} onChange={(e) => setYear(e.target.value)} className={inputStyles} required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyles} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyles} required />
      </div>
      
      {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
      
      <button
        type="submit"
        className="w-full bg-gray-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-transform transform hover:scale-105 mt-4"
      >
        Register
      </button>
       <p className="text-center text-sm text-gray-600 pt-2">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchView} className="font-medium text-purple-600 hover:text-purple-500">
          Sign in
        </button>
      </p>
    </form>
  );
};

export default RegisterForm;