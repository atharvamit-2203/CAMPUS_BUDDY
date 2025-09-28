'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';

const StudentNetworking = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="networking" />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Student Networking</h1>
          
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/30">
                    All Students
                  </button>
                  <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10">
                    Same Course
                  </button>
                  <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10">
                    Same Semester
                  </button>
                  <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10">
                    Similar Interests
                  </button>
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search students..." 
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-400 w-64"
                  />
                </div>
              </div>
            </div>

            {/* Connection Suggestions */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="bg-green-500/20 p-2 rounded-lg mr-3">🤝</span>
                Suggested Connections
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Profile 1 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">AS</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Arjun Sharma</h4>
                      <p className="text-sm text-gray-400">Computer Science • 6th Semester</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Common Interests:</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">React</span>
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">Machine Learning</span>
                        <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">Startup</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Mutual Connections:</span>
                      <span className="text-green-400">12 friends</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">CGPA:</span>
                      <span className="text-white">8.7</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors text-sm">
                      Connect
                    </button>
                    <button className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 py-2 rounded-lg transition-colors text-sm">
                      View Profile
                    </button>
                  </div>
                </div>

                {/* Profile 2 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">PP</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Priya Patel</h4>
                      <p className="text-sm text-gray-400">Information Technology • 6th Semester</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Common Interests:</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full text-xs">UI/UX Design</span>
                        <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs">Design Thinking</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Mutual Connections:</span>
                      <span className="text-green-400">8 friends</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">CGPA:</span>
                      <span className="text-white">8.9</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors text-sm">
                      Connect
                    </button>
                    <button className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 py-2 rounded-lg transition-colors text-sm">
                      View Profile
                    </button>
                  </div>
                </div>

                {/* Profile 3 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">RK</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Rahul Kumar</h4>
                      <p className="text-sm text-gray-400">Computer Science • 8th Semester</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Common Interests:</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">DevOps</span>
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">Cloud Computing</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Mutual Connections:</span>
                      <span className="text-green-400">15 friends</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">CGPA:</span>
                      <span className="text-white">9.1</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors text-sm">
                      Connect
                    </button>
                    <button className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 py-2 rounded-lg transition-colors text-sm">
                      View Profile
                    </button>
                  </div>
                </div>

                {/* Profile 4 */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">AD</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">Anaya Desai</h4>
                      <p className="text-sm text-gray-400">Computer Science • 6th Semester</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Common Interests:</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-xs">Data Science</span>
                        <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full text-xs">Python</span>
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">Analytics</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Mutual Connections:</span>
                      <span className="text-green-400">6 friends</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">CGPA:</span>
                      <span className="text-white">8.5</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors text-sm">
                      Connect
                    </button>
                    <button className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 py-2 rounded-lg transition-colors text-sm">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Study Groups */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="bg-purple-500/20 p-2 rounded-lg mr-3">📚</span>
                Active Study Groups
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">Data Structures Study Group</h4>
                      <p className="text-sm text-gray-400">Preparing for mid-semester exam</p>
                    </div>
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs">6 members</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400 w-20">Next Meet:</span>
                      <span className="text-white">Tomorrow 4:00 PM</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400 w-20">Location:</span>
                      <span className="text-white">Library Room 201</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400 w-20">Topics:</span>
                      <span className="text-white">Trees, Graphs, Dynamic Programming</span>
                    </div>
                  </div>
                  <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors">
                    Join Group
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">Web Development Practice</h4>
                      <p className="text-sm text-gray-400">Building projects together</p>
                    </div>
                    <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full text-xs">4 members</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400 w-20">Next Meet:</span>
                      <span className="text-white">Friday 6:00 PM</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400 w-20">Location:</span>
                      <span className="text-white">Online (Discord)</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400 w-20">Focus:</span>
                      <span className="text-white">React, Node.js, MongoDB</span>
                    </div>
                  </div>
                  <button className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 rounded-lg transition-colors">
                    Join Group
                  </button>
                </div>
              </div>
            </div>

            {/* My Connections */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="bg-green-500/20 p-2 rounded-lg mr-3">👥</span>
                  My Connections
                </span>
                <span className="text-sm text-gray-400">3 connections</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-medium">SK</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Sneha Kapoor</h4>
                      <p className="text-sm text-gray-400">Computer Science • Connected 2 days ago</p>
                    </div>
                  </div>
                  <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm">
                    Message
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-medium">VT</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Vikram Thakur</h4>
                      <p className="text-sm text-gray-400">Information Technology • Connected 1 week ago</p>
                    </div>
                  </div>
                  <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm">
                    Message
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-medium">MJ</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-white">Meera Joshi</h4>
                      <p className="text-sm text-gray-400">Computer Science • Connected 2 weeks ago</p>
                    </div>
                  </div>
                  <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm">
                    Message
                  </button>
                </div>
              </div>
            </div>

            {/* Networking Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">3</div>
                <div className="text-sm text-gray-400">Connections</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">12</div>
                <div className="text-sm text-gray-400">Profile Views</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-2">2</div>
                <div className="text-sm text-gray-400">Study Groups</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-orange-400 mb-2">85%</div>
                <div className="text-sm text-gray-400">Profile Completion</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentNetworking;
