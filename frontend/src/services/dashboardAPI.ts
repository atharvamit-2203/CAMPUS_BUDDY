// Dashboard API Services for Faculty and Student data
// Connects frontend components to backend MySQL database

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Get auth token
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

// Base API call function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
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
};

// =============================================================================
// FACULTY DASHBOARD APIs
// =============================================================================

export const facultyAPI = {
  // Get faculty courses
  getCourses: async () => {
    return apiCall('/timetable/faculty');
  },

  // Get faculty students
  getStudents: async () => {
    return apiCall('/users?role=student');
  },

  // Get faculty events
  getEvents: async () => {
    return apiCall('/events');
  },

  // Get faculty extra lectures
  getExtraLectures: async () => {
    return apiCall('/faculty/extra-lectures');
  },

  // Create extra lecture
  createExtraLecture: async (lectureData: any) => {
    return apiCall('/faculty/extra-lectures', {
      method: 'POST',
      body: JSON.stringify(lectureData),
    });
  },

  // Get consultation slots
  getConsultationSlots: async () => {
    return apiCall('/faculty/consultation-slots');
  },

  // Create consultation slot
  createConsultationSlot: async (slotData: any) => {
    return apiCall('/faculty/consultation-slots', {
      method: 'POST',
      body: JSON.stringify(slotData),
    });
  },

  // Get faculty timetable
  getTimetable: async () => {
    return apiCall('/timetable/faculty');
  },

  // Update timetable
  updateTimetable: async (updateData: any) => {
    return apiCall('/timetable/update', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Get faculty organizations
  getOrganizations: async () => {
    return apiCall('/organizations');
  },

  // Create event
  createEvent: async (eventData: any) => {
    return apiCall('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  },
};

// =============================================================================
// STUDENT DASHBOARD APIs  
// =============================================================================

export const studentAPI = {
  // Get student courses/subjects
  getCourses: async () => {
    return apiCall('/timetable/student');
  },

  // Get student timetable
  getTimetable: async () => {
    return apiCall('/timetable/student');
  },

  // Get available events
  getEvents: async () => {
    return apiCall('/events');
  },

  // Get events by interests
  getEventsByInterests: async () => {
    return apiCall('/events/discover');
  },

  // RSVP to event
  rsvpToEvent: async (eventId: number) => {
    return apiCall(`/events/${eventId}/rsvp`, {
      method: 'POST',
    });
  },

  // Get student organizations
  getOrganizations: async () => {
    return apiCall('/organizations');
  },

  // Join organization
  joinOrganization: async (orgId: number) => {
    return apiCall(`/organizations/${orgId}/join`, {
      method: 'POST',
    });
  },

  // Get student skills
  getSkills: async () => {
    return apiCall('/skills/student');
  },

  // Update student interests
  updateInterests: async (interests: string[]) => {
    return apiCall('/interests/update', {
      method: 'PUT',
      body: JSON.stringify({ interests }),
    });
  },

  // Get learning resources
  getLearningResources: async () => {
    return apiCall('/resources/learning');
  },

  // Get student connections
  getConnections: async () => {
    return apiCall('/connections');
  },

  // Get connection recommendations
  getConnectionRecommendations: async () => {
    return apiCall('/connections/recommendations');
  },

  // Send connection request
  sendConnectionRequest: async (targetUserId: number) => {
    return apiCall('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
  },
};

// =============================================================================
// SHARED APIs (Events, Canteen, Bookings)
// =============================================================================

export const sharedAPI = {
  // Canteen APIs
  canteen: {
    getMenu: async () => {
      return apiCall('/canteen/menu');
    },

    placeOrder: async (orderData: any) => {
      return apiCall('/canteen/order', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
    },

    getOrders: async () => {
      return apiCall('/canteen/orders');
    },

    // Generate PDF receipt
    generateReceipt: async (orderId: number) => {
      const response = await fetch(`${API_BASE_URL}/canteen/receipt/${orderId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }
      
      return response.blob();
    },
  },

  // Booking APIs
  bookings: {
    // Get available rooms
    getAvailableRooms: async (date?: string) => {
      const endpoint = date ? `/resources/rooms?date=${date}` : '/resources/rooms';
      return apiCall(endpoint);
    },

    // Book a room
    bookRoom: async (bookingData: any) => {
      return apiCall('/resources/book', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    },

    // Get user bookings
    getUserBookings: async () => {
      return apiCall('/resources/my-bookings');
    },

    // Cancel booking
    cancelBooking: async (bookingId: number) => {
      return apiCall(`/resources/bookings/${bookingId}/cancel`, {
        method: 'DELETE',
      });
    },
  },

  // Events APIs
  events: {
    getAllEvents: async () => {
      return apiCall('/events');
    },

    getEventDetails: async (eventId: number) => {
      return apiCall(`/events/${eventId}`);
    },

    createEvent: async (eventData: any) => {
      return apiCall('/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
    },

    updateEvent: async (eventId: number, eventData: any) => {
      return apiCall(`/events/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(eventData),
      });
    },

    deleteEvent: async (eventId: number) => {
      return apiCall(`/events/${eventId}`, {
        method: 'DELETE',
      });
    },

    getEventParticipants: async (eventId: number) => {
      return apiCall(`/events/${eventId}/participants`);
    },
  },

  // Notifications APIs
  notifications: {
    getAll: async () => {
      return apiCall('/notifications');
    },

    markAsRead: async (notificationId: number) => {
      return apiCall(`/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
    },

    getStats: async () => {
      return apiCall('/notifications/stats');
    },
  },

  // AI Features
  ai: {
    // Get AI recommendations
    getRecommendations: async (type: string) => {
      return apiCall(`/ai/recommendations?type=${type}`);
    },

    // AI Scheduler
    suggestReschedule: async (scheduleData: any) => {
      return apiCall('/ai/schedule/suggest', {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      });
    },

    // Chat with AI
    chatWithAI: async (message: string, context?: string) => {
      return apiCall('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, context }),
      });
    },
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const dashboardUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
  },

  // Get user role
  getUserRole: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userRole');
    }
    return null;
  },

  // Logout user
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      window.location.href = '/';
    }
  },

  // Format date for API
  formatDate: (date: Date) => {
    return date.toISOString().split('T')[0];
  },

  // Format time for API
  formatTime: (date: Date) => {
    return date.toTimeString().split(' ')[0];
  },
};

export default {
  faculty: facultyAPI,
  student: studentAPI,
  shared: sharedAPI,
  utils: dashboardUtils,
};
