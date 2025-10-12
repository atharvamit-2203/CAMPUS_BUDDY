'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Users, 
  Calendar, 
  MessageCircle, 
  BookOpen, 
  Target,
  LogOut,
  Settings,
  TrendingUp,
  Coffee,
  Trophy,
  ChevronRight,
  UserCheck,
  BarChart3,
  FileText,
  Brain,
  Building,
  Bell,
  Loader2,
  MapPin,
  Clock
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
}

type NotificationItem = {
  id: string | number;
  title?: string;
  message?: string;
  created_at?: string;
  read?: boolean;
  category?: string;
};

import dynamic from 'next/dynamic';
const GlobalChatbot = dynamic(() => import('./GlobalChatbot'), { ssr: false });
import ThemeToggle from './ThemeToggle';

const RoleBasedNavigation: React.FC<NavigationProps> = ({ currentPage }) => {
  const { user, logout, token } = useAuth();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [openPanel, setOpenPanel] = useState<boolean>(false);
  const [loadingPanel, setLoadingPanel] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('authToken') : '');

  // Track organizations where the current user (faculty) is the head
  const [headOrgs, setHeadOrgs] = useState<any[]>([]);

  const fetchUnread = async () => {
    if (!authToken) return;
    try {
      const resp = await fetch(`${API}/notifications/unread-count`, { headers: { Authorization: `Bearer ${authToken}` } });
      const data = await resp.json().catch(()=>({}));
      const c = (data?.unread ?? data?.count ?? data?.unread_count ?? 0) as number;
      setUnreadCount(Number.isFinite(c) ? c : 0);
    } catch {
      // ignore errors silently for badge
    }
  };

  const fetchNotifications = async () => {
    if (!authToken) return;
    try {
      setLoadingPanel(true);
      const resp = await fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${authToken}` } });
      const data = await resp.json().catch(()=>({ notifications: [] }));
      const list: any[] = Array.isArray(data) ? data : (Array.isArray(data.notifications) ? data.notifications : []);
      const mapped: NotificationItem[] = list.map((n:any) => ({
        id: n.id ?? n.notification_id ?? Math.random(),
        title: n.title ?? n.subject ?? 'Notification',
        message: n.message ?? n.body ?? '',
        created_at: n.created_at ?? n.createdAt ?? '',
        read: (n.read ?? n.is_read ?? false) ? true : false,
        category: n.category ?? ''
      }));
      setNotifications(mapped);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingPanel(false);
    }
  };

  const markAllAsRead = async () => {
    if (!authToken || notifications.length === 0) return;
    
    try {
      const unread = notifications.filter(n => !n.read);
      if (unread.length === 0) return;

      // Try the bulk mark as read endpoint first
      const bulkResponse = await fetch(`${API}/notifications/mark-read`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          notification_ids: unread.map(n => n.id) 
        })
      });

      if (bulkResponse.ok) {
        // Bulk update successful
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        return;
      }

      // Fallback to individual updates
      const results = await Promise.allSettled(
        unread.map(n => 
          fetch(`${API}/notifications/${n.id}/read`, { 
            method: 'POST', 
            headers: { Authorization: `Bearer ${authToken}` } 
          })
        )
      );

      // Update UI for successful requests
      const successfulIds = unread
        .filter((_, index) => results[index].status === 'fulfilled')
        .map(n => n.id);

      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          read: successfulIds.includes(n.id) ? true : n.read 
        }))
      );
      
      setUnreadCount(prev => Math.max(0, prev - successfulIds.length));
      
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  // Load organizations where this faculty is head (based on backend data)
  useEffect(() => {
    const loadHeadOrgs = async () => {
      if (!authToken) { setHeadOrgs([]); return; }
      try {
        const resp = await fetch(`${API}/organizations/detailed`, { headers: { Authorization: `Bearer ${authToken}` } });
        const data = await resp.json().catch(() => []);
        const list: any[] = Array.isArray(data) ? data : [];
        // Match by head.email with current user's email
        const email = (user && (user.email || user.username || ''))?.toLowerCase?.() || '';
        const mine = list.filter((o: any) => (o.head?.email || '').toLowerCase() === email);
        setHeadOrgs(mine);
      } catch {
        setHeadOrgs([]);
      }
    };
    loadHeadOrgs();
  }, [authToken]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) {
        setOpenPanel(false);
      }
    };
    if (openPanel) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [openPanel]);

  // Define navigation items based on user role
  if (!user) return null;

  const getNavigationItems = () => {
    switch (user.role) {
      case 'student':
        return [
          { href: '/dashboard/student', label: 'Dashboard', icon: TrendingUp },
          { href: '/dashboard/student/timetable', label: 'Timetable', icon: Calendar },
          { href: '/dashboard/student/events', label: 'Events', icon: Calendar },
          { href: '/dashboard/student/networking', label: 'Networking', icon: Users },
          { href: '/dashboard/student/skills', label: 'Skills', icon: Target },
          { href: '/dashboard/student/organizations', label: 'Organizations', icon: Users },
          { href: '/dashboard/student/resources', label: 'Resources', icon: BookOpen },
          { href: '/dashboard/student/canteen', label: 'Canteen', icon: Coffee },
          { href: '/dashboard/student/campus_navigation', label: 'Campus Navigation', icon: MapPin },
        ];
      
      case 'faculty': {
        const base = [
          { href: '/dashboard/faculty', label: 'Dashboard', icon: TrendingUp },
          { href: '/dashboard/faculty/timetable', label: 'Timetable', icon: Calendar },
          { href: '/dashboard/faculty/students', label: 'Students', icon: Users },
          { href: '/dashboard/faculty/committees', label: 'Committees', icon: UserCheck },
        ];
        // If this faculty is head of one or more organizations, expose organization access
        if (headOrgs.length > 0) {
          base.splice(1, 0, { href: '/dashboard/organization', label: 'Organization (Head)', icon: Users });
        }
        // If faculty is assigned to canteen department, expose staff console
        try {
          if ((user as any)?.department && ((user as any).department || '').toLowerCase() === 'canteen') {
            base.splice(1, 0, { href: '/dashboard/staff/canteen', label: 'Canteen Staff', icon: Coffee });
          }
        } catch {}
        return base;
      }
      
      case 'organization':
        return [
          { href: '/dashboard/organization', label: 'Dashboard', icon: TrendingUp },
          { href: '/dashboard/organization/events', label: 'Events', icon: Calendar },
          { href: '/dashboard/organization/recruitment', label: 'Recruitment', icon: UserCheck },
          { href: '/dashboard/organization/teams', label: 'Teams', icon: Users },
          { href: '/dashboard/organization/meetings', label: 'Meetings', icon: MessageCircle },
          { href: '/dashboard/organization/analytics', label: 'Analytics', icon: BarChart3 },
        ];
      
      case 'staff':
        return [
          { href: '/dashboard/staff/canteen', label: 'Canteen', icon: Coffee },
        ];
      
      default: // admin
        return [
          { href: '/dashboard/admin', label: 'Dashboard', icon: TrendingUp },
          { href: '/dashboard/admin/system', label: 'System', icon: Settings },
          { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="w-64 bg-black/60 backdrop-blur-xl border-r border-white/10 h-screen flex flex-col">
      {/* User Profile + Notifications */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">{user.full_name}</h3>
              <p className="text-gray-400 text-sm capitalize">{user.role}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative" ref={panelRef}>
              <button
                className={`relative p-2 rounded-lg transition-all duration-200 ${
                  unreadCount > 0 
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 animate-pulse' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
                title={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                onClick={async () => {
                  const next = !openPanel;
                  setOpenPanel(next);
                  if (next) {
                    await fetchNotifications();
                  }
                }}
              >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 animate-pulse shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {unreadCount > 0 && (
                  <div className="absolute inset-0 bg-blue-400/20 rounded-lg animate-ping"></div>
                )}
              </button>
            </div>
            <ThemeToggle />
          </div>

          {openPanel && (
            <div className="fixed top-16 right-2 sm:right-4 w-[95vw] sm:w-[420px] max-w-[420px] bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-[100] max-h-[calc(100vh-80px)] overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Bell className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-white font-semibold">Notifications</span>
                    {notifications.length > 0 && (
                      <div className="text-xs text-gray-400">
                        {notifications.filter(n => !n.read).length} unread of {notifications.length}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {notifications.length > 0 && notifications.some(n => !n.read) && (
                    <button 
                      onClick={markAllAsRead} 
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button 
                    onClick={() => setOpenPanel(false)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Close"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent min-h-0">
                {loadingPanel ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <div className="relative">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                      <div className="absolute inset-0 w-8 h-8 border-2 border-blue-400/20 rounded-full"></div>
                    </div>
                    <div className="mt-4 text-sm">Loading notifications...</div>
                    <div className="text-xs text-gray-500 mt-1">Please wait a moment</div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-gray-300 font-medium mb-2">All caught up!</div>
                    <div className="text-sm text-gray-500">No new notifications to show</div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-4 sm:p-5 transition-all duration-200 hover:bg-white/5 cursor-pointer ${!n.read ? 'bg-blue-500/5 border-l-4 border-l-blue-400' : ''}`}>
                        <div className="flex items-start space-x-3">
                          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className={`text-sm font-medium leading-snug break-words ${!n.read ? 'text-white' : 'text-gray-300'}`}>
                                {n.title || 'Notification'}
                              </h4>
                              {!n.read && (
                                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">New</span>
                              )}
                            </div>
                            {n.message && (
                              <p className={`text-sm mt-2 leading-relaxed break-words ${!n.read ? 'text-gray-200' : 'text-gray-400'}`}>
                                {n.message}
                              </p>
                            )}
                            {n.created_at && (
                              <div className="text-xs text-gray-500 mt-3 flex items-center">
                                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">
                                  {new Date(n.created_at).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.href;
            
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-white/10 ${
                    isActive ? 'bg-blue-600/20 border border-blue-500/30 text-blue-400' : 'text-gray-300 hover:text-white'
                  }`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/10">
        <button className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 w-full">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
        
        <button 
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 w-full mt-2"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
      <GlobalChatbot />
    </div>
  );
};

export default RoleBasedNavigation;
