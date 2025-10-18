'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { 
  TrendingUp, 
  Users, 
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
  Save,
  Upload as UploadIcon,
  Image as ImageIcon,
  Calendar
} from 'lucide-react';

// Admin-specific interfaces
interface SystemStats {
  totalUsers: number;
  activeEvents: number;
  systemUptime: string;
  storageUsed: number;
  storageLimit: number;
}

interface UserSummary {
  id: number;
  full_name: string;
  email: string;
  role: 'student' | 'faculty' | 'organization' | 'admin' | 'staff';
  department: string;
  course?: string;
  semester?: number;
  status: 'active' | 'inactive' | 'suspended';
  last_login: string;
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
  day: string;
  time: string;
  subject: string;
  faculty: string;
  room: string;
  batch: string;
  semester: string;
}

import { canteenAPI } from '@/services/api';
import AdminUserManagement from '@/components/AdminUserManagement';
import ClubCalendar from '@/components/ClubCalendar';
import TimeParsingTest from '@/components/TimeParsingTest';
import EventApprovalList from '@/components/EventApprovalList';

const AdminDashboard = () => {
  const { user, isAuthenticated, isLoading, setIntendedRoute } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      setIntendedRoute('/dashboard/admin');
      router.replace('/login');
      return;
    }

    if (user.role !== 'admin') {
      setIntendedRoute('/dashboard/admin');
      router.replace(`/dashboard/${user.role}`);
    }
  }, [isAuthenticated, isLoading, router, user, setIntendedRoute]);

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [timetables, setTimetables] = useState<TimetableEntry[]>([]);
  const [editingTimetable, setEditingTimetable] = useState(false);

  // Canteen admin state
  const [latestAsset, setLatestAsset] = useState<any>(null);
  const [uploadingMenu, setUploadingMenu] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [promoteUserId, setPromoteUserId] = useState<string>('');
  const [orders, setOrders] = useState<any[]>([]);
  const [approvalRefreshKey, setApprovalRefreshKey] = useState(0);

  const handleApprovalRefresh = () => {
    setApprovalRefreshKey(prev => prev + 1);
  };

  const loadCanteen = useCallback(async () => {
    try {
      const [assetRes, staffRes, ordersRes] = await Promise.all([
        canteenAPI.getLatestMenuAsset().catch(()=>({ asset: null })),
        canteenAPI.listStaff().catch(()=>[]),
        canteenAPI.listOrdersAll().catch(()=>[]),
      ]);
      setLatestAsset((assetRes as any)?.asset || null);
      setStaff(Array.isArray(staffRes) ? staffRes : []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      const fetchAdminData = async () => {
        try {
          const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const headers = { Authorization: `Bearer ${localStorage.getItem('authToken')}` };

          // Fetch system stats
          try {
            const statsResponse = await fetch(`${API}/admin/system/stats`, { headers });
            const statsData = await statsResponse.json();
            if (!statsData.error) {
              setSystemStats(statsData);
            }
          } catch (e) {
            console.error('Error fetching system stats:', e);
          }

          // Fetch users
          try {
            const usersResponse = await fetch(`${API}/admin/users`, { headers });
            const usersData = await usersResponse.json();
            if (Array.isArray(usersData)) {
              setUsers(usersData);
            }
          } catch (e) {
            console.error('Error fetching users:', e);
          }

          // Fetch alerts
          try {
            const alertsResponse = await fetch(`${API}/admin/alerts`, { headers });
            const alertsData = await alertsResponse.json();
            if (Array.isArray(alertsData)) {
              setAlerts(alertsData);
            }
          } catch (e) {
            console.error('Error fetching alerts:', e);
          }

          // Fetch timetables
          try {
            const timetablesResponse = await fetch(`${API}/admin/timetables`, { headers });
            const timetablesData = await timetablesResponse.json();
            if (Array.isArray(timetablesData)) {
              setTimetables(timetablesData);
            }
          } catch (e) {
            console.error('Error fetching timetables:', e);
          }

        } catch (error) {
          console.error('Error fetching admin data:', error);
        }
      };

      fetchAdminData();
      // also load canteen admin data (staff, menu asset, orders)
      loadCanteen();
    }
  }, [user, loadCanteen]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <div className="text-gray-400 text-sm">{user.email} {user.department && `• ${user.department}`}</div>
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

  // Commented out as it's replaced by AdminUserManagement component
  // const renderUsers = () => (
  //   ... original renderUsers code ...
  // );

  const renderTimetables = () => {
    const totalEntries = timetables.length;
    const uniqueFaculty = [...new Set(timetables.map(t => t.faculty))].length;
    const uniqueRooms = [...new Set(timetables.map(t => t.room))].length;

    return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Institution Timetable Management</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setEditingTimetable(!editingTimetable)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              editingTimetable 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>{editingTimetable ? 'Save Changes' : 'Administrative Edit'}</span>
          </button>
          <button className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {/* Administrative Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-xl font-bold text-white">{totalEntries}</div>
              <div className="text-sm text-gray-400">Total Schedule Entries</div>
            </div>
          </div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-400" />
            <div>
              <div className="text-xl font-bold text-white">{uniqueFaculty}</div>
              <div className="text-sm text-gray-400">Faculty Assigned</div>
            </div>
          </div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <MapPin className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="text-xl font-bold text-white">{uniqueRooms}</div>
              <div className="text-sm text-gray-400">Rooms Utilized</div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Timetable Overview */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-blue-400" />
          Institution Timetable Management
        </h3>
        
        {editingTimetable && (
          <div className="mb-4 p-4 bg-orange-600/20 border border-orange-500/30 rounded-lg">
            <p className="text-orange-300 text-sm">
              <strong>⚠️ Administrative Editing Mode:</strong> You are modifying institutional schedules. Changes will directly impact academic operations.
            </p>
          </div>
        )}
        
        {!editingTimetable && totalEntries > 0 && (
          <div className="mb-4 p-4 bg-green-600/20 border border-green-500/30 rounded-lg">
            <p className="text-green-300 text-sm">
              <strong>Viewing Mode:</strong> Currently displaying {totalEntries} schedule entries. Use Administrative Edit to make changes.
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
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
              {timetables.map((entry) => (
                <tr key={entry.id} className="border-t border-white/10 hover:bg-white/5">
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

      {/* Administrative Controls */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Administrative Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
            <UploadIcon className="w-4 h-4" />
            <span>Import Schedules</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Export All Data</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics Report</span>
          </button>

        </div>
        
        <div className="mt-4 p-3 bg-gray-600/20 border border-gray-500/30 rounded-lg">
          <p className="text-gray-300 text-sm">
            <strong>Note:</strong> These operations affect the institution. Use with caution and ensure proper authorization.
          </p>
        </div>
      </div>
    </div>
  );
  };

  const [roles, setRoles] = useState<{id:number, code:string, name:string, description:string}[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const loadRoles = useCallback(async () => {
    try {
      setLoadingRoles(true);
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const resp = await fetch(`${API}/admin/roles`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }});
      const data = await resp.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (e) { /* noop */ } finally { setLoadingRoles(false); }
  }, []);

  React.useEffect(()=>{ loadRoles(); }, [loadRoles]);

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

      {/* Real admin activity will be implemented when needed */}
    </div>
  );

  const updateTimetableEntry = (id: string, field: string, value: string) => {
    const updatedTimetables = timetables.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    );
    setTimetables(updatedTimetables);
  };

  const renderCanteen = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Canteen Management</h2>
        <a 
          href="/dashboard/admin/canteen"
          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Advanced Menu Manager
        </a>
      </div>

      {/* Upload Menu Asset */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center"><UploadIcon className="w-5 h-5 mr-2 text-purple-400"/>Upload Menu (Image/PDF)</h3>
        <div className="flex items-center gap-3">
          <input 
            id="menu-file" 
            type="file" 
            accept="image/*,application/pdf" 
            className="hidden" 
            onChange={async (e)=>{
              const f = e.target.files?.[0]; if (!f) return;
              setUploadingMenu(true);
              try { await canteenAPI.uploadMenuAsset(f); await loadCanteen(); } finally { setUploadingMenu(false); e.currentTarget.value=''; }
            }} 
          />
          <label htmlFor="menu-file" className="cursor-pointer">
            <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors inline-block">
              Choose File
            </span>
          </label>
          <button 
            disabled={uploadingMenu} 
            onClick={() => document.getElementById('menu-file')?.click()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50 transition-colors"
          >
            {uploadingMenu? 'Uploading...' : 'Upload Menu'}
          </button>
        </div>
        {latestAsset && (
          <div className="mt-4">
            <div className="text-gray-300 text-sm mb-2">Latest asset: {latestAsset.file_name} • {new Date(latestAsset.created_at).toLocaleString()}</div>
            {latestAsset.mime_type?.startsWith('image/') ? (
              <img src={canteenAPI.streamMenuAssetUrl(latestAsset.id)} alt="Canteen Menu" className="max-h-80 rounded border border-white/10" />
            ) : (
              <a href={canteenAPI.streamMenuAssetUrl(latestAsset.id)} target="_blank" className="inline-flex items-center text-blue-400 hover:text-blue-300"><ImageIcon className="w-4 h-4 mr-1"/>Open latest menu asset</a>
            )}
          </div>
        )}
      </div>

      {/* Staff Management */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Canteen Staff</h3>
        <div className="flex items-center gap-2 mb-4">
          <input value={promoteUserId} onChange={(e)=>setPromoteUserId(e.target.value)} placeholder="User ID to promote" className="px-3 py-2 bg-black/40 text-white border border-white/20 rounded text-sm" />
          <button onClick={async ()=>{ if(!promoteUserId) return; await canteenAPI.promoteStaff(Number(promoteUserId)); setPromoteUserId(''); await loadCanteen(); }} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">Promote to Staff</button>
        </div>
        {staff.length === 0 ? (
          <div className="text-gray-400">No canteen staff yet. Promote users by ID or create accounts via registration with department 'canteen'.</div>
        ) : (
          <div className="space-y-2">
            {staff.map((s:any)=> (
              <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                <div className="text-white">{s.full_name} <span className="text-gray-400">• {s.email}</span></div>
                <span className="text-xs text-gray-400">{s.department}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders overview */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Orders</h3>
        {orders.length === 0 ? (
          <div className="text-gray-400">No orders.</div>
        ) : (
          <div className="space-y-2">
            {orders.slice(0,20).map((o:any)=> (
              <div key={o.id} className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                <div>
                  <div className="text-white">Order #{o.id} • ₹{o.total_amount}</div>
                  <div className="text-gray-400 text-sm">{o.items_summary || ''}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-600/20 text-blue-300">{o.status || 'queued'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

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
                { id: 'event-approvals', label: 'Event Approvals', icon: CheckCircle },
                { id: 'timetables', label: 'Timetables', icon: Clock },
                { id: 'canteen', label: 'Canteen', icon: Database },
                { id: 'admin-roles', label: 'Admin Roles', icon: Shield },
                { id: 'club-calendar', label: 'Club Calendar', icon: Calendar },
                { id: 'debug', label: 'Debug', icon: AlertTriangle },
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
        {activeTab === 'users' && <AdminUserManagement />}
        {activeTab === 'event-approvals' && <EventApprovalList key={approvalRefreshKey} isAdmin={true} onRefresh={handleApprovalRefresh} />}
        {activeTab === 'timetables' && renderTimetables()}
        {activeTab === 'canteen' && renderCanteen()}
        {activeTab === 'admin-roles' && renderAdmins()}
        {activeTab === 'club-calendar' && <ClubCalendar showAllClubs={true} />}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Debug Tools</h2>
              <p className="text-gray-400 mb-6">Tools to help debug and test system functionality</p>
            </div>
            <TimeParsingTest />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
