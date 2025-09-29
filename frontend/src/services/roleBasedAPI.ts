// Enhanced Campus Connect API Service with Role-Based Endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://campus-buddy-1.onrender.com';

// Utility function to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage (only in browser)
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Handle 401 unauthorized
    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Auth interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  college_id: string;
  full_name: string;
  username: string;
  email: string;
  password: string;
  course: string;
  year: number;
  role: 'student' | 'faculty' | 'organization';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    college_id: string;
  };
}

// Student-specific interfaces
export interface StudentProfile {
  id: string;
  fullName: string;
  course: string;
  semester: string;
  cgpa: number;
  skills: string[];
  interests: string[];
  avatarUrl?: string;
}

export interface RecommendedClub {
  id: string;
  name: string;
  memberCount: number;
  description: string;
  category: string;
  matchPercentage: number;
}

export interface NetworkingProfile {
  id: string;
  fullName: string;
  course: string;
  semester: string;
  commonInterests: string[];
  mutualConnections: number;
  avatarUrl?: string;
}

// Faculty-specific interfaces
export interface Course {
  id: number;
  name: string;
  code: string;
  semester: string;
  students_enrolled: number;
  schedule: string;
  credits: number;
  status: 'active' | 'completed' | 'upcoming';
}

export interface StudentAnalytics {
  id: number;
  full_name: string;
  student_id: string;
  course: string;
  semester: string;
  cgpa: number;
  attendance_percentage: number;
  recent_submissions: number;
}

// Organization-specific interfaces
export interface OrganizationEvent {
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

export interface Candidate {
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

// Admin-specific interfaces
export interface SystemStats {
  totalUsers: number;
  totalColleges: number;
  activeEvents: number;
  systemUptime: string;
  storageUsed: number;
  storageLimit: number;
}

export interface UserSummary {
  id: number;
  full_name: string;
  email: string;
  role: 'student' | 'faculty' | 'organization';
  college_name: string;
  status: 'active' | 'inactive' | 'suspended';
  last_login: string;
  created_at: string;
}

// Add interface for timetable
export interface TimetableSlot {
  time: string;
  subject: string;
  room: string;
  batch?: string;
  faculty?: string;
}

export interface Assignment {
  id?: string;
  title: string;
  course: string;
  dueDate: string;
  description: string;
  totalMarks: number;
}

export interface Meeting {
  id?: number;
  title: string;
  date: string;
  time: string;
  type: 'team' | 'client' | 'board' | 'all-hands';
  attendees: string[];
  description?: string;
}
export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'workshop' | 'seminar' | 'competition' | 'social' | 'club';
  isRegistered?: boolean;
  spotsLeft: number;
}

export interface College {
  id: string;
  name: string;
  city: string;
  state: string;
  students_count?: number;
  faculty_count?: number;
  status?: 'active' | 'inactive';
  created_at?: string;
}

// Auth API calls
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    return await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getCurrentUser: async () => {
    return await apiCall('/auth/me');
  },

  refreshToken: async () => {
    return await apiCall('/auth/refresh', {
      method: 'POST',
    });
  },
};

