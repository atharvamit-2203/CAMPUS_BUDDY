'use client';

export default function StudentNoticesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            📢 Important Notices
          </h1>
          <p className="text-gray-400">
            Stay updated with the latest announcements and important information
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Filter and Search */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg text-sm border border-blue-500/30">
                  All Notices
                </button>
                <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/10">
                  Academic
                </button>
                <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/10">
                  Examination
                </button>
                <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/10">
                  Events
                </button>
                <button className="bg-white/5 text-gray-400 px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/10">
                  Urgent
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search notices..."
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-400 focus:border-blue-500/50 focus:outline-none"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Urgent/Priority Notices */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center">
              <span className="mr-2">🚨</span>
              Urgent Notices
            </h3>
            <div className="space-y-4">
              
              <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Mid-Semester Exam Schedule Released</h4>
                    <p className="text-sm text-gray-300 mb-2">Examination Controller's Office</p>
                    <p className="text-sm text-gray-400">
                      Mid-semester examinations will commence from September 25, 2025. Students are required to check their roll numbers and exam centers immediately.
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="bg-red-500/30 text-red-300 px-2 py-1 rounded text-xs mb-1">URGENT</div>
                    <div className="text-xs text-gray-400">Sep 10, 2025</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">📌 Pinned</span>
                    <span>👁️ 1,245 views</span>
                  </div>
                  <button className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm hover:bg-red-500/30">
                    View Details
                  </button>
                </div>
              </div>

              <div className="bg-orange-500/20 border border-orange-500/40 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Library Closure - System Maintenance</h4>
                    <p className="text-sm text-gray-300 mb-2">Central Library</p>
                    <p className="text-sm text-gray-400">
                      The library will be closed on September 15-16, 2025 for system upgrades. Digital resources will remain accessible.
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="bg-orange-500/30 text-orange-300 px-2 py-1 rounded text-xs mb-1">IMPORTANT</div>
                    <div className="text-xs text-gray-400">Sep 8, 2025</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">📌 Pinned</span>
                    <span>👁️ 892 views</span>
                  </div>
                  <button className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded text-sm hover:bg-orange-500/30">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Notices */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Recent Notices</h3>
            <div className="space-y-4">
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Workshop: Introduction to Machine Learning</h4>
                    <p className="text-sm text-gray-300 mb-2">Computer Science Department</p>
                    <p className="text-sm text-gray-400">
                      A 3-day hands-on workshop on ML fundamentals. Registration deadline: September 20, 2025. Limited seats available.
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="bg-blue-500/30 text-blue-300 px-2 py-1 rounded text-xs mb-1">ACADEMIC</div>
                    <div className="text-xs text-gray-400">Sep 9, 2025</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">📅 Sep 22-24, 2025</span>
                    <span>👁️ 456 views</span>
                  </div>
                  <button className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded text-sm hover:bg-blue-500/30">
                    Register Now
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Semester Fee Payment Reminder</h4>
                    <p className="text-sm text-gray-300 mb-2">Accounts Department</p>
                    <p className="text-sm text-gray-400">
                      Last date for semester fee payment is September 30, 2025. Late fee charges will apply after the deadline.
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="bg-yellow-500/30 text-yellow-300 px-2 py-1 rounded text-xs mb-1">PAYMENT</div>
                    <div className="text-xs text-gray-400">Sep 7, 2025</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">💳 Due: Sep 30</span>
                    <span>👁️ 1,024 views</span>
                  </div>
                  <button className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-sm hover:bg-yellow-500/30">
                    Pay Now
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Cultural Fest 2025 - "Spectrum"</h4>
                    <p className="text-sm text-gray-300 mb-2">Student Activities Committee</p>
                    <p className="text-sm text-gray-400">
                      Annual cultural festival from October 5-7, 2025. Event registrations open. Prizes worth ₹2 lakhs!
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="bg-purple-500/30 text-purple-300 px-2 py-1 rounded text-xs mb-1">EVENT</div>
                    <div className="text-xs text-gray-400">Sep 6, 2025</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">🎭 Oct 5-7, 2025</span>
                    <span>👁️ 789 views</span>
                  </div>
                  <button className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded text-sm hover:bg-purple-500/30">
                    View Events
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">New Course Registration Guidelines</h4>
                    <p className="text-sm text-gray-300 mb-2">Academic Office</p>
                    <p className="text-sm text-gray-400">
                      Updated guidelines for course registration process for next semester. Please review before advising period.
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="bg-green-500/30 text-green-300 px-2 py-1 rounded text-xs mb-1">ACADEMIC</div>
                    <div className="text-xs text-gray-400">Sep 5, 2025</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-400">
                    <span className="mr-4">📋 Guidelines Updated</span>
                    <span>👁️ 567 views</span>
                  </div>
                  <button className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm hover:bg-green-500/30">
                    Read More
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Examination Notices */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Examination Notices</h3>
            <div className="space-y-4">
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">End Semester Exam Form Submission</h4>
                    <p className="text-sm text-gray-300 mb-2">Controller of Examinations</p>
                    <p className="text-sm text-gray-400">
                      Submit end semester examination forms by October 15, 2025. Late submissions will not be accepted.
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="bg-red-500/30 text-red-300 px-2 py-1 rounded text-xs mb-1">EXAM</div>
                    <div className="text-xs text-gray-400">Sep 4, 2025</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">📝 Deadline: Oct 15, 2025</div>
                  <button className="bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm hover:bg-red-500/30">
                    Submit Form
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">Re-evaluation Results - Semester 5</h4>
                    <p className="text-sm text-gray-300 mb-2">Examination Department</p>
                    <p className="text-sm text-gray-400">
                      Re-evaluation results for semester 5 examinations are now available. Check the student portal.
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="bg-green-500/30 text-green-300 px-2 py-1 rounded text-xs mb-1">RESULTS</div>
                    <div className="text-xs text-gray-400">Sep 3, 2025</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">📊 Results Available</div>
                  <button className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-sm hover:bg-green-500/30">
                    Check Results
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notice Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-2">18</div>
              <div className="text-sm text-gray-400">New Notices This Week</div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold text-red-400 mb-2">3</div>
              <div className="text-sm text-gray-400">Urgent Notices</div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold text-green-400 mb-2">45</div>
              <div className="text-sm text-gray-400">Total Active Notices</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
