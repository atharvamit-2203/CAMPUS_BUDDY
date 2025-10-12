'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const TimeParsingTest = () => {
  const { token } = useAuth();
  const [testTimes, setTestTimes] = useState('9:00\n10:00\n21:00\n22:00\n2:30\n14:00');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testTimesParsing = async () => {
    if (!token) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    try {
      const times = testTimes.split('\n').map(t => t.trim()).filter(t => t);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/timetable/test-time-parsing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ times })
      });

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Error testing time parsing:', error);
      alert('Error testing time parsing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Time Parsing Test</h3>
      <p className="text-gray-400 mb-4">Test how the system parses different time formats. Enter times one per line.</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Test Times (one per line):
          </label>
          <textarea
            value={testTimes}
            onChange={(e) => setTestTimes(e.target.value)}
            className="w-full h-32 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
            placeholder="Enter times like:&#10;9:00&#10;10:00&#10;21:00&#10;2:30 PM"
          />
        </div>

        <button
          onClick={testTimesParsing}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
        >
          {loading ? 'Testing...' : 'Test Time Parsing'}
        </button>

        {results.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-medium text-white mb-3">Results:</h4>
            <div className="bg-gray-800 rounded-lg p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left text-gray-300 p-2">Input</th>
                    <th className="text-left text-gray-300 p-2">Output</th>
                    <th className="text-left text-gray-300 p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="text-white p-2 font-mono">{result.input}</td>
                      <td className="text-green-400 p-2 font-mono">
                        {result.output || 'N/A'}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          result.status === 'success' 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {result.status}
                        </span>
                        {result.error && (
                          <div className="text-red-400 text-xs mt-1">{result.error}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h5 className="text-blue-400 font-medium mb-2">Expected Behavior:</h5>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <code>9:00</code> → <code>09:00</code> (morning)</li>
            <li>• <code>21:00</code> → <code>09:00</code> (corrected to morning)</li>
            <li>• <code>22:00</code> → <code>10:00</code> (corrected to morning)</li>
            <li>• <code>2:30 PM</code> → <code>14:30</code> (afternoon)</li>
            <li>• <code>14:00</code> → <code>14:00</code> (afternoon, unchanged)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TimeParsingTest;