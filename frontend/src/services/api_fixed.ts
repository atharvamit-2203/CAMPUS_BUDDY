import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://campus-buddy-1.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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
    email: string;
    username: string;
    full_name: string;
    role: string;
    college_id: string;
    course?: string;
    year?: number;
    is_committee_head?: boolean;
    committee_club_name?: string;
  };
}

// AI Services
export const aiService = {
  // Get club recommendations based on user profile
  getClubRecommendations: async (profileData: any) => {
    return api.post('/ai/recommend-clubs', profileData);
  },

  // Chat with AI bot about clubs
  chatWithBot: async (message: string, userContext?: any) => {
    return api.post('/ai/chat', {
      message,
      user_context: userContext
    });
  },

  // Get club suggestions by interests
  getClubSuggestions: async (interests: string[]) => {
    return api.get('/ai/club-suggestions', {
      params: { interests: interests.join(',') }
    });
  },

  // Get all clubs data
  getAllClubsData: async () => {
    return api.get('/ai/clubs-data');
  },

  // Update user preferences
  updateUserPreferences: async (preferences: any) => {
    return api.post('/ai/update-user-preferences', preferences);
  }
};

// Auth services
export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Faculty services
export const facultyService = {
  getCourses: async () => {
    return api.get('/faculty/courses');
  },

  getStudents: async () => {
    return api.get('/faculty/students');
  },

  getAssignments: async () => {
    return api.get('/faculty/assignments');
  },

  getResearch: async () => {
    return api.get('/faculty/research');
  },

  getEvents: async () => {
    return api.get('/faculty/events');
  }
};

export default api;
