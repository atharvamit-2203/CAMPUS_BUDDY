'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { 
  TrendingUp, 
  Users, 
  Building,
  BarChart3,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserPlus,
  Edit,
  Trash2,
  Search,
  Filter,
  Clock,
  MapPin,
  Plus,
  Save
} from 'lucide-react';

// Admin-specific interfaces
interface SystemStats {
  totalUsers: number;
  totalColleges: number;
  activeEvents: number;
  systemUptime: string;
  storageUsed: number;
  storageLimit: number;
}

interface UserSummary {
  id: number;
  full_name: string;
  email: string;
  role: 'student' | 'faculty' | 'organization';
  college_name: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login: string;
  created_at: string;
}

interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  students_count: number;
  faculty_count: number;
  status: 'active' | 'inactive';
  created_at: string;
}

interface SystemAlert {
  id: number;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface TimetableEntry {
  id: string;
  college_id: string;
  college_name: string;
  day: string;
  time: string;
  subject: string;
  faculty: string;
  room: string;
  batch: string;
  semester: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [editingTimetable, setEditingTimetable] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<string>('all');

  useEffect(() => {
    if (user) {
      const fetchAdminData = async () => {
        try {
          // Mock data - replace with actual API calls
          setSystemStats({
            totalUsers: 15420,
            totalColleges: 45,
            activeEvents: 128,
            systemUptime: '99.9%',
            storageUsed: 750,
            storageLimit: 1000
          });

          setUsers([
            {
              id: 1,
              full_name: 'John Smith',
              email: 'john.smith@university.edu',
              role: 'student',
              college_name: 'Tech University',
              status: 'active',
              last_login: '2025-09-12 10:30 AM',
              created_at: '2025-01-15'
            },
            {
              id: 2,
              full_name: 'Dr. Sarah Johnson',
              email: 'sarah.johnson@university.edu',
              role: 'faculty',
              college_name: 'Engineering College',
              status: 'active',
              last_login: '2025-09-12 09:15 AM',
              created_at: '2024-08-22'
            },
            {
              id: 3,
              full_name: 'TechCorp Recruiter',
              email: 'recruiter@techcorp.com',
              role: 'organization',
              college_name: 'N/A',
              status: 'active',
              last_login: '2025-09-11 04:45 PM',
              created_at: '2025-03-10'
            }
          ]);

          setColleges([
            {
              id: 'COL001',
              name: 'Tech University',
              city: 'Mumbai',
              state: 'Maharashtra',
              students_count: 5420,
              faculty_count: 245,
              status: 'active',
              created_at: '2020-01-15'
            },
            {
              id: 'COL002',
              name: 'Engineering College',
              city: 'Pune',
              state: 'Maharashtra',
              students_count: 3200,
              faculty_count: 180,
              status: 'active',
              created_at: '2019-06-20'
            }
          ]);

          setAlerts([
            {
              id: 1,
              type: 'warning',
              message: 'High server load detected - response times may be slower',
              timestamp: '2025-09-12 11:30 AM',
              resolved: false
            },
            {
              id: 2,
              type: 'info',
              message: 'System backup completed successfully',
              timestamp: '2025-09-12 03:00 AM',
              resolved: true
            },
            {
              id: 3,
              type: 'error',
              message: 'Email service temporarily unavailable',
              timestamp: '2025-09-11 09:15 PM',
              resolved: true
            }
          ]);

          setTimetables([
            {
              id: '1',
              college_id: '1',
              college_name: 'Tech University',
              day: 'Monday',
              time: '9:00 AM',
              subject: 'Database Management',
              faculty: 'Dr. Sarah Johnson',
              room: 'CS-301',
              batch: 'CS-6A',
              semester: '6th'
            },
            {
              id: '2',
              college_id: '1',
              college_name: 'Tech University',
              day: 'Monday',
              time: '10:00 AM',
              subject: 'Software Engineering',
              faculty: 'Prof. Michael Chen',
              room: 'CS-302',
              batch: 'CS-6B',
              semester: '6th'
            },
            {
              id: '3',
              college_id: '2',
              college_name: 'Engineering Institute',
              day: 'Tuesday',
              time: '11:00 AM',
              subject: 'Machine Learning',
              faculty: 'Dr. Emily Davis',
              room: 'AI-101',
              batch: 'CS-8A',
              semester: '8th'
            }
          ]);
        } catch (error) {
          console.error('Error fetching admin data:', error);
        }
      };

      fetchAdminData();
    }
  }, [user]);

  const handleUserStatusChange = (userId: number, newStatus: UserSummary['status']) => {
    setUsers(users.map(user =>
      user.id === userId
        ? { ...user, status: newStatus }
        : user
    ));
  };

  const handleResolveAlert = (alertId: number) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, resolved: true }
        : alert
    ));
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600/20 to-purple-600/20 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">System Administration</h2>
            <p className="text-gray-300">Monitor and manage the entire platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{systemStats?.systemUptime}</div>
              <div className="text-sm text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {systemStats?.storageUsed}/{systemStats?.storageLimit}GB
              </div>
              <div className="text-sm text-gray-400">Storage</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-xl font-bold text-white">{systemStats?.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Users</div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Building className="w-8 h-8 text-green-400" />
            <div>
              <div className="text-xl font-bold text-white">{systemStats?.totalColleges}</div>
              <div className="text-sm text-gray-400">Colleges</div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="text-xl font-bold text-white">{systemStats?.activeEvents}</div>
              <div className="text-sm text-gray-400">Active Events</div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-purple-400" />
            <div>
              <div className="text-xl font-bold text-white">
                {systemStats && Math.round((systemStats.storageUsed / systemStats.storageLimit) * 100)}%
              </div>
              <div className="text-sm text-gray-400">Storage Used</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <AlertTriangle className="w-6 h-6 mr-2 text-yellow-400" />
          System Alerts
        </h3>
        
        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                {alert.type === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
                {alert.type === 'info' && <Shield className="w-5 h-5 text-blue-400" />}
                {alert.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                <div>
                  <div className="text-white">{alert.message}</div>
                  <div className="text-gray-400 text-sm">{alert.timestamp}</div>
                </div>
              </div>
              
              {!alert.resolved && (
                <button 
                  onClick={() => handleResolveAlert(alert.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Resolve
                </button>
              )}
              
              {alert.resolved && (
                <span className="text-green-400 text-sm">Resolved</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent User Activity */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Users className="w-6 h-6 mr-2 text-blue-400" />
          Recent User Activity
        </h3>
        
        <div className="space-y-3">
          {users.slice(0, 5).map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="text-white font-medium">{user.full_name}</div>
                <div className="text-gray-400 text-sm">{user.email} • {user.college_name}</div>
                <div className="text-gray-400 text-sm">Last login: {user.last_login}</div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  user.role === 'student' ? 'bg-blue-600/20 text-blue-400' :
                  user.role === 'faculty' ? 'bg-purple-600/20 text-purple-400' :
                  'bg-green-600/20 text-green-400'
                }`}>
                  {user.role}
                </span>
                
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  user.status === 'active' ? 'bg-green-600/20 text-green-400' :
                  user.status === 'inactive' ? 'bg-gray-600/20 text-gray-400' :
                  'bg-red-600/20 text-red-400'
                }`}>
                  {user.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
          <button className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-gray-300">User</th>
                <th className="text-left p-4 text-gray-300">Role</th>
                <th className="text-left p-4 text-gray-300">College</th>
                <th className="text-left p-4 text-gray-300">Status</th>
                <th className="text-left p-4 text-gray-300">Last Login</th>
                <th className="text-left p-4 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-4">
                    <div>
                      <div className="text-white font-medium">{user.full_name}</div>
                      <div className="text-gray-400 text-sm">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'student' ? 'bg-blue-600/20 text-blue-400' :
                      user.role === 'faculty' ? 'bg-purple-600/20 text-purple-400' :
                      'bg-green-600/20 text-green-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{user.college_name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-600/20 text-green-400' :
                      user.status === 'inactive' ? 'bg-gray-600/20 text-gray-400' :
                      'bg-red-600/20 text-red-400'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{user.last_login}</td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleUserStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}
                        className={`transition-colors ${
                          user.status === 'active' 
                            ? 'text-red-400 hover:text-red-300' 
                            : 'text-green-400 hover:text-green-300'
                        }`}
                        title={user.status === 'active' ? 'Suspend' : 'Activate'}
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderColleges = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">College Management</h2>
        <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Building className="w-4 h-4" />
          <span>Add College</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {colleges.map((college) => (
          <div key={college.id} className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-lg">{college.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                college.status === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
              }`}>
                {college.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Location:</span>
                <span className="text-white">{college.city}, {college.state}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Students:</span>
                <span className="text-white">{college.students_count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Faculty:</span>
                <span className="text-white">{college.faculty_count}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Established:</span>
                <span className="text-white">{college.created_at}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-sm">
                View Details
              </button>
              <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors text-sm">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTimetables = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Timetable Management</h2>
        <div className="flex space-x-2">
          <select 
            value={selectedCollege}
            onChange={(e) => setSelectedCollege(e.target.value)}
            className="bg-black/40 text-white border border-white/20 rounded px-3 py-2"
            title="Select college to filter timetables"
          >
            <option value="all">All Colleges</option>
            {colleges.map((college) => (
              <option key={college.id} value={college.id}>{college.name}</option>
            ))}
          </select>
          <button 
            onClick={() => setEditingTimetable(!editingTimetable)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              editingTimetable 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>{editingTimetable ? 'Save Changes' : 'Edit Mode'}</span>
          </button>
          <button className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Global Timetable Overview */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-blue-400" />
          Global Timetable Management
        </h3>
        
        {editingTimetable && (
          <div className="mb-4 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm">
              <strong>Admin Editing Mode:</strong> You can modify timetables across all colleges. Changes will affect the respective institutions.
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-gray-300">College</th>
                <th className="text-left p-4 text-gray-300">Day</th>
                <th className="text-left p-4 text-gray-300">Time</th>
                <th className="text-left p-4 text-gray-300">Subject</th>
                <th className="text-left p-4 text-gray-300">Faculty</th>
                <th className="text-left p-4 text-gray-300">Room</th>
                <th className="text-left p-4 text-gray-300">Batch</th>
                <th className="text-left p-4 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {timetables
                .filter(entry => selectedCollege === 'all' || entry.college_id === selectedCollege)
                .map((entry) => (
                <tr key={entry.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-4 text-white">{entry.college_name}</td>
                  <td className="p-4 text-gray-400">{entry.day}</td>
                  <td className="p-4 text-blue-400 font-medium">{entry.time}</td>
                  <td className="p-4">
                    {editingTimetable ? (
                      <input
                        type="text"
                        value={entry.subject}
                        onChange={(e) => updateTimetableEntry(entry.id, 'subject', e.target.value)}
                        className="bg-black/40 text-white border border-white/20 rounded px-2 py-1 w-full"
                        placeholder="Subject name"
                        title="Subject name"
                      />
                    ) : (
                      <span className="text-white">{entry.subject}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {editingTimetable ? (
                      <input
                        type="text"
                        value={entry.faculty}
                        onChange={(e) => updateTimetableEntry(entry.id, 'faculty', e.target.value)}
                        className="bg-black/40 text-white border border-white/20 rounded px-2 py-1 w-full"
                        placeholder="Faculty name"
                        title="Faculty name"
                      />
                    ) : (
                      <span className="text-gray-400">{entry.faculty}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {editingTimetable ? (
                      <input
                        type="text"
                        value={entry.room}
                        onChange={(e) => updateTimetableEntry(entry.id, 'room', e.target.value)}
                        className="bg-black/40 text-white border border-white/20 rounded px-2 py-1 w-20"
                        placeholder="Room"
                        title="Room number"
                      />
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <MapPin className="w-4 h-4 mr-1" />
                        {entry.room}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-gray-400">{entry.batch}</td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button className="text-blue-400 hover:text-blue-300 p-1" title="Edit entry">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-300 p-1" title="Delete entry">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Operations */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Bulk Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors">
            Import CSV
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors">
            Export All
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors">
            Generate Reports
          </button>
          <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg transition-colors">
            Sync Colleges
          </button>
        </div>
      </div>
    </div>
  );

  const [roles, setRoles] = useState<{id:number, code:string, name:string, description:string}[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const resp = await fetch(`${API}/admin/roles`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }});
      const data = await resp.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (e) { /* noop */ } finally { setLoadingRoles(false); }
  };

  React.useEffect(()=>{ loadRoles(); }, []);

  const assignUser = async (role_id: number) => {
    const uid = prompt('Enter user id to assign');
    if (!uid) return;
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    await fetch(`${API}/admin/roles/${role_id}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` }, body: JSON.stringify({ user_id: Number(uid) }) });
    alert('Assigned');
  };

  const renderAdmins = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Admin Roles</h2>
        <button onClick={loadRoles} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {loadingRoles ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-black/40 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-semibold">{role.name}</div>
                <span className="px-2 py-1 rounded text-xs bg-green-600/20 text-green-400">Active</span>
              </div>
              <div className="text-sm text-gray-400 mb-4">{role.description}</div>
              <div className="flex items-center gap-2">
                <button onClick={()=>assignUser(role.id)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm">Assign User</button>
                <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg text-sm" disabled>Edit</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Admin Activity</h3>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="text-white">Updated role permissions</div>
              <div className="text-gray-400 text-sm">Just now</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const updateTimetableEntry = (id: string, field: string, value: string) => {
    const updatedTimetables = timetables.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    setTimetables(updatedTimetables);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/admin" />
      
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-400">System Administration & Management</p>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-4">
              {[
{ id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'colleges', label: 'Colleges', icon: Building },
                { id: 'timetables', label: 'Timetables', icon: BarChart3 },
                { id: 'admins', label: 'Admins', icon: Shield }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-red-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
      </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'colleges' && renderColleges()}
        {activeTab === 'timetables' && renderTimetables()}
        {activeTab === 'admins' && renderAdmins()}
      </div>
    </div>
  );
};

export default AdminDashboard;
