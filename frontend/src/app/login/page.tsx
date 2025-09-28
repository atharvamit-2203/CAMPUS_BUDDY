'use client';

import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Choose Your Role</h1>
          <p className="text-gray-600">Select how you&apos;d like to access Campus Connect</p>
        </div>
        
        <div className="space-y-4">
          <Link href="/login/student" className="block">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎓</span>
                <div>
                  <h3 className="font-semibold">Student Login</h3>
                  <p className="text-sm text-blue-100">Access your courses and connect with peers</p>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/login/admin" className="block">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">👨‍🏫</span>
                <div>
                  <h3 className="font-semibold">Admin Login</h3>
                  <p className="text-sm text-green-100">Manage the credentials and administration</p>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/login/faculty" className="block">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-semibold">Faculty Login</h3>
                  <p className="text-sm text-indigo-100">Access faculty dashboard and committee management</p>
                </div>
              </div>
            </div>
          </Link>
          
          <Link href="/login/organization" className="block">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🏢</span>
                <div>
                  <h3 className="font-semibold">Organization Login</h3>
                  <p className="text-sm text-purple-100">Recruit talent and host events</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
