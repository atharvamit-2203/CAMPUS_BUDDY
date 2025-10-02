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
      const errorData = await response.json().catch(() => ({} as any));
      // Normalize FastAPI error formats
      let message = `HTTP error! status: ${response.status}`;
      if (errorData && errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // Validation errors: [{loc, msg, type}, ...]
          const msgs = errorData.detail.map((d: any) => d?.msg || (typeof d === 'string' ? d : JSON.stringify(d))).filter(Boolean);
          if (msgs.length) message = msgs.join('; ');
        } else if (typeof errorData.detail === 'string') {
          message = errorData.detail;
        } else if (typeof errorData.detail === 'object') {
          message = errorData.detail.message || JSON.stringify(errorData.detail);
        }
      } else if (errorData && typeof errorData === 'object') {
        const candidates = [errorData.message, errorData.error, errorData.title];
        const found = candidates.find((x) => typeof x === 'string' && x.trim());
        if (found) message = found as string;
      }
      throw new Error(message);
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
  semester: string; // backend expects string
role: 'student' | 'faculty' | 'organization' | 'staff';
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

// Canteen Admin API
export const canteenAPI = {
  // Menu management
  getMenu: async () => {
    return await apiCall('/canteen/menu');
  },
  getCategories: async () => {
    return await apiCall('/canteen/menu/categories');
  },
  getMenuByCategory: async (category: string) => {
    return await apiCall(`/canteen/menu/by-category/${category}`);
  },
  addMenuItem: async (itemData: any) => {
    return await apiCall('/canteen/menu', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  },
  updateMenuItem: async (itemId: number, itemData: any) => {
    return await apiCall(`/canteen/menu/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  },
  deleteMenuItem: async (itemId: number) => {
    return await apiCall(`/canteen/menu/${itemId}`, {
      method: 'DELETE',
    });
  },
  verifyMenuVisibility: async () => {
    return await apiCall('/canteen/menu/verify-visibility');
  },
  
  // Asset management
  uploadMenuAsset: async (file: File) => {
    const url = `${API_BASE_URL}/canteen/menu/upload`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const fd = new FormData();
    fd.append('file', file);
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: fd,
    });
    if (!resp.ok) {
      const e = await resp.json().catch(()=>({}));
      throw new Error(e?.detail || `HTTP ${resp.status}`);
    }
    return resp.json();
  },
  getLatestMenuAsset: async () => {
    return await apiCall('/canteen/menu/latest-asset');
  },
  streamMenuAssetUrl: (assetId: number) => `${API_BASE_URL}/canteen/menu/assets/${assetId}/content`,
  
  // Order management
  placeOrder: async (orderData: any) => {
    return await apiCall('/canteen/order', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
  listOrdersAll: async () => {
    return await apiCall('/canteen/orders/all');
  },
  listOrders: async (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return await apiCall(`/canteen/orders${q}`);
  },
  updateOrderStatus: async (orderId: number, status: string) => {
    return await apiCall(`/canteen/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },
  scanQr: async (qr_token: string) => {
    return await apiCall('/canteen/scan', {
      method: 'POST',
      body: JSON.stringify({ qr_token }),
    });
  },
  
  // Staff management
  listStaff: async () => {
    return await apiCall('/canteen/staff');
  },
  promoteStaff: async (userId: number) => {
    return await apiCall('/canteen/staff/promote', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },
};

export default authAPI;
