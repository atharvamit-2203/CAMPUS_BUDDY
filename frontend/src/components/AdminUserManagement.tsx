'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  UserPlus, 
  Upload, 
  Download, 
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  FileText,
  BarChart3,
  Clock,
  RefreshCw
} from 'lucide-react';

// Enhanced Admin Dashboard Component
const AdminUserManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [importLogs, setImportLogs] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [usersByRole, setUsersByRole] = useState({});

  // Form states
  const [studentForm, setStudentForm] = useState({
    full_name: '',
    email: '',
    course: '',
    semester: '',
    department: '',
    phone: '',
    sap_id: '',
    batch: '',
    bio: ''
  });

  const [teacherForm, setTeacherForm] = useState({
    full_name: '',
    email: '',
    department: '',
    phone: '',
    designation: '',
    qualification: '',
    bio: ''
  });

  // File upload states
  const [studentFile, setStudentFile] = useState(null);
  const [teacherFile, setTeacherFile] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStatistics();
      fetchImportLogs();
    }
  }, [user]);

  // Load users when search tab is opened
  useEffect(() => {
    if (activeTab === 'search' && user?.role === 'admin') {
      loadAllUsers();
    }
  }, [activeTab, user]);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/admin/user-statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchImportLogs = async () => {
    try {
      const response = await fetch('/api/admin/import-logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setImportLogs(data);
    } catch (error) {
      console.error('Error fetching import logs:', error);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/students/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(studentForm)
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Student added successfully! ${data.generated_password ? `Generated password: ${data.generated_password}` : ''}`);
        setStudentForm({
          full_name: '',
          email: '',
          course: '',
          semester: '',
          department: '',
          phone: '',
          sap_id: '',
          batch: '',
          bio: ''
        });
        fetchStatistics();
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (error) {
      alert('Error adding student');
      console.error('Error:', error);
    }
    
    setLoading(false);
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/teachers/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(teacherForm)
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Teacher added successfully! ${data.generated_password ? `Generated password: ${data.generated_password}` : ''}`);
        setTeacherForm({
          full_name: '',
          email: '',
          department: '',
          phone: '',
          designation: '',
          qualification: '',
          bio: ''
        });
        fetchStatistics();
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (error) {
      alert('Error adding teacher');
      console.error('Error:', error);
    }
    
    setLoading(false);
  };

  const handleStudentCSVUpload = async () => {
    if (!studentFile) {
      alert('Please select a CSV file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', studentFile);

    try {
      const response = await fetch('/api/admin/students/upload-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`CSV import completed! Total: ${data.total_records}, Successful: ${data.successful_records}, Failed: ${data.failed_records}`);
        setStudentFile(null);
        fetchStatistics();
        fetchImportLogs();
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (error) {
      alert('Error uploading CSV');
      console.error('Error:', error);
    }
    
    setLoading(false);
  };

  const handleTeacherCSVUpload = async () => {
    if (!teacherFile) {
      alert('Please select a CSV file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', teacherFile);

    try {
      const response = await fetch('/api/admin/teachers/upload-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`CSV import completed! Total: ${data.total_records}, Successful: ${data.successful_records}, Failed: ${data.failed_records}`);
        setTeacherFile(null);
        fetchStatistics();
        fetchImportLogs();
      } else {
        alert(`Error: ${data.detail}`);
      }
    } catch (error) {
      alert('Error uploading CSV');
      console.error('Error:', error);
    }
    
    setLoading(false);
  };

  // Load all users and group by role
  const loadAllUsers = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      setAllUsers(data);
      
      // Group users by role
      const grouped = data.reduce((acc, user) => {
        if (!acc[user.role]) {
          acc[user.role] = [];
        }
        acc[user.role].push(user);
        return acc;
      }, {});
      
      setUsersByRole(grouped);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery && !selectedRole) {
      // If no search criteria, load all users grouped by role
      loadAllUsers();
      return;
    }

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (selectedRole) params.append('role', selectedRole);
      
      const response = await fetch(`${API}/admin/users/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      setSearchResults(data);
      setUsersByRole({}); // Clear grouped results when showing search results
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const downloadTemplate = (type) => {
    const templates = {
      students: `full_name,email,course,semester,department,phone,sap_id,batch,bio
John Doe,john.doe@example.com,Computer Science,3,Computer Science,+1234567890,SAP001,2022-2026,Interested in AI and Machine Learning
Jane Smith,jane.smith@example.com,Information Technology,2,Information Technology,+1234567891,SAP002,2023-2027,Web development enthusiast`,
      teachers: `full_name,email,department,phone,designation,qualification,bio
Dr. Robert Smith,robert.smith@example.com,Computer Science,+1234567800,Professor,PhD in Computer Science,Specialist in Artificial Intelligence
Prof. Emily Davis,emily.davis@example.com,Information Technology,+1234567801,Associate Professor,MS in Information Technology,Database Management Expert`
    };

    const csvContent = templates[type];
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin User Management</h1>
          <p className="text-gray-400">Manage students and teachers - Add individually or bulk upload via CSV</p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {statistics.role_statistics.map((stat, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-blue-400" />
                  <span className="text-xs text-gray-400 uppercase">{stat.role}s</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.count}</div>
                <div className="text-sm text-gray-400">
                  {stat.active_count} active • {stat.recent_count} recent
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'add-student', label: 'Add Student', icon: UserPlus },
            { id: 'add-teacher', label: 'Add Teacher', icon: UserPlus },
            { id: 'bulk-upload', label: 'Bulk Upload', icon: Upload },
            { id: 'search', label: 'Search Users', icon: Search },
            { id: 'logs', label: 'Import Logs', icon: Activity }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-800/40 text-gray-400 hover:bg-gray-700/40 border border-gray-600/30'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-8">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('add-student')}
                      className="w-full flex items-center justify-center px-4 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                    >
                      Add New Student
                    </button>
                    <button
                      onClick={() => setActiveTab('add-teacher')}
                      className="w-full flex items-center justify-center px-4 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/30"
                    >
                      Add New Teacher
                    </button>
                    <button
                      onClick={() => setActiveTab('bulk-upload')}
                      className="w-full flex items-center justify-center px-4 py-3 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30"
                    >
                      Bulk Upload CSV
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-700/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {importLogs.slice(0, 5).map((log, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-white">{log.import_type} import</div>
                          <div className="text-xs text-gray-400">
                            {log.successful_records}/{log.total_records} successful
                          </div>
                        </div>
                        <div className="flex items-center">
                          {log.import_status === 'completed' ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : log.import_status === 'failed' ? (
                            <XCircle className="w-4 h-4 text-red-400" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'add-student' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Add New Student</h2>
              <form onSubmit={handleStudentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={studentForm.full_name}
                    onChange={(e) => setStudentForm({...studentForm, full_name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({...studentForm, email: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Course *</label>
                  <input
                    type="text"
                    value={studentForm.course}
                    onChange={(e) => setStudentForm({...studentForm, course: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Semester *</label>
                  <input
                    type="number"
                    value={studentForm.semester}
                    onChange={(e) => setStudentForm({...studentForm, semester: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    min="1"
                    max="8"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department *</label>
                  <input
                    type="text"
                    value={studentForm.department}
                    onChange={(e) => setStudentForm({...studentForm, department: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({...studentForm, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">SAP ID</label>
                  <input
                    type="text"
                    value={studentForm.sap_id}
                    onChange={(e) => setStudentForm({...studentForm, sap_id: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Batch</label>
                  <input
                    type="text"
                    value={studentForm.batch}
                    onChange={(e) => setStudentForm({...studentForm, batch: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 2021-2025"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                  <textarea
                    value={studentForm.bio}
                    onChange={(e) => setStudentForm({...studentForm, bio: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    rows="3"
                    placeholder="Brief description about the student..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Adding Student...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Student
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'add-teacher' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Add New Teacher</h2>
              <form onSubmit={handleTeacherSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={teacherForm.full_name}
                    onChange={(e) => setTeacherForm({...teacherForm, full_name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                  <input
                    type="email"
                    value={teacherForm.email}
                    onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department *</label>
                  <input
                    type="text"
                    value={teacherForm.department}
                    onChange={(e) => setTeacherForm({...teacherForm, department: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={teacherForm.phone}
                    onChange={(e) => setTeacherForm({...teacherForm, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Designation *</label>
                  <input
                    type="text"
                    value={teacherForm.designation}
                    onChange={(e) => setTeacherForm({...teacherForm, designation: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Professor, Associate Professor"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Qualification</label>
                  <input
                    type="text"
                    value={teacherForm.qualification}
                    onChange={(e) => setTeacherForm({...teacherForm, qualification: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., PhD in Computer Science"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                  <textarea
                    value={teacherForm.bio}
                    onChange={(e) => setTeacherForm({...teacherForm, bio: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    rows="3"
                    placeholder="Brief description about the teacher..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Adding Teacher...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Teacher
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'bulk-upload' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Bulk Upload CSV</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Students Upload */}
                <div className="bg-gray-700/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Upload Students</h3>
                  
                  <div className="mb-4">
                    <button
                      onClick={() => downloadTemplate('students')}
                      className="flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setStudentFile(e.target.files[0])}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-400"
                    />
                  </div>
                  
                  <button
                    onClick={handleStudentCSVUpload}
                    disabled={!studentFile || loading}
                    className="w-full flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Students CSV
                      </>
                    )}
                  </button>
                </div>

                {/* Teachers Upload */}
                <div className="bg-gray-700/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Upload Teachers</h3>
                  
                  <div className="mb-4">
                    <button
                      onClick={() => downloadTemplate('teachers')}
                      className="flex items-center px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors border border-green-500/30"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setTeacherFile(e.target.files[0])}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-500/20 file:text-green-400"
                    />
                  </div>
                  
                  <button
                    onClick={handleTeacherCSVUpload}
                    disabled={!teacherFile || loading}
                    className="w-full flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Teachers CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h4 className="text-yellow-400 font-semibold mb-2">CSV Format Guidelines:</h4>
                <ul className="text-yellow-300 text-sm space-y-1">
                  <li>• Ensure all required fields are included</li>
                  <li>• Use UTF-8 encoding for special characters</li>
                  <li>• Email addresses must be unique</li>
                  <li>• Default passwords will be generated if not provided</li>
                  <li>• Check import logs for any errors</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Search Users</h2>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="faculty">Teachers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSearch}
                    className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {searchQuery || selectedRole ? 'Search' : 'Show All Users'}
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedRole('');
                      setSearchResults([]);
                      loadAllUsers();
                    }}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </button>
                </div>
              </div>
              
              {searchResults.length > 0 && (
                <div className="bg-gray-700/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Search Results ({searchResults.length})</h3>
                  <div className="space-y-4">
                    {searchResults.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg">
                        <div>
                          <div className="text-white font-semibold">{user.full_name}</div>
                          <div className="text-gray-400 text-sm">{user.email}</div>
                          <div className="text-gray-400 text-sm">
                            {user.role} • {user.department} 
                            {user.course && ` • ${user.course}`}
                            {user.semester && ` • Sem ${user.semester}`}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.status === 'active' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {user.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show users grouped by role when no search query */}
              {Object.keys(usersByRole).length > 0 && searchResults.length === 0 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white mb-4">All Users by Role</h3>
                  {Object.entries(usersByRole).map(([role, users]) => (
                    <div key={role} className="bg-gray-700/30 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white capitalize">
                          {role}s ({users.length})
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          role === 'student' ? 'bg-blue-600/20 text-blue-400' :
                          role === 'faculty' ? 'bg-purple-600/20 text-purple-400' :
                          role === 'organization' ? 'bg-green-600/20 text-green-400' :
                          role === 'admin' ? 'bg-red-600/20 text-red-400' :
                          'bg-gray-600/20 text-gray-400'
                        }`}>
                          {role.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {users.map((user, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-600/30 rounded-lg hover:bg-gray-600/40 transition-colors">
                            <div className="flex-1">
                              <div className="text-white font-semibold">{user.full_name}</div>
                              <div className="text-gray-400 text-sm">{user.email}</div>
                              <div className="text-gray-400 text-sm flex items-center space-x-2">
                                {user.department && <span>{user.department}</span>}
                                {user.course && <span>• {user.course}</span>}
                                {user.semester && <span>• Sem {user.semester}</span>}
                              </div>
                              {user.last_login && (
                                <div className="text-gray-500 text-xs mt-1">
                                  Last login: {user.last_login}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                user.status === 'active' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {user.status || 'Active'}
                              </span>
                              <span className="text-gray-500 text-xs">
                                ID: {user.id}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Import Logs</h2>
              
              <div className="space-y-4">
                {importLogs.map((log, index) => (
                  <div key={index} className="bg-gray-700/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {log.import_type.charAt(0).toUpperCase() + log.import_type.slice(1)} Import
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {log.file_name || 'Manual entry'} • {log.imported_by_name}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {log.import_status === 'completed' ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : log.import_status === 'failed' ? (
                          <XCircle className="w-6 h-6 text-red-400" />
                        ) : (
                          <Clock className="w-6 h-6 text-yellow-400" />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{log.total_records}</div>
                        <div className="text-sm text-gray-400">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{log.successful_records}</div>
                        <div className="text-sm text-gray-400">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{log.failed_records}</div>
                        <div className="text-sm text-gray-400">Failed</div>
                      </div>
                    </div>
                    
                    {log.errors && log.errors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-red-400 mb-2">Errors:</h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {log.errors.map((error, errorIndex) => (
                            <div key={errorIndex} className="text-xs text-red-300 bg-red-500/10 p-2 rounded">
                              Row {error.row_number}: {error.error_message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-4">
                      Created: {new Date(log.created_at).toLocaleString()}
                      {log.completed_at && ` • Completed: ${new Date(log.completed_at).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;