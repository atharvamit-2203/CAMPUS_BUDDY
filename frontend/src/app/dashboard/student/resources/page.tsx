'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';

const StudentResources = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="resources" />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Academic Resources</h1>
          
          <div className="space-y-6">
            {/* Quick Access */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Quick Access</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg p-4 text-center transition-colors">
                  <span className="text-2xl mb-2 block">📚</span>
                  <span className="text-sm text-white">Digital Library</span>
                </button>
                <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg p-4 text-center transition-colors">
                  <span className="text-2xl mb-2 block">📝</span>
                  <span className="text-sm text-white">Past Papers</span>
                </button>
                <button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg p-4 text-center transition-colors">
                  <span className="text-2xl mb-2 block">🎥</span>
                  <span className="text-sm text-white">Video Lectures</span>
                </button>
                <button className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg p-4 text-center transition-colors">
                  <span className="text-2xl mb-2 block">💻</span>
                  <span className="text-sm text-white">Online Tools</span>
                </button>
              </div>
            </div>

            {/* Subject-wise Resources */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Subject Resources</h3>
              <div className="space-y-6">
                
                {/* Data Structures */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <span className="bg-blue-500/20 p-2 rounded-lg mr-3">🔗</span>
                      Data Structures & Algorithms
                    </h4>
                    <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">6th Semester</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center mb-3">
                        <span className="text-xl mr-3">📖</span>
                        <div>
                          <h5 className="font-medium text-white">Course Notes</h5>
                          <p className="text-sm text-gray-400">Complete lecture notes</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">Updated: Sep 10</span>
                        <button className="text-blue-400 hover:text-blue-300">Download</button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center mb-3">
                        <span className="text-xl mr-3">📋</span>
                        <div>
                          <h5 className="font-medium text-white">Practice Problems</h5>
                          <p className="text-sm text-gray-400">50+ coding problems</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">Updated: Sep 8</span>
                        <button className="text-blue-400 hover:text-blue-300">View</button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center mb-3">
                        <span className="text-xl mr-3">🎥</span>
                        <div>
                          <h5 className="font-medium text-white">Video Lectures</h5>
                          <p className="text-sm text-gray-400">12 recorded sessions</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">Duration: 8 hrs</span>
                        <button className="text-blue-400 hover:text-blue-300">Watch</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Web Development */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <span className="bg-green-500/20 p-2 rounded-lg mr-3">🌐</span>
                      Web Development
                    </h4>
                    <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm">6th Semester</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center mb-3">
                        <span className="text-xl mr-3">💻</span>
                        <div>
                          <h5 className="font-medium text-white">Lab Code Examples</h5>
                          <p className="text-sm text-gray-400">HTML, CSS, JS samples</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">Updated: Sep 12</span>
                        <button className="text-blue-400 hover:text-blue-300">Download</button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center mb-3">
                        <span className="text-xl mr-3">🔧</span>
                        <div>
                          <h5 className="font-medium text-white">Development Tools</h5>
                          <p className="text-sm text-gray-400">VS Code setup & extensions</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">Setup Guide</span>
                        <button className="text-blue-400 hover:text-blue-300">View</button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center mb-3">
                        <span className="text-xl mr-3">🚀</span>
                        <div>
                          <h5 className="font-medium text-white">Project Templates</h5>
                          <p className="text-sm text-gray-400">Starter projects & boilerplates</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">5 templates</span>
                        <button className="text-blue-400 hover:text-blue-300">Download</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Database Systems */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white flex items-center">
                      <span className="bg-purple-500/20 p-2 rounded-lg mr-3">🗄️</span>
                      Database Systems
                    </h4>
                    <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm">6th Semester</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center mb-3">
                        <span className="text-xl mr-3">📊</span>
                        <div>
                          <h5 className="font-medium text-white">SQL Practice Queries</h5>
                          <p className="text-sm text-gray-400">100+ SQL exercises</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">All difficulty levels</span>
                        <button className="text-blue-400 hover:text-blue-300">Practice</button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center mb-3">
                        <span className="text-xl mr-3">🛠️</span>
                        <div>
                          <h5 className="font-medium text-white">Database Tools</h5>
                          <p className="text-sm text-gray-400">MySQL Workbench, phpMyAdmin</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">Installation guides</span>
                        <button className="text-blue-400 hover:text-blue-300">Download</button>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center mb-3">
                        <span className="text-xl mr-3">📈</span>
                        <div>
                          <h5 className="font-medium text-white">ER Diagram Tools</h5>
                          <p className="text-sm text-gray-400">Design database schemas</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-400">Templates available</span>
                        <button className="text-blue-400 hover:text-blue-300">Access</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Online Learning Platforms */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Recommended Learning Platforms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="bg-blue-500/20 p-3 rounded-xl w-fit mb-4">
                    <span className="text-2xl">🎓</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Coursera</h4>
                  <p className="text-gray-400 text-sm mb-4">University courses and professional certificates from top institutions.</p>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-300">• Machine Learning by Stanford</div>
                    <div className="text-sm text-gray-300">• Google Data Analytics Certificate</div>
                    <div className="text-sm text-gray-300">• IBM Full Stack Developer</div>
                  </div>
                  <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors">
                    Visit Platform
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="bg-orange-500/20 p-3 rounded-xl w-fit mb-4">
                    <span className="text-2xl">📚</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Udemy</h4>
                  <p className="text-gray-400 text-sm mb-4">Practical courses on programming, design, and business skills.</p>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-300">• Complete React Developer Course</div>
                    <div className="text-sm text-gray-300">• Python Bootcamp</div>
                    <div className="text-sm text-gray-300">• AWS Certified Solutions Architect</div>
                  </div>
                  <button className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 py-2 rounded-lg transition-colors">
                    Visit Platform
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="bg-green-500/20 p-3 rounded-xl w-fit mb-4">
                    <span className="text-2xl">💻</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">freeCodeCamp</h4>
                  <p className="text-gray-400 text-sm mb-4">Free coding bootcamp with hands-on projects and certifications.</p>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-300">• Responsive Web Design</div>
                    <div className="text-sm text-gray-300">• JavaScript Algorithms</div>
                    <div className="text-sm text-gray-300">• Front End Development Libraries</div>
                  </div>
                  <button className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 rounded-lg transition-colors">
                    Visit Platform
                  </button>
                </div>
              </div>
            </div>

            {/* Study Materials */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Recent Study Materials</h3>
              <div className="space-y-4">
                
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center">
                  <div className="bg-blue-500/20 p-3 rounded-xl mr-4">
                    <span className="text-xl">📄</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">Mid-Semester Question Papers 2024</h4>
                    <p className="text-sm text-gray-400">All subjects • Computer Science • 6th Semester</p>
                  </div>
                  <div className="text-right mr-4">
                    <div className="text-sm text-green-400">✓ Downloaded</div>
                    <div className="text-xs text-gray-400">Sep 8, 2025</div>
                  </div>
                  <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm">
                    Re-download
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center">
                  <div className="bg-green-500/20 p-3 rounded-xl mr-4">
                    <span className="text-xl">📚</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">Data Structures Reference Book</h4>
                    <p className="text-sm text-gray-400">by Cormen, Leiserson, Rivest, and Stein</p>
                  </div>
                  <div className="text-right mr-4">
                    <div className="text-sm text-green-400">Available</div>
                    <div className="text-xs text-gray-400">PDF, 1200 pages</div>
                  </div>
                  <button className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm">
                    Download
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center">
                  <div className="bg-purple-500/20 p-3 rounded-xl mr-4">
                    <span className="text-xl">🎥</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">Web Development Tutorial Series</h4>
                    <p className="text-sm text-gray-400">React, Node.js, MongoDB • 15 video lectures</p>
                  </div>
                  <div className="text-right mr-4">
                    <div className="text-sm text-yellow-400">🕒 In Progress</div>
                    <div className="text-xs text-gray-400">7/15 completed</div>
                  </div>
                  <button className="bg-purple-500/20 text-purple-400 px-4 py-2 rounded-lg text-sm">
                    Continue
                  </button>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">24</div>
                <div className="text-sm text-gray-400">Resources Downloaded</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">8</div>
                <div className="text-sm text-gray-400">Courses in Progress</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-2">45h</div>
                <div className="text-sm text-gray-400">Study Time This Month</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-orange-400 mb-2">92%</div>
                <div className="text-sm text-gray-400">Assignment Completion</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentResources;
