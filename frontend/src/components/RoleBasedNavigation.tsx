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
  MapPin
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
    if (!authToken) return;
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => fetch(`${API}/notifications/${n.id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } })));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
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
                className="relative p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
                title="Notifications"
                onClick={async () => {
                  const next = !openPanel;
                  setOpenPanel(next);
                  if (next) {
                    await fetchNotifications();
                  }
                }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
            <ThemeToggle />
          </div>

          {openPanel && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                <span className="text-white font-medium">Notifications</span>
                <button onClick={markAllAsRead} className="text-xs text-blue-400 hover:text-blue-300">Mark all as read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loadingPanel ? (
                  <div className="flex items-center justify-center py-6 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-gray-400 text-sm">No notifications</div>
                ) : (
                  <ul className="divide-y divide-white/10">
                    {notifications.map((n) => (
                      <li key={n.id} className={`p-4 ${n.read ? 'opacity-70' : ''}`}>
                        <div className="text-sm font-semibold text-white">{n.title || 'Notification'}</div>
                        {n.message && <div className="text-sm text-gray-300 mt-1">{n.message}</div>}
                        {n.created_at && (
                          <div className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                        )}
                      </li>
                    ))}
                  </ul>
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
