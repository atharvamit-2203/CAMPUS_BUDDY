'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Eye,
  UserCheck,
  Building
} from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  description: string;
  category: string;
  head: {
    full_name: string;
    email: string;
  };
  member_count: number;
  college_name?: string;
  meeting_schedule?: string;
  contact_email?: string;
  contact_phone?: string;
}

const FacultyCommitteesPage = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API}/organizations/detailed`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      
      // Filter organizations from the same college as the faculty
      const userCollege = user?.college_name?.toLowerCase() || '';
      const filteredOrgs = Array.isArray(data) ? data.filter((org: Organization) => {
        // Show organizations from the same college
        const orgCollege = org.college_name?.toLowerCase() || '';
        return userCollege && orgCollege && orgCollege.includes(userCollege) || userCollege.includes(orgCollege);
      }) : [];
      
      setOrganizations(filteredOrgs);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations');
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'academic': 'bg-blue-600/20 text-blue-400 border-blue-500/30',
      'cultural': 'bg-purple-600/20 text-purple-400 border-purple-500/30',
      'technical': 'bg-green-600/20 text-green-400 border-green-500/30',
      'sports': 'bg-red-600/20 text-red-400 border-red-500/30',
      'social': 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
    };
    return colors[category?.toLowerCase()] || 'bg-gray-600/20 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
        <RoleBasedNavigation currentPage="/dashboard/faculty/committees" />
        <div className="flex-1 p-8">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Loading organizations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/faculty/committees" />
      
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">College Organizations</h1>
              <p className="text-gray-400">Student organizations and committees in your college</p>
            </div>
            
            <div className="flex items-center space-x-3 text-gray-400">
              <Building className="w-5 h-5" />
              <span>{user?.college_name || 'Your College'}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {organizations.length === 0 ? (
          <div className="bg-black/40 border border-white/10 rounded-xl p-8 text-center">
            <UserCheck className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Organizations Found</h3>
            <p className="text-gray-400">
              No student organizations are currently registered from your college.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <div key={org.id} className="bg-black/40 border border-white/10 rounded-xl p-6 hover:bg-black/60 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{org.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(org.category)}`}>
                      {org.category || 'General'}
                    </span>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                  {org.description || 'No description available'}
                </p>

                <div className="space-y-3">
                  {/* Head Information */}
                  <div className="flex items-center space-x-3">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-sm font-medium text-white">{org.head?.full_name || 'No head assigned'}</div>
                      <div className="text-xs text-gray-400">{org.head?.email || ''}</div>
                    </div>
                  </div>

                  {/* Member Count */}
                  <div className="flex items-center space-x-3">
                    <Users className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">
                      {org.member_count || 0} members
                    </span>
                  </div>

                  {/* College */}
                  {org.college_name && (
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-300">{org.college_name}</span>
                    </div>
                  )}

                  {/* Contact Information */}
                  {(org.contact_email || org.contact_phone) && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="text-xs font-medium text-gray-400 mb-2">Contact</div>
                      {org.contact_email && (
                        <div className="flex items-center space-x-2 mb-1">
                          <Mail className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-gray-300">{org.contact_email}</span>
                        </div>
                      )}
                      {org.contact_phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3 h-3 text-green-400" />
                          <span className="text-xs text-gray-300">{org.contact_phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Meeting Schedule */}
                {org.meeting_schedule && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-300">Meets: {org.meeting_schedule}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {organizations.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Showing {organizations.length} organization{organizations.length !== 1 ? 's' : ''} from your college
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyCommitteesPage;