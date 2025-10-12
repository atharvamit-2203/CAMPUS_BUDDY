'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const DashboardPage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Dashboard - Auth state:', { isLoading, isAuthenticated, user });
    
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        console.log('Dashboard - Not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('Dashboard - User role:', user.role);
      
      // Route to role-specific dashboard
      switch (user.role) {
        case 'student':
          console.log('Dashboard - Redirecting to student dashboard');
          router.push('/dashboard/student');
          break;
        case 'faculty':
          console.log('Dashboard - Redirecting to faculty dashboard');
          router.push('/dashboard/faculty');
          break;
        case 'organization':
          console.log('Dashboard - Redirecting to organization dashboard');
          router.push('/dashboard/organization');
          break;
        case 'admin':
          console.log('Dashboard - Redirecting to admin dashboard');
          router.push('/dashboard/admin');
          break;
        default:
          console.log('Dashboard - Unknown role, redirecting to admin dashboard');
          router.push('/dashboard/admin');
          break;
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <h2 className="text-white text-xl mt-4">Loading your dashboard...</h2>
        </div>
      </div>
    );
  }

  return null;
};

export default DashboardPage;