// Student-specific API calls
export const studentAPI = {
  getProfile: async (): Promise<StudentProfile> => {
    return await apiCall('/student/profile');
  },

  updateProfile: async (profile: Partial<StudentProfile>) => {
    return await apiCall('/student/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  },

  getRecommendedClubs: async (): Promise<RecommendedClub[]> => {
    return await apiCall('/student/clubs/recommended');
  },

  joinClub: async (clubId: string) => {
    return await apiCall(`/student/clubs/${clubId}/join`, {
      method: 'POST',
    });
  },

  getNetworkingSuggestions: async (): Promise<NetworkingProfile[]> => {
    return await apiCall('/student/networking/suggestions');
  },

  sendConnectionRequest: async (userId: string) => {
    return await apiCall('/student/networking/connect', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },

  getUpcomingEvents: async (): Promise<Event[]> => {
    return await apiCall('/student/events/upcoming');
  },

  registerForEvent: async (eventId: string) => {
    return await apiCall(`/student/events/${eventId}/register`, {
      method: 'POST',
    });
  },

  getTimetable: async () => {
    return await apiCall('/student/timetable');
  },
};

// Faculty-specific API calls
export const facultyAPI = {
  getCourses: async (): Promise<Course[]> => {
    return await apiCall('/faculty/courses');
  },

  createCourse: async (course: Partial<Course>) => {
    return await apiCall('/faculty/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    });
  },

  updateCourse: async (courseId: number, course: Partial<Course>) => {
    return await apiCall(`/faculty/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(course),
    });
  },

  getStudentAnalytics: async (): Promise<StudentAnalytics[]> => {
    return await apiCall('/faculty/students/analytics');
  },

  getTimetable: async () => {
    return await apiCall('/faculty/timetable');
  },

  updateTimetable: async (timetable: TimetableSlot[]) => {
    return await apiCall('/faculty/timetable', {
      method: 'PUT',
      body: JSON.stringify({ timetable }),
    });
  },

  getAssignments: async () => {
    return await apiCall('/faculty/assignments');
  },

  createAssignment: async (assignment: Assignment) => {
    return await apiCall('/faculty/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  },

  getResearchProjects: async () => {
    return await apiCall('/faculty/research');
  },
};

// Organization-specific API calls
export const organizationAPI = {
  getEvents: async (): Promise<OrganizationEvent[]> => {
    return await apiCall('/organization/events');
  },

  createEvent: async (event: Partial<OrganizationEvent>) => {
    return await apiCall('/organization/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  updateEvent: async (eventId: number, event: Partial<OrganizationEvent>) => {
    return await apiCall(`/organization/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  },

  getCandidates: async (): Promise<Candidate[]> => {
    return await apiCall('/organization/candidates');
  },

  updateCandidateStatus: async (candidateId: number, status: string) => {
    return await apiCall(`/organization/candidates/${candidateId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  getTeams: async () => {
    return await apiCall('/organization/teams');
  },

  getMeetings: async () => {
    return await apiCall('/organization/meetings');
  },

  scheduleMeeting: async (meeting: Meeting) => {
    return await apiCall('/organization/meetings', {
      method: 'POST',
      body: JSON.stringify(meeting),
    });
  },
};

// Admin-specific API calls
export const adminAPI = {
  getSystemStats: async (): Promise<SystemStats> => {
    return await apiCall('/admin/stats');
  },

  getUsers: async (): Promise<UserSummary[]> => {
    return await apiCall('/admin/users');
  },

  updateUserStatus: async (userId: number, status: string) => {
    return await apiCall(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  deleteUser: async (userId: number) => {
    return await apiCall(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  getColleges: async (): Promise<College[]> => {
    return await apiCall('/admin/colleges');
  },

  createCollege: async (college: Partial<College>) => {
    return await apiCall('/admin/colleges', {
      method: 'POST',
      body: JSON.stringify(college),
    });
  },

  updateCollege: async (collegeId: string, college: Partial<College>) => {
    return await apiCall(`/admin/colleges/${collegeId}`, {
      method: 'PUT',
      body: JSON.stringify(college),
    });
  },

  getSystemAlerts: async () => {
    return await apiCall('/admin/alerts');
  },

  resolveAlert: async (alertId: number) => {
    return await apiCall(`/admin/alerts/${alertId}/resolve`, {
      method: 'PUT',
    });
  },
};

// Common API calls (available to all roles)
export const commonAPI = {
  getColleges: async (): Promise<College[]> => {
    return await apiCall('/colleges');
  },

  getEvents: async (): Promise<Event[]> => {
    return await apiCall('/events');
  },

  searchUsers: async (query: string) => {
    return await apiCall(`/search/users?q=${encodeURIComponent(query)}`);
  },

  uploadFile: async (file: File, type: 'avatar' | 'document') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return await apiCall('/upload', {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData, let browser set it
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: formData,
    });
  },
};

// Role-based API access helper
export const getAPIForRole = (role: string) => {
  switch (role) {
    case 'student':
      return { ...commonAPI, student: studentAPI };
    case 'faculty':
      return { ...commonAPI, faculty: facultyAPI };
    case 'organization':
      return { ...commonAPI, organization: organizationAPI };
    case 'admin':
      return { ...commonAPI, admin: adminAPI };
    default:
      return commonAPI;
  }
};

// Export individual APIs for convenience
const apiExports = {
  auth: authAPI,
  student: studentAPI,
  faculty: facultyAPI,
  organization: organizationAPI,
  admin: adminAPI,
  common: commonAPI,
  getAPIForRole,
};

export default apiExports;
