'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const TestRoles = () => {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('student');

  const testUsers = {
    student: {
      id: 1,
      username: 'john_student',
      full_name: 'John Student',
      email: 'john@student.edu',
      role: 'student' as const,
      college_id: 1,
      batch: 'CS-6A',
      course: 'Computer Science',
      semester: '6th',
      student_id: 'CS2021001',
      is_active: true,
      is_verified: true,
      created_at: '2025-01-15T00:00:00Z'
    },
    faculty: {
      id: 2,
      username: 'sarah_professor',
      full_name: 'Dr. Sarah Professor',
      email: 'sarah@faculty.edu',
      role: 'faculty' as const,
      college_id: 1,
      department: 'Computer Science',
      employee_id: 'FAC2020001',
      designation: 'Associate Professor',
      is_active: true,
      is_verified: true,
      created_at: '2024-08-15T00:00:00Z'
    },
    organization: {
      id: 3,
      username: 'tech_corp_recruiter',
      full_name: 'Tech Corp Recruiter',
      email: 'recruiter@techcorp.com',
      role: 'organization' as const,
      company_name: 'Tech Corp',
      industry: 'Technology',
      is_active: true,
      is_verified: true,
      created_at: '2024-06-01T00:00:00Z'
    },
    admin: {
      id: 4,
      username: 'system_admin',
      full_name: 'System Administrator',
      email: 'admin@system.edu',
      role: 'admin' as const,
      permissions: ['all'],
      is_active: true,
      is_verified: true,
      created_at: '2024-01-01T00:00:00Z'
    }
  };

  const handleLogin = (role: string) => {
    const user = testUsers[role as keyof typeof testUsers];
    
    console.log('Test-roles - Logging in user:', user);
    
    // Store user data in localStorage to simulate login
    localStorage.setItem('authToken', 'test-token-' + role);
    localStorage.setItem('userData', JSON.stringify(user));
    
    console.log('Test-roles - Stored data, redirecting to dashboard');
    
    // Redirect to dashboard which will route based on role
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
      <div className="bg-black/40 border border-white/10 rounded-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Test Role-Based Dashboard</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Select Role to Test:</label>
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-black/40 text-white border border-white/20 rounded px-3 py-2"
              title="Select role to test"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty/Teacher</option>
              <option value="organization">Organization</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <button 
            onClick={() => handleLogin(selectedRole)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors"
          >
            Login as {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
          </button>
          
          <div className="mt-6 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
            <h3 className="text-blue-300 font-medium mb-2">What to expect:</h3>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• <strong>Student:</strong> Networking, clubs, read-only timetable</li>
              <li>• <strong>Faculty:</strong> Course management, editable timetable</li>
              <li>• <strong>Organization:</strong> Recruitment tools, event management</li>
              <li>• <strong>Admin:</strong> System management, global timetable editing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRoles;
