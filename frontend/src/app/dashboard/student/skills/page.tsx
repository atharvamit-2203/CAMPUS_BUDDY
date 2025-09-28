'use client';

import React from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';

const StudentSkills = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="skills" />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Skills Development</h1>
          
          <div className="space-y-6">
            {/* Skills Overview */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Your Skills Profile</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">12</div>
                  <div className="text-sm text-gray-400">Skills Added</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">8.4</div>
                  <div className="text-sm text-gray-400">Average Level</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">3</div>
                  <div className="text-sm text-gray-400">Certifications</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400 mb-2">5</div>
                  <div className="text-sm text-gray-400">Recommendations</div>
                </div>
              </div>
            </div>

            {/* Current Skills */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">My Skills</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Technical Skills */}
                <div>
                  <h4 className="text-lg font-medium text-blue-400 mb-4">Technical Skills</h4>
                  <div className="space-y-4">
                    
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">JavaScript</span>
                        <span className="text-green-400 text-sm">Expert (9/10)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{width: '90%'}}></div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">React.js</span>
                        <span className="text-green-400 text-sm">Advanced (8/10)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{width: '80%'}}></div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Python</span>
                        <span className="text-blue-400 text-sm">Intermediate (7/10)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{width: '70%'}}></div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Node.js</span>
                        <span className="text-blue-400 text-sm">Intermediate (6/10)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{width: '60%'}}></div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Machine Learning</span>
                        <span className="text-yellow-400 text-sm">Beginner (4/10)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{width: '40%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Soft Skills */}
                <div>
                  <h4 className="text-lg font-medium text-purple-400 mb-4">Soft Skills</h4>
                  <div className="space-y-4">
                    
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Problem Solving</span>
                        <span className="text-green-400 text-sm">Advanced (8/10)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{width: '80%'}}></div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Team Collaboration</span>
                        <span className="text-green-400 text-sm">Advanced (8/10)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{width: '80%'}}></div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Communication</span>
                        <span className="text-blue-400 text-sm">Intermediate (7/10)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{width: '70%'}}></div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Leadership</span>
                        <span className="text-blue-400 text-sm">Intermediate (6/10)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full" style={{width: '60%'}}></div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">Public Speaking</span>
                        <span className="text-yellow-400 text-sm">Beginner (5/10)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{width: '50%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Recommendations */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Recommended Skills to Learn</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="bg-blue-500/20 p-3 rounded-xl w-fit mb-4">
                    <span className="text-2xl">⚛️</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Next.js</h4>
                  <p className="text-gray-400 text-sm mb-4">Build on your React knowledge with this powerful framework for production apps.</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className="text-blue-400">Intermediate</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Time to Learn:</span>
                      <span className="text-green-400">3-4 weeks</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Job Demand:</span>
                      <span className="text-green-400">High</span>
                    </div>
                  </div>
                  <button className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg transition-colors">
                    Start Learning
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="bg-green-500/20 p-3 rounded-xl w-fit mb-4">
                    <span className="text-2xl">🐍</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Django</h4>
                  <p className="text-gray-400 text-sm mb-4">Enhance your Python skills with this robust web framework used by top companies.</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className="text-blue-400">Intermediate</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Time to Learn:</span>
                      <span className="text-green-400">4-5 weeks</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Job Demand:</span>
                      <span className="text-green-400">High</span>
                    </div>
                  </div>
                  <button className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 rounded-lg transition-colors">
                    Start Learning
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                  <div className="bg-purple-500/20 p-3 rounded-xl w-fit mb-4">
                    <span className="text-2xl">☁️</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">AWS Basics</h4>
                  <p className="text-gray-400 text-sm mb-4">Learn cloud computing fundamentals with Amazon Web Services certification.</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className="text-yellow-400">Beginner</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Time to Learn:</span>
                      <span className="text-green-400">6-8 weeks</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Job Demand:</span>
                      <span className="text-green-400">Very High</span>
                    </div>
                  </div>
                  <button className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 rounded-lg transition-colors">
                    Start Learning
                  </button>
                </div>
              </div>
            </div>

            {/* Achievements & Certifications */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Achievements & Certifications</h3>
              <div className="space-y-4">
                
                <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center">
                  <div className="bg-yellow-500/20 p-3 rounded-xl mr-4">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">JavaScript Fundamentals Certificate</h4>
                    <p className="text-sm text-gray-400">Completed on Aug 15, 2025 • FreeCodeCamp</p>
                  </div>
                  <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm">
                    View Certificate
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center">
                  <div className="bg-blue-500/20 p-3 rounded-xl mr-4">
                    <span className="text-2xl">🎖️</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">React Developer Course</h4>
                    <p className="text-sm text-gray-400">Completed on Sep 5, 2025 • Udemy</p>
                  </div>
                  <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm">
                    View Certificate
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center">
                  <div className="bg-green-500/20 p-3 rounded-xl mr-4">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">Python for Data Science</h4>
                    <p className="text-sm text-gray-400">In Progress • Expected completion: Oct 20, 2025 • Coursera</p>
                  </div>
                  <button className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm">
                    Continue Learning
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg p-4 text-center transition-colors">
                  <span className="text-2xl mb-2 block">➕</span>
                  <span className="text-sm text-white">Add New Skill</span>
                </button>
                <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg p-4 text-center transition-colors">
                  <span className="text-2xl mb-2 block">📊</span>
                  <span className="text-sm text-white">Skill Assessment</span>
                </button>
                <button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg p-4 text-center transition-colors">
                  <span className="text-2xl mb-2 block">🎯</span>
                  <span className="text-sm text-white">Set Learning Goals</span>
                </button>
                <button className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg p-4 text-center transition-colors">
                  <span className="text-2xl mb-2 block">📋</span>
                  <span className="text-sm text-white">Browse Courses</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSkills;
