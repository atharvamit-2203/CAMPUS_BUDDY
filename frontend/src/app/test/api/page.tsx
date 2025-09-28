'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import dashboardAPI from '@/services/dashboardAPI';

interface ApiTestResult {
  name: string;
  status: 'loading' | 'success' | 'error';
  data: any;
  error?: string;
}

export default function ApiTestPage() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [isTestingInProgress, setIsTestingInProgress] = useState(false);

  const apiTests = [
    {
      name: 'Faculty Timetable',
      test: () => dashboardAPI.faculty.getTimetable()
    },
    {
      name: 'Faculty Students',
      test: () => dashboardAPI.faculty.getStudents()
    },
    {
      name: 'Faculty Events',
      test: () => dashboardAPI.faculty.getEvents()
    },
    {
      name: 'Student Timetable',
      test: () => dashboardAPI.student.getTimetable()
    },
    {
      name: 'Student Events',
      test: () => dashboardAPI.student.getEvents()
    },
    {
      name: 'Student Organizations',
      test: () => dashboardAPI.student.getOrganizations()
    },
    {
      name: 'All Events',
      test: () => dashboardAPI.shared.events.getAllEvents()
    },
    {
      name: 'Canteen Menu',
      test: () => dashboardAPI.shared.canteen.getMenu()
    },
    {
      name: 'Available Rooms',
      test: () => dashboardAPI.shared.bookings.getAvailableRooms()
    }
  ];

  const runAllTests = async () => {
    setIsTestingInProgress(true);
    setTestResults([]);

    for (const apiTest of apiTests) {
      const result: ApiTestResult = {
        name: apiTest.name,
        status: 'loading',
        data: null
      };

      setTestResults(prev => [...prev, result]);

      try {
        console.log(`Testing ${apiTest.name}...`);
        const response = await apiTest.test();
        
        result.status = 'success';
        result.data = response;
        
        setTestResults(prev => 
          prev.map(r => r.name === apiTest.name ? result : r)
        );
        
        console.log(`✅ ${apiTest.name} success:`, response);
      } catch (error) {
        result.status = 'error';
        result.error = error instanceof Error ? error.message : 'Unknown error';
        
        setTestResults(prev => 
          prev.map(r => r.name === apiTest.name ? result : r)
        );
        
        console.log(`❌ ${apiTest.name} error:`, error);
      }

      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsTestingInProgress(false);
  };

  useEffect(() => {
    if (user) {
      console.log('User logged in, running API tests...');
      runAllTests();
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'loading': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'loading': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            API Integration Test Dashboard
          </h1>
          <p className="text-gray-400">
            Testing database connectivity and API endpoints
          </p>
          {user && (
            <p className="text-green-400 mt-2">
              ✅ User authenticated: {user.full_name} ({user.role})
            </p>
          )}
        </div>

        <div className="grid gap-6 mb-8">
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">API Test Results</h2>
              <button
                onClick={runAllTests}
                disabled={isTestingInProgress}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isTestingInProgress ? 'Testing...' : 'Run Tests Again'}
              </button>
            </div>

            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getStatusIcon(result.status)}</span>
                      <h3 className="font-medium text-white">{result.name}</h3>
                    </div>
                    <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>

                  {result.status === 'error' && result.error && (
                    <div className="bg-red-900/20 border border-red-500/20 rounded p-3 mb-2">
                      <p className="text-red-400 text-sm">Error: {result.error}</p>
                    </div>
                  )}

                  {result.status === 'success' && result.data && (
                    <div className="bg-green-900/20 border border-green-500/20 rounded p-3">
                      <p className="text-green-400 text-sm mb-2">
                        Success! Data received:
                      </p>
                      <div className="bg-black/40 rounded p-2 max-h-40 overflow-y-auto">
                        <pre className="text-xs text-gray-300">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {result.status === 'loading' && (
                    <div className="bg-yellow-900/20 border border-yellow-500/20 rounded p-3">
                      <p className="text-yellow-400 text-sm">Testing in progress...</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {testResults.length === 0 && !isTestingInProgress && (
              <div className="text-center text-gray-400 py-8">
                <p>No tests run yet. Click "Run Tests Again" to start testing.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Backend Status</h2>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">
              <span className="text-white font-medium">API Base URL:</span> {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
            </p>
            <p className="text-gray-300">
              <span className="text-white font-medium">Auth Token:</span> {dashboardAPI.utils.isAuthenticated() ? '✅ Present' : '❌ Missing'}
            </p>
            <p className="text-gray-300">
              <span className="text-white font-medium">User Role:</span> {dashboardAPI.utils.getUserRole() || 'Not set'}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            This page tests the connection between frontend and backend database.
            <br />
            Green results mean data is being fetched successfully from MySQL.
          </p>
        </div>
      </div>
    </div>
  );
}
