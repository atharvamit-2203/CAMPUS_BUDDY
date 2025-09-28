'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const StudentClubs = () => {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/dashboard/student');
  }, [router]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center text-gray-300">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Clubs section is disabled</h1>
        <p>Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default StudentClubs;
