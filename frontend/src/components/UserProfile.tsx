'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Not logged in or user data not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        User Profile Information
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <p className="mt-1 text-lg text-gray-900 dark:text-white">
            {user.full_name || 'Not provided'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Username
          </label>
          <p className="mt-1 text-lg text-gray-900 dark:text-white">
            {user.username || 'Not provided'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <p className="mt-1 text-lg text-gray-900 dark:text-white">
            {user.email || 'Not provided'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Role
          </label>
          <p className="mt-1 text-lg text-gray-900 dark:text-white capitalize">
            {user.role || 'Not provided'}
          </p>
        </div>
        
        {user.role === 'faculty' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Employee ID
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                {user.employee_id || 'Not provided'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Designation
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                {user.designation || 'Not provided'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Department
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                {user.department || 'Not provided'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Specialization
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                {user.specialization || 'Not provided'}
              </p>
            </div>
          </>
        )}
        
        {user.role === 'student' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Student ID
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                {user.student_id || 'Not provided'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Course
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                {user.course || 'Not provided'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Branch
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                {user.branch || 'Not provided'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Semester
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                {user.semester || 'Not provided'}
              </p>
            </div>
          </>
        )}
        
        {user.role === 'organization' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Organization Type
            </label>
            <p className="mt-1 text-lg text-gray-900 dark:text-white">
              {user.organization_type || 'Not provided'}
            </p>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            College ID
          </label>
          <p className="mt-1 text-lg text-gray-900 dark:text-white">
            {user.college_id || 'Not provided'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <p className="mt-1 text-lg text-gray-900 dark:text-white">
            {user.is_active ? 'Active' : 'Inactive'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Verification Status
          </label>
          <p className="mt-1 text-lg text-gray-900 dark:text-white">
            {user.is_verified ? 'Verified' : 'Not Verified'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Member Since
          </label>
          <p className="mt-1 text-lg text-gray-900 dark:text-white">
            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not provided'}
          </p>
        </div>
      </div>
      
      {user.bio && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Bio
          </label>
          <p className="mt-1 text-gray-900 dark:text-white">
            {user.bio}
          </p>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Debug Information
        </h3>
        <pre className="text-sm text-gray-600 dark:text-gray-300 overflow-x-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default UserProfile;
