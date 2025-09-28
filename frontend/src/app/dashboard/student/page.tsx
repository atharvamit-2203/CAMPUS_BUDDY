'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import CampusMiniMap from '@/components/CampusMiniMap';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Trophy, 
  Clock,
  UserPlus,
  BookOpen,
  Coffee,
  Award,
  ChevronRight,
  Bell,
  Activity
} from 'lucide-react';

// Mock data for dynamic content
const mockData = {
  upcomingClasses: [
    {
      id: 1,
      subject: 'Data Structures & Algorithms',
      time: '09:00 AM - 10:30 AM',
      room: 'Room 301',
      professor: 'Dr. Smith',
      type: 'Lecture'
    },
    {
      id: 2,
      subject: 'Web Development',
      time: '02:00 PM - 03:30 PM',
      room: 'Lab 205',
      professor: 'Prof. Johnson',
      type: 'Practical'
    },
    {
      id: 3,
      subject: 'Database Systems',
      time: '04:00 PM - 05:30 PM',
      room: 'Room 402',
      professor: 'Dr. Williams',
      type: 'Tutorial'
    }
  ],
  recentEvents: [
    {
      id: 1,
      title: 'Tech Symposium 2025',
      date: 'Sep 20, 2025',
      time: '10:00 AM',
      location: 'Main Auditorium',
      type: 'Academic',
      registered: true
    },
    {
      id: 2,
      title: 'Coding Competition',
      date: 'Sep 25, 2025',
      time: '02:00 PM',
      location: 'Computer Lab',
      type: 'Competition',
      registered: false
    },
    {
      id: 3,
      title: 'Industry Talk: AI in Business',
      date: 'Oct 01, 2025',
      time: '11:00 AM',
      location: 'Seminar Hall',
      type: 'Industry',
      registered: true
    }
  ],
  recommendedClubs: [
    {
      id: 1,
      name: 'Computer Science Society',
      members: 245,
      description: 'Explore latest trends in technology and programming',
      category: 'Technical',
      matchPercentage: 95,
      image: '/club-cs.jpg'
    },
    {
      id: 2,
      name: 'Innovation Club',
      members: 189,
      description: 'Foster creativity and entrepreneurial thinking',
      category: 'Innovation',
      matchPercentage: 87,
      image: '/club-innovation.jpg'
    },
    {
      id: 3,
      name: 'Web Developers Guild',
      members: 156,
      description: 'Master modern web technologies and frameworks',
      category: 'Technical',
      matchPercentage: 92,
      image: '/club-web.jpg'
    }
  ],
  networkingSuggestions: [
    {
      id: 1,
      name: 'Arjun Sharma',
      course: 'Computer Science',
      semester: '6th',
      commonInterests: ['React', 'Machine Learning', 'Startup'],
      mutualConnections: 12,
      avatar: '/avatar1.jpg'
    },
    {
      id: 2,
      name: 'Priya Patel',
      course: 'Information Technology',
      semester: '6th',
      commonInterests: ['UI/UX', 'Design Thinking'],
      mutualConnections: 8,
      avatar: '/avatar2.jpg'
    },
    {
      id: 3,
      name: 'Rahul Kumar',
      course: 'Computer Science',
      semester: '8th',
      commonInterests: ['DevOps', 'Cloud Computing'],
      mutualConnections: 15,
      avatar: '/avatar3.jpg'
    }
  ],
  todayMenu: [
    {
      category: 'Main Course',
      items: [
        { name: 'Butter Chicken with Rice', price: 120, available: true },
        { name: 'Veg Biryani', price: 100, available: true },
        { name: 'Paneer Tikka Masala', price: 110, available: false }
      ]
    },
    {
      category: 'Snacks',
      items: [
        { name: 'Samosa (2 pcs)', price: 30, available: true },
        { name: 'Sandwich', price: 50, available: true },
        { name: 'Pizza Slice', price: 80, available: true }
      ]
    },
    {
      category: 'Beverages',
      items: [
        { name: 'Tea', price: 15, available: true },
        { name: 'Coffee', price: 20, available: true },
        { name: 'Fresh Juice', price: 40, available: true }
      ]
    }
  ],
  academicProgress: {
    cgpa: 8.4,
    attendancePercentage: 87,
    assignmentsPending: 3,
    creditsCompleted: 145,
    totalCredits: 180
  },
  notifications: [
    {
      id: 1,
      title: 'Assignment Due Tomorrow',
      message: 'Data Structures assignment due by 11:59 PM',
      type: 'urgent',
      time: '2 hours ago'
    },
    {
      id: 2,
      title: 'New Event Added',
      message: 'Career Fair 2025 registration is now open',
      type: 'info',
      time: '5 hours ago'
    },
    {
      id: 3,
      title: 'Timetable Update',
      message: 'Database Systems class moved to Room 401',
      type: 'warning',
      time: '1 day ago'
    }
  ]
};

function StudentOrganizationsCard() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
        const resp = await fetch(`${API}/organizations/my`, { headers: { Authorization: `Bearer ${token}` }});
        if (!resp.ok) throw new Error('Failed to load organizations');
        const data = await resp.json();
        setOrgs(Array.isArray(data) ? data : (data.organizations || []));
      } catch (e: any) {
        setError(e?.message || 'Failed to load organizations');
      } finally { setLoading(false); }
    };
    run();
  }, []);
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white flex items-center mb-6">
        <Users className="w-5 h-5 mr-2 text-blue-400" />
        My Organizations
      </h2>
      {error && <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2 rounded mb-4">{error}</div>}
      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : orgs.length === 0 ? (
        <div className="text-gray-400">You have not joined any organizations yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgs.map((o:any) => (
            <div key={o.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-white font-medium">{o.organization_name || o.name}</div>
              {o.category && <div className="text-xs text-gray-400 mt-1">{o.category}</div>}
              <div className="text-xs text-gray-500 mt-2">Joined: {o.joined_at ? new Date(o.joined_at).toLocaleDateString() : '-'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="dashboard" />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-gray-400">Welcome to your personalized campus dashboard</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">CGPA</p>
                  <p className="text-2xl font-bold text-white">{mockData.academicProgress.cgpa}</p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Attendance</p>
                  <p className="text-2xl font-bold text-white">{mockData.academicProgress.attendancePercentage}%</p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-xl">
                  <Activity className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending Tasks</p>
                  <p className="text-2xl font-bold text-white">{mockData.academicProgress.assignmentsPending}</p>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Credits Progress</p>
                  <p className="text-2xl font-bold text-white">{mockData.academicProgress.creditsCompleted}/{mockData.academicProgress.totalCredits}</p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-xl">
                  <Award className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Today's Classes */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                    Today&apos;s Classes
                  </h2>
                  <span className="text-sm text-gray-400">{currentTime.toLocaleDateString()}</span>
                </div>
                <div className="space-y-4">
                  {mockData.upcomingClasses.map((class_item) => (
                    <div key={class_item.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-white">{class_item.subject}</h3>
                          <p className="text-sm text-gray-400">{class_item.professor} • {class_item.room}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-400">{class_item.time}</p>
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                            {class_item.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Organizations */}
              <StudentOrganizationsCard />

              {/* Quick Actions */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg p-4 text-center transition-colors">
                    <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <span className="text-sm text-white">View Timetable</span>
                  </button>
                  <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg p-4 text-center transition-colors">
                    <Coffee className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <span className="text-sm text-white">Order Food</span>
                  </button>
                  <button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg p-4 text-center transition-colors">
                    <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <span className="text-sm text-white">Find Peers</span>
                  </button>
                  <button className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-lg p-4 text-center transition-colors">
                    <BookOpen className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                    <span className="text-sm text-white">Study Resources</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              
              {/* Notifications */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white flex items-center mb-6">
                  <Bell className="w-5 h-5 mr-2 text-yellow-400" />
                  Notifications
                </h2>
                <div className="space-y-4">
                  {mockData.notifications.map((notification) => (
                    <div key={notification.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                          notification.type === 'urgent' ? 'bg-red-400' :
                          notification.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                        }`} />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white">{notification.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Networking Suggestions */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white flex items-center mb-6">
                  <UserPlus className="w-5 h-5 mr-2 text-green-400" />
                  Connect with Peers
                </h2>
                <div className="space-y-4">
                  {mockData.networkingSuggestions.map((peer) => (
                    <div key={peer.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-medium text-sm">{peer.name.charAt(0)}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white">{peer.name}</h4>
                            <p className="text-xs text-gray-400">{peer.course} • {peer.semester}</p>
                          </div>
                        </div>
                        <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs px-3 py-1 rounded-full transition-colors">
                          Connect
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        {peer.mutualConnections} mutual connections
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {peer.commonInterests.slice(0, 2).map((interest, index) => (
                          <span key={index} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Canteen Menu */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white flex items-center mb-6">
                  <Coffee className="w-5 h-5 mr-2 text-orange-400" />
                  Today&apos;s Menu
                </h2>
                <div className="space-y-4">
                  {mockData.todayMenu.slice(0, 1).map((category) => (
                    <div key={category.category}>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">{category.category}</h4>
                      <div className="space-y-2">
                        {category.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className={`${item.available ? 'text-white' : 'text-gray-500'}`}>
                              {item.name}
                            </span>
                            <span className="text-green-400">₹{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button className="w-full mt-4 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-sm py-2 rounded-lg transition-colors">
                    View Full Menu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
