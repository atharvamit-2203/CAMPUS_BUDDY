'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';

const StudentEvents = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="events" />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Campus Events</h1>
          
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex flex-wrap gap-4 mb-6">
                <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/30">
                  All Events
                </button>
                <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10">
                  Academic
                </button>
                <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10">
                  Technical
                </button>
                <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10">
                  Cultural
                </button>
                <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10">
                  Sports
                </button>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Event 1 */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-black/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-500/20 px-3 py-1 rounded-full">
                    <span className="text-xs text-blue-300">Technical</span>
                  </div>
                  <span className="text-xs text-gray-400">Sep 20, 2025</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Tech Symposium 2025</h3>
                <p className="text-gray-400 text-sm mb-4">Annual technology conference featuring industry experts and latest innovations in AI, ML, and Web Development.</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Time:</span>
                    <span>10:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Venue:</span>
                    <span>Main Auditorium</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Seats:</span>
                    <span>245/300 registered</span>
                  </div>
                </div>
                <button className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 rounded-lg transition-colors">
                  Registered ✓
                </button>
              </div>

              {/* Event 2 */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-black/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-purple-500/20 px-3 py-1 rounded-full">
                    <span className="text-xs text-purple-300">Competition</span>
                  </div>
                  <span className="text-xs text-gray-400">Sep 25, 2025</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Inter-College Coding Competition</h3>
                <p className="text-gray-400 text-sm mb-4">24-hour hackathon with prizes worth ₹50,000. Build innovative solutions for real-world problems.</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Time:</span>
                    <span>9:00 AM - 9:00 AM+1</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Venue:</span>
                    <span>Computer Lab Block</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Teams:</span>
                    <span>89/100 registered</span>
                  </div>
                </div>
                <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors">
                  Register Now
                </button>
              </div>

              {/* Event 3 */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-black/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-green-500/20 px-3 py-1 rounded-full">
                    <span className="text-xs text-green-300">Industry</span>
                  </div>
                  <span className="text-xs text-gray-400">Oct 01, 2025</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI in Business - Industry Talk</h3>
                <p className="text-gray-400 text-sm mb-4">Learn how AI is transforming businesses. Featuring CTO of TechCorp and startup founders.</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Time:</span>
                    <span>11:00 AM - 1:00 PM</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Venue:</span>
                    <span>Seminar Hall</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Seats:</span>
                    <span>156/200 registered</span>
                  </div>
                </div>
                <button className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 rounded-lg transition-colors">
                  Registered ✓
                </button>
              </div>

              {/* Event 4 */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-black/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-pink-500/20 px-3 py-1 rounded-full">
                    <span className="text-xs text-pink-300">Cultural</span>
                  </div>
                  <span className="text-xs text-gray-400">Oct 05, 2025</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Annual Cultural Fest - Kaleidoscope</h3>
                <p className="text-gray-400 text-sm mb-4">3-day cultural extravaganza with music, dance, drama, and art competitions.</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Time:</span>
                    <span>Oct 5-7, All Day</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Venue:</span>
                    <span>Campus Grounds</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Entry:</span>
                    <span>Free for all students</span>
                  </div>
                </div>
                <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors">
                  Participate
                </button>
              </div>

              {/* Event 5 */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-black/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-orange-500/20 px-3 py-1 rounded-full">
                    <span className="text-xs text-orange-300">Workshop</span>
                  </div>
                  <span className="text-xs text-gray-400">Oct 10, 2025</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">React & Next.js Masterclass</h3>
                <p className="text-gray-400 text-sm mb-4">Hands-on workshop covering modern React patterns, Next.js 14, and deployment strategies.</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Time:</span>
                    <span>2:00 PM - 6:00 PM</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Venue:</span>
                    <span>Lab 301-302</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Seats:</span>
                    <span>28/40 registered</span>
                  </div>
                </div>
                <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors">
                  Register Now
                </button>
              </div>

              {/* Event 6 */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-black/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-red-500/20 px-3 py-1 rounded-full">
                    <span className="text-xs text-red-300">Career</span>
                  </div>
                  <span className="text-xs text-gray-400">Oct 15, 2025</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Campus Placement Drive</h3>
                <p className="text-gray-400 text-sm mb-4">Major tech companies visiting for final year placements. Prepare your resumes!</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Time:</span>
                    <span>9:00 AM onwards</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Venue:</span>
                    <span>Placement Cell</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-16 text-gray-400">Eligible:</span>
                    <span>Final year students</span>
                  </div>
                </div>
                <button className="w-full bg-gray-500/20 text-gray-400 py-2 rounded-lg cursor-not-allowed">
                  Only for Final Year
                </button>
              </div>
            </div>

            {/* My Registrations */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">My Registrations</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                  <div>
                    <h4 className="font-medium text-white">Tech Symposium 2025</h4>
                    <p className="text-sm text-gray-400">Sep 20, 2025 • Main Auditorium</p>
                  </div>
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">Confirmed</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                  <div>
                    <h4 className="font-medium text-white">AI in Business - Industry Talk</h4>
                    <p className="text-sm text-gray-400">Oct 01, 2025 • Seminar Hall</p>
                  </div>
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">Confirmed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEvents;
