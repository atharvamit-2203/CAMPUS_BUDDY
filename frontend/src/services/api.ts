// Campus Connect API Service using native fetch
// Default to Render backend URL if env is not set
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

export interface College {
  id: string;
  name: string;
  city: string;
  state: string;
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

  getColleges: async (): Promise<College[]> => {
    return await apiCall('/colleges');
  },

  // Test backend connection
  testConnection: async () => {
    return await apiCall('/health');
  },
};

export default authAPI;
