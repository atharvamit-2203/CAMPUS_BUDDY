'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';

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
            {/* Filter and Search */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/30">
                    All Clubs
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
                  <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10">
                    Academic
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search clubs..." 
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 w-64"
                  />
                </div>
              </div>
            </div>

            {/* Recommended Clubs */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="bg-yellow-500/20 p-2 rounded-lg mr-3">⭐</span>
                Recommended for You
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Club 1 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-500/20 p-3 rounded-xl">
                      <span className="text-2xl">💻</span>
                    </div>
                    <div className="bg-green-500/20 px-3 py-1 rounded-full">
                      <span className="text-xs text-green-300">95% match</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Computer Science Society</h4>
                  <p className="text-gray-400 text-sm mb-4">Explore latest trends in technology, participate in coding competitions, and network with fellow programmers.</p>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Members:</span>
                      <span className="text-white">245 students</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Category:</span>
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">Technical</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Next Event:</span>
                      <span className="text-green-400">Sep 25 - Hackathon</span>
                    </div>
                  </div>
                  <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors">
                    Join Club
                  </button>
                </div>

                {/* Club 2 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-purple-500/20 p-3 rounded-xl">
                      <span className="text-2xl">💡</span>
                    </div>
                    <div className="bg-green-500/20 px-3 py-1 rounded-full">
                      <span className="text-xs text-green-300">87% match</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Innovation Club</h4>
                  <p className="text-gray-400 text-sm mb-4">Foster creativity, develop entrepreneurial skills, and work on innovative projects that solve real-world problems.</p>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Members:</span>
                      <span className="text-white">189 students</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Category:</span>
                      <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">Innovation</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Next Event:</span>
                      <span className="text-green-400">Oct 2 - Pitch Day</span>
                    </div>
                  </div>
                  <button className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 rounded-lg transition-colors">
                    Join Club
                  </button>
                </div>

                {/* Club 3 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-green-500/20 p-3 rounded-xl">
                      <span className="text-2xl">🌐</span>
                    </div>
                    <div className="bg-green-500/20 px-3 py-1 rounded-full">
                      <span className="text-xs text-green-300">92% match</span>
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Web Developers Guild</h4>
                  <p className="text-gray-400 text-sm mb-4">Master modern web technologies, build amazing projects, and collaborate with passionate web developers.</p>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Members:</span>
                      <span className="text-white">156 students</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Category:</span>
                      <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">Technical</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Next Event:</span>
                      <span className="text-green-400">Oct 10 - React Workshop</span>
                    </div>
                  </div>
                  <button className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 rounded-lg transition-colors">
                    Join Club
                  </button>
                </div>
              </div>
            </div>

            {/* All Clubs */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">All Campus Clubs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Cultural Club */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-pink-500/20 p-3 rounded-xl">
                      <span className="text-2xl">🎭</span>
                    </div>
                    <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full text-xs">Cultural</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Drama Society</h4>
                  <p className="text-gray-400 text-sm mb-4">Express yourself through theater, participate in plays, and develop acting and storytelling skills.</p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-400">123 members</span>
                    <span className="text-pink-400">Next: Oct 5 - Play Auditions</span>
                  </div>
                  <button className="w-full bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 py-2 rounded-lg transition-colors">
                    Join Club
                  </button>
                </div>

                {/* Sports Club */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-orange-500/20 p-3 rounded-xl">
                      <span className="text-2xl">⚽</span>
                    </div>
                    <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full text-xs">Sports</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Football Club</h4>
                  <p className="text-gray-400 text-sm mb-4">Stay fit, improve your football skills, and compete in inter-college tournaments.</p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-400">78 members</span>
                    <span className="text-orange-400">Training: Mon/Wed/Fri</span>
                  </div>
                  <button className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 py-2 rounded-lg transition-colors">
                    Join Club
                  </button>
                </div>

                {/* Academic Club */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-indigo-500/20 p-3 rounded-xl">
                      <span className="text-2xl">📚</span>
                    </div>
                    <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full text-xs">Academic</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Mathematics Society</h4>
                  <p className="text-gray-400 text-sm mb-4">Explore advanced mathematics, participate in competitions, and strengthen problem-solving skills.</p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-400">67 members</span>
                    <span className="text-indigo-400">Next: Sep 30 - Math Olympiad</span>
                  </div>
                  <button className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 py-2 rounded-lg transition-colors">
                    Join Club
                  </button>
                </div>

                {/* Music Club */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-red-500/20 p-3 rounded-xl">
                      <span className="text-2xl">🎵</span>
                    </div>
                    <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs">Cultural</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Music Club</h4>
                  <p className="text-gray-400 text-sm mb-4">Learn instruments, form bands, and perform at college events and competitions.</p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-400">94 members</span>
                    <span className="text-red-400">Jam Session: Every Sat</span>
                  </div>
                  <button className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded-lg transition-colors">
                    Join Club
                  </button>
                </div>

                {/* Photography Club */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-yellow-500/20 p-3 rounded-xl">
                      <span className="text-2xl">📸</span>
                    </div>
                    <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs">Creative</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Photography Club</h4>
                  <p className="text-gray-400 text-sm mb-4">Capture moments, learn photography techniques, and showcase your work in exhibitions.</p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-400">112 members</span>
                    <span className="text-yellow-400">Photo Walk: Oct 8</span>
                  </div>
                  <button className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 py-2 rounded-lg transition-colors">
                    Join Club
                  </button>
                </div>

                {/* Debate Club */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-teal-500/20 p-3 rounded-xl">
                      <span className="text-2xl">🗣️</span>
                    </div>
                    <span className="bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full text-xs">Academic</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Debate & Public Speaking</h4>
                  <p className="text-gray-400 text-sm mb-4">Improve communication skills, participate in debates, and build confidence in public speaking.</p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-gray-400">56 members</span>
                    <span className="text-teal-400">Debate: Every Tuesday</span>
                  </div>
                  <button className="w-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 py-2 rounded-lg transition-colors">
                    Join Club
                  </button>
                </div>
              </div>
            </div>

            {/* My Clubs */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">My Clubs</h3>
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-4">🏛️</div>
                <p className="text-lg mb-2">You haven&apos;t joined any clubs yet</p>
                <p className="text-sm">Join clubs to connect with like-minded students and pursue your interests!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentClubs;
