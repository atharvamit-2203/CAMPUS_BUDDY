'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import CampusMiniMap from '@/components/CampusMiniMap';
import { 
  Calendar, 
  Users, 
  Clock,
  UserPlus,
  BookOpen,
  Coffee,
  Award,
  ChevronRight,
  Bell
} from 'lucide-react';

// Dynamic data will be loaded from backend APIs; removed mock data.

function StudentClubsCard() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
        
        // Use clubs endpoint
        const resp = await fetch(`${API}/clubs/my`, { headers: { Authorization: `Bearer ${token}` }});
        
        if (!resp.ok) throw new Error('Failed to load clubs');
        const data = await resp.json();
        const clubList = Array.isArray(data) ? data : [];
        // Only show approved/active memberships
        const activeClubs = clubList.filter((c:any) => {
          const status = c.status || c.membership_status;
          return !status || ['active', 'member', 'approved'].includes(status);
        });
        setClubs(activeClubs);
      } catch (e: any) {
        setError(e?.message || 'Failed to load clubs');
      } finally { setLoading(false); }
    };
    run();
  }, []);
  
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-400" />
          My Clubs
        </h2>
        <a 
          href="/dashboard/student/organizations" 
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center"
        >
          View All <ChevronRight className="w-4 h-4 ml-1" />
        </a>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2 rounded mb-4">{error}</div>}
      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <div className="text-gray-400 mb-4">You haven&apos;t joined any clubs yet.</div>
          <a 
            href="/dashboard/student/organizations" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors inline-flex items-center"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Explore Clubs
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {clubs.slice(0, 3).map((c: any) => (
            <div key={c.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-white font-medium">{c.club_name || c.name}</div>
                  <div className="flex items-center space-x-3 mt-1">
                    {c.category && <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">{c.category}</span>}
                    {(c.status || c.membership_status) && (
                      <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                        {(c.status || c.membership_status) === 'approved' ? 'Member' : (c.status || c.membership_status)}
                      </span>
                    )}
                  </div>
                  {c.joined_at && (
                    <div className="text-xs text-gray-500 mt-2">Joined: {new Date(c.joined_at).toLocaleDateString()}</div>
                  )}
                </div>
                <div className="text-green-400">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
          {clubs.length > 3 && (
            <div className="text-center pt-2">
              <a 
                href="/dashboard/student/organizations" 
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View all {clubs.length} clubs
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AllClubsCard() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
        const resp = await fetch(`${API}/clubs/detailed`, { headers: { Authorization: `Bearer ${token}` }});
        if (!resp.ok) throw new Error('Failed to load clubs');
        const data = await resp.json();
        setClubs(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load clubs');
      } finally { setLoading(false); }
    };
    run();
  }, []);
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white flex items-center mb-6">
        <Users className="w-5 h-5 mr-2 text-purple-400" />
        All Clubs
      </h2>
      {error && <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-2 rounded mb-4">{error}</div>}
      {loading ? (
        <div className="text-gray-300">Loading...</div>
      ) : clubs.length === 0 ? (
        <div className="text-gray-400">No clubs found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs.map((c: any) => (
            <div key={c.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-medium">{c.club_name || c.name}</div>
                {c.member_count != null && (
                  <span className="text-xs text-gray-400">{c.member_count} members</span>
                )}
              </div>
              {c.head && (
                <div className="text-xs text-gray-300">Head: {c.head.name || '-'}{c.head.email ? ` • ${c.head.email}` : ''}</div>
              )}
              {c.departments && c.departments.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-1">Departments:</div>
                  <div className="flex flex-wrap gap-1">
                    {c.departments.map((d:string, idx:number)=> (
                      <span key={idx} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">{d}</span>
                    ))}
                  </div>
                </div>
              )}
              {c.activities && c.activities.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-gray-400 mb-1">Recent Activities:</div>
                  <ul className="text-xs text-gray-300 list-disc list-inside space-y-1">
                    {c.activities.slice(0,3).map((a:any, i:number)=> (
                      <li key={i}>{a.title} {a.date ? `• ${a.date}` : ''}{a.start_time ? ` ${a.start_time}` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
              {c.description && (
                <p className="text-xs text-gray-400 mt-3">{c.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const { user, isAuthenticated, isLoading, setIntendedRoute } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      setIntendedRoute('/dashboard/student');
      router.replace('/login');
      return;
    }

    if (user.role !== 'student') {
      setIntendedRoute('/dashboard/student');
      router.replace(`/dashboard/${user.role}`);
    }
  }, [isAuthenticated, isLoading, router, setIntendedRoute, user]);

  // Dynamic dashboard data (no hardcoded mock values)
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [orgsCount, setOrgsCount] = useState<number>(0);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true);
      setLoadError('');
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

      const [upRes, notifRes, orgsRes, menuRes] = await Promise.all([
        fetch(`${API}/timetable/upcoming?window=720`, { headers }).then(r => r.json()).catch(()=>({ upcoming: [] })),
        fetch(`${API}/notifications`, { headers }).then(r => r.json()).catch(()=>[]),
        fetch(`${API}/organizations/my`, { headers }).then(r => r.json()).catch(()=>[]),
        fetch(`${API}/canteen/menu`, { headers }).then(r => r.json()).catch(()=>[]),
      ]);

      const up = Array.isArray(upRes?.upcoming) ? upRes.upcoming : (Array.isArray(upRes) ? upRes : []);
      setUpcoming(up);

      const noti = Array.isArray(notifRes) ? notifRes : (Array.isArray(notifRes?.notifications) ? notifRes.notifications : []);
      setNotifications(noti);

      const orgs = Array.isArray(orgsRes) ? orgsRes : (Array.isArray(orgsRes?.organizations) ? orgsRes.organizations : []);
      setOrgsCount(orgs.length || 0);

      // Menu may come back as categories or flat items; normalize to categories
      let cats: any[] = [];
      if (Array.isArray(menuRes)) {
        cats = menuRes;
      } else if (Array.isArray(menuRes?.categories)) {
        cats = menuRes.categories;
      } else if (Array.isArray(menuRes?.items)) {
        cats = [{ category: 'Menu', items: menuRes.items }];
      }
      setMenuCategories(cats);
    } catch (e:any) {
      setLoadError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

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
                  <p className="text-gray-400 text-sm">Upcoming Classes</p>
                  <p className="text-2xl font-bold text-white">{upcoming.length}</p>
                </div>
                <div className="bg-green-500/20 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Unread Notifications</p>
                  <p className="text-2xl font-bold text-white">{notifications.filter((n:any)=>!n.read && !n.is_read).length || notifications.length}</p>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-xl">
                  <Bell className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">My Organizations</p>
                  <p className="text-2xl font-bold text-white">{orgsCount}</p>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-xl">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Menu Categories</p>
                  <p className="text-2xl font-bold text-white">{menuCategories.length}</p>
                </div>
                <div className="bg-orange-500/20 p-3 rounded-xl">
                  <Coffee className="w-6 h-6 text-orange-400" />
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
{(upcoming || []).map((it:any, idx:number) => {
                    const subject = it.subject || it.course || 'Class';
                    const room = it.room || it.room_name || it.location || '-';
                    const timeLabel = it.time || (it.start_time && it.end_time ? `${it.start_time} - ${it.end_time}` : it.start_time || '-');
                    const type = it.type || it.classType || it.kind || 'Lecture';
                    return (
                      <div key={it.id || it.key || idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-white">{subject}</h3>
                            <p className="text-sm text-gray-400">{room}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-blue-400">{timeLabel}</p>
                            <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                              {type}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* My Clubs */}
              <StudentClubsCard />

              {/* All Clubs */}
              <AllClubsCard />

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
              
              {/* Mini Map */}
              <CampusMiniMap title="Campus Map" />
              
              {/* Notifications */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white flex items-center mb-6">
                  <Bell className="w-5 h-5 mr-2 text-yellow-400" />
                  Notifications
                </h2>
                <div className="space-y-4">
{(notifications || []).slice(0, 5).map((n:any, idx:number) => {
                  const nType = n.type || n.level || 'info';
                  const dotClass = nType === 'urgent' ? 'bg-red-400' : (nType === 'warning' ? 'bg-yellow-400' : 'bg-blue-400');
                  return (
                    <div key={n.id || idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-start">
                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${dotClass}`} />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white">{n.title || n.header || 'Notification'}</h4>
                          <p className="text-xs text-gray-400 mt-1">{n.message || n.text || n.description}</p>
                          {(n.time || n.created_at) && (
                            <p className="text-xs text-gray-500 mt-2">{n.time || new Date(n.created_at).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

{/* Connect with Peers (CTA) */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white flex items-center mb-3">
                  <UserPlus className="w-5 h-5 mr-2 text-green-400" />
                  Connect with Peers
                </h2>
                <p className="text-sm text-gray-300 mb-3">Discover classmates and build your network across organizations and courses.</p>
                <div className="flex gap-2">
                  <a href="/connections" className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-lg transition-colors">Open Connections</a>
                  <a href="/organizations" className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded-lg transition-colors">Explore Organizations</a>
                </div>
              </div>

              {/* Today's Canteen Menu */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white flex items-center mb-6">
                  <Coffee className="w-5 h-5 mr-2 text-orange-400" />
                  Today&apos;s Menu
                </h2>
                <div className="space-y-4">
{(menuCategories || []).slice(0,1).map((category:any) => (
                    <div key={category.category || category.name || 'Menu'}>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">{category.category || category.name || 'Menu'}</h4>
                      <div className="space-y-2">
                        {(category.items || []).slice(0, 2).map((item:any, index:number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className={`${(item.available ?? true) ? 'text-white' : 'text-gray-500'}`}>
                              {item.name || item.title}
                            </span>
                            {item.price != null && <span className="text-green-400">₹{item.price}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <a href="/canteen" className="block w-full mt-4 text-center bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-sm py-2 rounded-lg transition-colors">
                    View Full Menu
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
