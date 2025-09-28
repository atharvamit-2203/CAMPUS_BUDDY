'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';

const StudentTimetable = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="timetable" />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">My Timetable</h1>
          
          <div className="space-y-6">
            {/* Current Week Navigation */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Week of September 15-19, 2025</h3>
                <div className="flex gap-2">
                  <button className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-sm">← Prev</button>
                  <button className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-sm">Next →</button>
                </div>
              </div>
              <p className="text-yellow-400 text-sm">📚 Note: Students have read-only access to timetable</p>
            </div>

            {/* Weekly Timetable */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-gray-300 p-3 font-medium">Time</th>
                      <th className="text-center text-gray-300 p-3 font-medium">Monday</th>
                      <th className="text-center text-gray-300 p-3 font-medium">Tuesday</th>
                      <th className="text-center text-gray-300 p-3 font-medium">Wednesday</th>
                      <th className="text-center text-gray-300 p-3 font-medium">Thursday</th>
                      <th className="text-center text-gray-300 p-3 font-medium">Friday</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 9:00 - 10:30 */}
                    <tr className="border-b border-white/5">
                      <td className="p-3 text-gray-400 font-medium">09:00 - 10:30</td>
                      <td className="p-2">
                        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Data Structures</div>
                          <div className="text-xs text-blue-300 mt-1">Dr. Smith • Room 301</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Web Development</div>
                          <div className="text-xs text-green-300 mt-1">Prof. Johnson • Lab 205</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Database Systems</div>
                          <div className="text-xs text-purple-300 mt-1">Dr. Williams • Room 402</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Computer Networks</div>
                          <div className="text-xs text-orange-300 mt-1">Prof. Davis • Room 203</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Software Engineering</div>
                          <div className="text-xs text-red-300 mt-1">Dr. Brown • Room 105</div>
                        </div>
                      </td>
                    </tr>

                    {/* 10:45 - 12:15 */}
                    <tr className="border-b border-white/5">
                      <td className="p-3 text-gray-400 font-medium">10:45 - 12:15</td>
                      <td className="p-2">
                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Web Dev Lab</div>
                          <div className="text-xs text-green-300 mt-1">Prof. Johnson • Lab 205</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Data Structures</div>
                          <div className="text-xs text-blue-300 mt-1">Dr. Smith • Room 301</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Mathematics</div>
                          <div className="text-xs text-yellow-300 mt-1">Prof. Taylor • Room 501</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Database Lab</div>
                          <div className="text-xs text-purple-300 mt-1">Dr. Williams • Lab 301</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-gray-300">Free Period</div>
                        </div>
                      </td>
                    </tr>

                    {/* 12:15 - 1:15 LUNCH */}
                    <tr className="border-b border-white/5">
                      <td className="p-3 text-gray-400 font-medium">12:15 - 01:15</td>
                      <td colSpan={5} className="p-2">
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-orange-300">🍽️ LUNCH BREAK</div>
                        </div>
                      </td>
                    </tr>

                    {/* 1:15 - 2:45 */}
                    <tr className="border-b border-white/5">
                      <td className="p-3 text-gray-400 font-medium">01:15 - 02:45</td>
                      <td className="p-2">
                        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Database Systems</div>
                          <div className="text-xs text-purple-300 mt-1">Dr. Williams • Room 402</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Computer Networks</div>
                          <div className="text-xs text-orange-300 mt-1">Prof. Davis • Room 203</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Software Engineering</div>
                          <div className="text-xs text-red-300 mt-1">Dr. Brown • Room 105</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Web Development</div>
                          <div className="text-xs text-green-300 mt-1">Prof. Johnson • Lab 205</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">DS Tutorial</div>
                          <div className="text-xs text-blue-300 mt-1">Dr. Smith • Room 301</div>
                        </div>
                      </td>
                    </tr>

                    {/* 3:00 - 4:30 */}
                    <tr className="border-b border-white/5">
                      <td className="p-3 text-gray-400 font-medium">03:00 - 04:30</td>
                      <td className="p-2">
                        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Mathematics</div>
                          <div className="text-xs text-yellow-300 mt-1">Prof. Taylor • Room 501</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Software Engineering</div>
                          <div className="text-xs text-red-300 mt-1">Dr. Brown • Room 105</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Web Dev Lab</div>
                          <div className="text-xs text-green-300 mt-1">Prof. Johnson • Lab 205</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-white">Math Tutorial</div>
                          <div className="text-xs text-yellow-300 mt-1">Prof. Taylor • Room 501</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="bg-gray-500/20 border border-gray-500/30 rounded-lg p-3 text-center">
                          <div className="text-sm font-medium text-gray-300">Free Period</div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Today's Classes Summary */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Today&apos;s Classes (Wednesday)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Database Systems</h4>
                    <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full">Next</span>
                  </div>
                  <p className="text-sm text-gray-400">09:00 - 10:30 • Room 402</p>
                  <p className="text-sm text-purple-300">Dr. Williams</p>
                </div>
                
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Mathematics</h4>
                    <span className="text-xs bg-gray-500/30 text-gray-400 px-2 py-1 rounded-full">Later</span>
                  </div>
                  <p className="text-sm text-gray-400">10:45 - 12:15 • Room 501</p>
                  <p className="text-sm text-yellow-300">Prof. Taylor</p>
                </div>
                
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Software Engineering</h4>
                    <span className="text-xs bg-gray-500/30 text-gray-400 px-2 py-1 rounded-full">Later</span>
                  </div>
                  <p className="text-sm text-gray-400">01:15 - 02:45 • Room 105</p>
                  <p className="text-sm text-red-300">Dr. Brown</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">25</div>
                <div className="text-sm text-gray-400">Classes This Week</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">87%</div>
                <div className="text-sm text-gray-400">Attendance Rate</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-2">6</div>
                <div className="text-sm text-gray-400">Subjects</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-orange-400 mb-2">3</div>
                <div className="text-sm text-gray-400">Lab Sessions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTimetable;
