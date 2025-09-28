'use client';

import React from 'react';
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
  Building
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
}

const RoleBasedNavigation: React.FC<NavigationProps> = ({ currentPage }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Define navigation items based on user role
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
        ];
      
      case 'faculty':
        return [
          { href: '/dashboard/faculty', label: 'Dashboard', icon: TrendingUp },
          { href: '/dashboard/faculty/courses', label: 'Courses', icon: BookOpen },
          { href: '/dashboard/faculty/timetable', label: 'Timetable', icon: Calendar },
          { href: '/dashboard/faculty/students', label: 'Students', icon: Users },
          { href: '/dashboard/faculty/research', label: 'Research', icon: Brain },
          { href: '/dashboard/faculty/assignments', label: 'Assignments', icon: FileText },
          { href: '/dashboard/faculty/analytics', label: 'Analytics', icon: BarChart3 },
          { href: '/dashboard/faculty/committees', label: 'Committees', icon: UserCheck },
        ];
      
      case 'organization':
        return [
          { href: '/dashboard/organization', label: 'Dashboard', icon: TrendingUp },
          { href: '/dashboard/organization/events', label: 'Events', icon: Calendar },
          { href: '/dashboard/organization/recruitment', label: 'Recruitment', icon: UserCheck },
          { href: '/dashboard/organization/teams', label: 'Teams', icon: Users },
          { href: '/dashboard/organization/meetings', label: 'Meetings', icon: MessageCircle },
          { href: '/dashboard/organization/analytics', label: 'Analytics', icon: BarChart3 },
        ];
      
      default: // admin
        return [
          { href: '/dashboard/admin', label: 'Dashboard', icon: TrendingUp },
          { href: '/dashboard/admin/users', label: 'Users', icon: Users },
          { href: '/dashboard/admin/colleges', label: 'Colleges', icon: Building },
          { href: '/dashboard/admin/system', label: 'System', icon: Settings },
          { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
        ];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="w-64 bg-black/60 backdrop-blur-xl border-r border-white/10 h-screen flex flex-col">
      {/* User Profile Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{user.full_name}</h3>
            <p className="text-gray-400 text-sm capitalize">{user.role}</p>
          </div>
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
  import dynamic from 'next/dynamic';
const GlobalChatbot = dynamic(()=>import('./GlobalChatbot'), { ssr: false });

export default RoleBasedNavigation;
m 'next/dynamic'
const _noop = null
export default RoleBasedNavigation;
