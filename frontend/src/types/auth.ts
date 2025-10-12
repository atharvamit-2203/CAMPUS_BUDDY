export enum AuthView {
  Login = 'login',
  Register = 'register'
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
role: 'student' | 'faculty' | 'organization' | 'staff' | 'admin';
  college_id?: number;
  department?: string;
  bio?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  
  // Student specific fields
  student_id?: string;
  course?: string;
  branch?: string;
  semester?: string;
  academic_year?: string;
  batch?: string;
  
  // Faculty specific fields
  employee_id?: string;
  designation?: string;
  specialization?: string;
  
  // Organization specific fields
  organization_type?: string;
  
  // Common optional fields
  phone_number?: string;
  last_login?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  intendedRoute: string | null;
}

export interface RegisterFormData {
  college_id: string;
  full_name: string;
  username: string;
  email: string;
  password: string;
  course: string;
  semester: string;
role: 'student' | 'faculty' | 'organization' | 'staff';
  department?: string;
  student_id?: string;
  employee_id?: string;
  designation?: string;
  specialization?: string;
  organization_type?: string;
  bio?: string;
  phone_number?: string;
  // AI recommendation fields
  interests?: string[];
  skills?: string[];
}
