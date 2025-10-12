"use client";

import React, { useState, useEffect } from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';

interface AdminStats {
    totalUsers: number;
    activeSessions: number;
    systemHealth: number;
    securityAlerts: number;
    studentsCount: number;
    teachersCount: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        activeSessions: 0,
        systemHealth: 0,
        securityAlerts: 0,
        studentsCount: 0,
        teachersCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminStats = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/admin/stats`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminStats();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
            <RoleBasedNavigation role="admin" />
            
            <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Admin Dashboard</h1>
                    <p className="text-xl text-gray-300">System administration and management portal</p>
                </div>

                {/* Quick Stats */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-6 backdrop-blur-sm animate-pulse">
                                <div className="h-16 bg-gray-700/30 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-blue-500/50 rounded-3xl p-6 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-400 text-sm font-medium">Total Users</p>
                                    <p className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-green-500/50 rounded-3xl p-6 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-400 text-sm font-medium">Active Sessions</p>
                                    <p className="text-3xl font-bold text-white">{stats.activeSessions.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-purple-500/50 rounded-3xl p-6 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-400 text-sm font-medium">System Health</p>
                                    <p className="text-3xl font-bold text-white">{stats.systemHealth}%</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-red-500/50 rounded-3xl p-6 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-red-400 text-sm font-medium">Security Alerts</p>
                                    <p className="text-3xl font-bold text-white">{stats.securityAlerts}</p>
                                </div>
                                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Management Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* User Management */}
                    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                                <div>
                                    <p className="text-white font-medium">Students</p>
                                    <p className="text-gray-400 text-sm">{loading ? 'Loading...' : `${stats.studentsCount.toLocaleString()} active accounts`}</p>
                                </div>
                                <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                                    Manage
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                                <div>
                                    <p className="text-white font-medium">Teachers</p>
                                    <p className="text-gray-400 text-sm">{loading ? 'Loading...' : `${stats.teachersCount.toLocaleString()} active accounts`}</p>
                                </div>
                                <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                                    Manage
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl">
                                <div>
                                    <p className="text-white font-medium">Organizations</p>
                                    <p className="text-gray-400 text-sm">2,481 active accounts</p>
                                </div>
                                <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
                                    Manage
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* System Settings */}
                    <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-8 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold text-white mb-6">System Settings</h2>
                        <div className="space-y-4">
                            <button className="w-full text-left p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Database Management</p>
                                        <p className="text-gray-400 text-sm">Monitor and maintain database health</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                            <button className="w-full text-left p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">Security Settings</p>
                                        <p className="text-gray-400 text-sm">Configure authentication and permissions</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                            <button className="w-full text-left p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">System Logs</p>
                                        <p className="text-gray-400 text-sm">View application and security logs</p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8 bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-600/30 rounded-3xl p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-white mb-6">Recent System Activity</h2>
                    <div className="space-y-4">
                        <div className="flex items-center p-4 bg-gray-700/30 rounded-xl">
                            <div className="w-3 h-3 bg-green-400 rounded-full mr-4"></div>
                            <div className="flex-1">
                                <p className="text-white font-medium">Database backup completed successfully</p>
                                <p className="text-gray-400 text-sm">2 minutes ago</p>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-gray-700/30 rounded-xl">
                            <div className="w-3 h-3 bg-blue-400 rounded-full mr-4"></div>
                            <div className="flex-1">
                                <p className="text-white font-medium">New teacher registration: Prof. Sarah Chen</p>
                                <p className="text-gray-400 text-sm">15 minutes ago</p>
                            </div>
                        </div>
                        <div className="flex items-center p-4 bg-gray-700/30 rounded-xl">
                            <div className="w-3 h-3 bg-purple-400 rounded-full mr-4"></div>
                            <div className="flex-1">
                                <p className="text-white font-medium">System maintenance scheduled for tonight</p>
                                <p className="text-gray-400 text-sm">1 hour ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
