'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  UserCheck,
  MessageCircle,
  Clock,
  MapPin,
  Plus,
  Edit,
  Eye,
  Send,
  Filter,
  Search
} from 'lucide-react';

// Organization-specific interfaces
interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  registrations: number;
  capacity: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  type: 'recruitment' | 'workshop' | 'seminar' | 'networking';
}

interface Candidate {
  id: number;
  name: string;
  university: string;
  course: string;
  year: string;
  skills: string[];
  cgpa: number;
  status: 'applied' | 'shortlisted' | 'interviewed' | 'selected' | 'rejected';
  appliedPosition: string;
}

interface Team {
  id: number;
  name: string;
  department: string;
  members: number;
  lead: string;
  projects: number;
  performance: number;
}

interface Meeting {
  id: number;
  title: string;
  date: string;
  time: string;
  attendees: number;
  type: 'team' | 'client' | 'board' | 'all-hands';
  status: 'scheduled' | 'completed' | 'cancelled';
}

const OrganizationDashboard = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState<Event[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    if (user) {
      const fetchOrganizationData = async () => {
        try {
          // Mock data - replace with actual API calls
          setEvents([
            {
              id: 1,
              title: 'Campus Recruitment Drive 2025',
              description: 'Annual recruitment for software engineering positions',
              date: '2025-09-25',
              time: '10:00 AM',
              venue: 'Main Auditorium',
              registrations: 156,
              capacity: 200,
              status: 'upcoming',
              type: 'recruitment'
            },
            {
              id: 2,
              title: 'Tech Workshop: Web Development',
              description: 'Hands-on workshop on modern web technologies',
              date: '2025-09-18',
              time: '2:00 PM',
              venue: 'Tech Lab 101',
              registrations: 45,
              capacity: 50,
              status: 'upcoming',
              type: 'workshop'
            }
          ]);

          setCandidates([
            {
              id: 1,
              name: 'John Smith',
              university: 'Tech University',
              course: 'Computer Science',
              year: '4th Year',
              skills: ['React', 'Node.js', 'Python'],
              cgpa: 8.5,
              status: 'shortlisted',
              appliedPosition: 'Software Engineer'
            },
            {
              id: 2,
              name: 'Sarah Johnson',
              university: 'Engineering College',
              course: 'Information Technology',
              year: '4th Year',
              skills: ['Java', 'Spring Boot', 'Angular'],
              cgpa: 9.2,
              status: 'interviewed',
              appliedPosition: 'Full Stack Developer'
            }
          ]);

          setTeams([
            {
              id: 1,
              name: 'Frontend Development',
              department: 'Engineering',
              members: 8,
              lead: 'Alex Chen',
              projects: 3,
              performance: 92
            },
            {
              id: 2,
              name: 'Backend Development',
              department: 'Engineering',
              members: 6,
              lead: 'Maria Rodriguez',
              projects: 5,
              performance: 88
            }
          ]);

          setMeetings([
            {
              id: 1,
              title: 'Weekly Team Standup',
              date: '2025-09-13',
              time: '10:00 AM',
              attendees: 12,
              type: 'team',
              status: 'scheduled'
            },
            {
              id: 2,
              title: 'Client Review Meeting',
              date: '2025-09-14',
              time: '3:00 PM',
              attendees: 6,
              type: 'client',
              status: 'scheduled'
            }
          ]);
        } catch (error) {
          console.error('Error fetching organization data:', error);
        }
      };

      fetchOrganizationData();
    }
  }, [user]);

  const handleCreateEvent = () => {
    router.push('/dashboard/organization/events');
  };

  const handleUpdateCandidateStatus = (candidateId: number, newStatus: string) => {
    setCandidates(candidates.map(candidate =>
      candidate.id === candidateId 
        ? { ...candidate, status: newStatus as Candidate['status'] }
        : candidate
    ));
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome, {user?.full_name}</h2>
            <p className="text-gray-300">Manage your organization&apos;s activities and growth</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">{events.length}</div>
            <div className="text-sm text-gray-400">Active Events</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-xl font-bold text-white">{events.length}</div>
              <div className="text-sm text-gray-400">Events</div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <UserCheck className="w-8 h-8 text-green-400" />
            <div>
              <div className="text-xl font-bold text-white">{candidates.length}</div>
              <div className="text-sm text-gray-400">Candidates</div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-purple-400" />
            <div>
              <div className="text-xl font-bold text-white">{teams.length}</div>
              <div className="text-sm text-gray-400">Teams</div>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="text-xl font-bold text-white">{meetings.length}</div>
              <div className="text-sm text-gray-400">Meetings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-400" />
            Upcoming Events
          </h3>
          <button 
            onClick={handleCreateEvent}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        </div>
        
        <div className="space-y-3">
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="text-white font-medium">{event.title}</div>
                <div className="text-gray-400 text-sm">{event.date} at {event.time}</div>
                <div className="text-gray-400 text-sm flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {event.venue}
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-medium">
                  {event.registrations}/{event.capacity} registered
                </div>
                <div className="text-gray-400 text-sm">
                  {Math.round((event.registrations / event.capacity) * 100)}% capacity
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Candidates */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <UserCheck className="w-6 h-6 mr-2 text-green-400" />
          Recent Applications
        </h3>
        <div className="space-y-3">
          {candidates.slice(0, 3).map((candidate) => (
            <div key={candidate.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="text-white font-medium">{candidate.name}</div>
                <div className="text-gray-400 text-sm">{candidate.course} • {candidate.university}</div>
                <div className="text-gray-400 text-sm">Applied for: {candidate.appliedPosition}</div>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  candidate.status === 'selected' ? 'bg-green-600/20 text-green-400' :
                  candidate.status === 'interviewed' ? 'bg-blue-600/20 text-blue-400' :
                  candidate.status === 'shortlisted' ? 'bg-yellow-600/20 text-yellow-400' :
                  candidate.status === 'rejected' ? 'bg-red-600/20 text-red-400' :
                  'bg-gray-600/20 text-gray-400'
                }`}>
                  {candidate.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Event Management</h2>
        <button 
          onClick={handleCreateEvent}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Create Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                event.status === 'upcoming' ? 'bg-blue-600/20 text-blue-400' :
                event.status === 'ongoing' ? 'bg-green-600/20 text-green-400' :
                'bg-gray-600/20 text-gray-400'
              }`}>
                {event.status}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                event.type === 'recruitment' ? 'bg-purple-600/20 text-purple-400' :
                event.type === 'workshop' ? 'bg-blue-600/20 text-blue-400' :
                event.type === 'seminar' ? 'bg-green-600/20 text-green-400' :
                'bg-yellow-600/20 text-yellow-400'
              }`}>
                {event.type}
              </span>
            </div>

            <h3 className="text-white font-semibold text-lg mb-2">{event.title}</h3>
            <p className="text-gray-400 text-sm mb-4">{event.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-400">
                <Clock className="w-4 h-4 mr-2" />
                {event.date} at {event.time}
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <MapPin className="w-4 h-4 mr-2" />
                {event.venue}
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <Users className="w-4 h-4 mr-2" />
                {event.registrations}/{event.capacity} registered
              </div>
            </div>

            <div className="flex space-x-2">
              <button className="flex items-center space-x-1 flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors text-sm">
                <Eye className="w-4 h-4" />
                <span>View</span>
              </button>
              <button className="flex items-center space-x-1 flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg transition-colors text-sm">
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecruitment = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Recruitment Management</h2>
        <div className="flex space-x-2">
          <button className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
          <button className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-4">Candidate Pipeline</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-gray-300">Candidate</th>
                <th className="text-left p-4 text-gray-300">University</th>
                <th className="text-left p-4 text-gray-300">Position</th>
                <th className="text-left p-4 text-gray-300">CGPA</th>
                <th className="text-left p-4 text-gray-300">Skills</th>
                <th className="text-left p-4 text-gray-300">Status</th>
                <th className="text-left p-4 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-4">
                    <div>
                      <div className="text-white font-medium">{candidate.name}</div>
                      <div className="text-gray-400 text-sm">{candidate.course} • {candidate.year}</div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">{candidate.university}</td>
                  <td className="p-4 text-white">{candidate.appliedPosition}</td>
                  <td className="p-4">
                    <span className={`font-medium ${
                      candidate.cgpa >= 8.5 ? 'text-green-400' :
                      candidate.cgpa >= 7.0 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {candidate.cgpa}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 2).map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {candidate.skills.length > 2 && (
                        <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded text-xs">
                          +{candidate.skills.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      candidate.status === 'selected' ? 'bg-green-600/20 text-green-400' :
                      candidate.status === 'interviewed' ? 'bg-blue-600/20 text-blue-400' :
                      candidate.status === 'shortlisted' ? 'bg-yellow-600/20 text-yellow-400' :
                      candidate.status === 'rejected' ? 'bg-red-600/20 text-red-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {candidate.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleUpdateCandidateStatus(candidate.id, 'shortlisted')}
                        className="text-yellow-400 hover:text-yellow-300 transition-colors"
                        title="Shortlist"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleUpdateCandidateStatus(candidate.id, 'selected')}
                        className="text-green-400 hover:text-green-300 transition-colors"
                        title="Select"
                      >
                        <Send className="w-4 h-4" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/organization" />
      
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Organization Dashboard</h1>
              <p className="text-gray-400">{user?.organization_type || 'Corporate'} Organization</p>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-4">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'events', label: 'Events', icon: Calendar },
                { id: 'recruitment', label: 'Recruitment', icon: UserCheck }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-600 text-white'
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
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'recruitment' && renderRecruitment()}
      </div>
    </div>
  );
};

export default OrganizationDashboard;
