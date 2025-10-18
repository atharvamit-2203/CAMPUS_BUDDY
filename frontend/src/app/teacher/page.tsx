'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AIDashboard from "@/components/AIDashboard";
import AllFacultyBookings from "@/components/AllFacultyBookings";
import StaffCanteenOrders from "@/components/StaffCanteenOrders";
import { facultyAPI } from "@/services/roleBasedAPI";

// TypeScript interfaces for faculty dashboard data

interface Student {
  id: number;
  full_name: string;
  student_id: string;
  course: string;
  semester: string;
  cgpa: number;
  attendance_percentage: number;
  recent_submissions: number;
}

interface Research {
  id: string;
  title: string;
  description: string;
  status: string;
  collaborators: number;
  publications: number;
  budget?: string;
  duration: string;
  domain: string[];
}

interface Event {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  type: string;
  attendees_count?: number;
  is_organizer?: boolean;
}

interface ChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface Course {
  id: number;
  name: string;
  code: string;
  semester: string;
  students_enrolled: number;
  description?: string;
  schedule: string;
  credits: number;
  status: 'active' | 'completed' | 'upcoming';
}

interface CommitteeEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'meeting' | 'workshop' | 'seminar' | 'conference' | 'activity';
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  attendees: number;
  budget?: string;
}

interface CommitteeMember {
  id: number;
  name: string;
  role: string;
  department: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
}

interface CommitteeActivity {
  id: string;
  title: string;
  description: string;
  type: 'meeting' | 'decision' | 'announcement' | 'project';
  date: string;
  participants: string[];
  outcome?: string;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  due_date: string;
  submissions: number;
  total_students: number;
  status: string;
}

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [research, setResearch] = useState<Research[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [timetableData, setTimetableData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Committee management states
  const [committeeEvents, setCommitteeEvents] = useState<CommitteeEvent[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [committeeActivities, setCommitteeActivities] = useState<CommitteeActivity[]>([]);

  // Canteen states
  const [cart, setCart] = useState<{id: string, name: string, price: number, quantity: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCart, setShowCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [menuData, setMenuData] = useState<{[key: string]: Array<{id: string, name: string, price: number, description: string, image: string, category: string}>}>({});
  const [menuLoading, setMenuLoading] = useState(false);
  
  // Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Hello Professor! I'm your Faculty Assistant 👨‍🎓 How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Fetch data from APIs
  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        setLoading(true);

        // Fetch data from APIs
        const [coursesData, studentsData, researchData, assignmentsData, menuDataResponse, eventsData, timetableResponse] = await Promise.all([
          facultyAPI.getCourses().catch(() => []),
          facultyAPI.getStudentAnalytics().catch(() => []),
          facultyAPI.getResearchProjects().catch(() => []),
          facultyAPI.getAssignments().catch(() => []),
          facultyAPI.getCanteenMenu().catch(() => ({})),
          facultyAPI.getEvents().catch(() => []),
          facultyAPI.getTimetable().catch(() => null)
        ]);

        setCourses(coursesData);
        setStudents(studentsData);
        setResearch(researchData);
        setAssignments(assignmentsData);
        setMenuData(menuDataResponse);
        setEvents(eventsData as any); // Type assertion for now
        setTimetableData(timetableResponse);


      } catch (error) {
        console.error('Error fetching faculty data:', error);
        // Fallback to empty arrays if API fails
        setCourses([]);
        setStudents([]);
        setResearch([]);
        setAssignments([]);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFacultyData();
    }
  }, [user]);

  // Cart functions for canteen
  const addToCart = (item: {id: string, name: string, price: number}) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? {...cartItem, quantity: cartItem.quantity + 1}
          : cartItem
      ));
    } else {
      setCart([...cart, {...item, quantity: 1}]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? {...item, quantity} : item
      ));
    }
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Get filtered menu items based on category and search
  const getFilteredMenuItems = () => {
    let items: Array<{id: string, name: string, price: number, description: string, image: string, category: string}> = [];
    
    if (selectedCategory === 'all') {
      // Combine all categories
      Object.entries(menuData).forEach(([category, categoryItems]) => {
        items.push(...categoryItems.map(item => ({ ...item, category })));
      });
    } else {
      // Get items from selected category
      const categoryItems = menuData[selectedCategory as keyof typeof menuData] || [];
      items = categoryItems.map(item => ({ ...item, category: selectedCategory }));
    }

    // Filter by search term
    if (searchTerm.trim()) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return items;
  };

  const stats = [
    {
      title: "Active Courses",
      value: courses.filter(c => c.status === "active").length,
      icon: "📚",
      color: "from-blue-500 to-blue-600",
      change: "+1 this semester",
      changeType: "positive"
    },
    {
      title: "Total Students",
      value: courses.reduce((sum, course) => sum + course.students_enrolled, 0),
      icon: "👨‍🎓",
      color: "from-green-500 to-green-600",
      change: "+12 enrolled",
      changeType: "positive"
    },
    {
      title: "Research Projects",
      value: research.filter(r => r.status === "Active").length,
      icon: "🔬",
      color: "from-purple-500 to-purple-600",
      change: "2 ongoing",
      changeType: "neutral"
    },
    {
      title: "Pending Reviews",
      value: assignments.reduce((sum, assignment) => sum + (assignment.total_students - assignment.submissions), 0),
      icon: "📝",
      color: "from-orange-500 to-orange-600",
      change: "Due this week",
      changeType: "negative"
    }
  ];

  const handleChatSend = () => {
    if (chatInput.trim()) {
      const newMessage: ChatMessage = {
        id: chatMessages.length + 1,
        text: chatInput,
        isBot: false,
        timestamp: new Date()
      };
      
      setChatMessages([...chatMessages, newMessage]);
      setChatInput("");
      
      // Simulate bot response
      setTimeout(() => {
        const botResponse: ChatMessage = {
          id: chatMessages.length + 2,
          text: getBotResponse(chatInput),
          isBot: true,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, botResponse]);
      }, 1000);
    }
  };

  const getBotResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('student') || lowerInput.includes('grade')) {
      return "I can help you with student management, grading, and attendance tracking. What specific information do you need?";
    } else if (lowerInput.includes('course') || lowerInput.includes('schedule')) {
      return "I can assist with course management, scheduling, and curriculum planning. What would you like to know?";
    } else if (lowerInput.includes('research') || lowerInput.includes('publication')) {
      return "I can help you track research progress, manage publications, and find collaboration opportunities. How can I assist?";
    } else if (lowerInput.includes('assignment') || lowerInput.includes('homework')) {
      return "I can help you create assignments, track submissions, and manage deadlines. What do you need help with?";
    } else {
      return "I'm here to help with teaching, research, student management, and administrative tasks. How can I assist you today?";
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊", description: "Dashboard overview" },
    { id: "students", label: "Students", icon: "👨‍🎓", description: "Student management" },
    { id: "courses", label: "Courses", icon: "📚", description: "Course management" },
    { id: "research", label: "Research", icon: "🔬", description: "Research projects" },
    { id: "assignments", label: "Assignments", icon: "📝", description: "Assignment tracking" },
    { id: "events", label: "Events", icon: "📅", description: "Event management" },
    { id: "timetable", label: "Timetable", icon: "🕐", description: "Schedule management" },
    { id: "bookings", label: "Faculty Bookings", icon: "🏢", description: "Room bookings" },
    { id: "staff-orders", label: "Staff Orders", icon: "🛒", description: "Canteen staff" },
    { id: "canteen", label: "Canteen", icon: "☕", description: "Canteen orders" },
    { id: "ai-insights", label: "AI Insights", icon: "🧠", description: "AI analytics" },
    ...(user?.email?.includes('head') ? [{ id: "committee", label: "Committee Management", icon: "🏛️", description: "Committee oversight" }] : [])
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your faculty dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.full_name?.charAt(0) || 'F'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Faculty Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.full_name || 'Professor'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">3</span>
                </div>
              </button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Today</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 py-4 px-6 border-b-3 font-medium text-sm transition-all duration-300 relative group whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className={`text-xl transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`}>
                  {tab.icon}
                </span>
                <div className="text-left">
                  <span className="block">{tab.label}</span>
                  <span className="text-xs text-gray-400 hidden sm:block">{tab.description}</span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</p>
                    <p className={`text-sm mt-2 ${
                      stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' :
                      stat.changeType === 'negative' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className={`text-4xl bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300">
                  <span className="text-2xl">📝</span>
                  <span className="font-medium">Create Assignment</span>
                </button>
                <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300">
                  <span className="text-2xl">📊</span>
                  <span className="font-medium">Grade Submissions</span>
                </button>
                <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:from-purple-600 hover:to-violet-600 transition-all duration-300">
                  <span className="text-2xl">📅</span>
                  <span className="font-medium">Schedule Meeting</span>
                </button>
                <button className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300">
                  <span className="text-2xl">📧</span>
                  <span className="font-medium">Send Announcement</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-900 dark:text-white">New submission received for ML Project</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-auto">2 hours ago</span>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-900 dark:text-white">Graded 15 assignments for DBMS course</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-auto">4 hours ago</span>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-900 dark:text-white">Research paper submitted to ICML 2025</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-auto">1 day ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Students</h2>
              <div className="flex space-x-4">
                <select 
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white"
                  title="Filter students by course"
                  aria-label="Filter students by course"
                >
                  <option>All Courses</option>
                  <option>CS 401 - AI & ML</option>
                  <option>CS 301 - DBMS</option>
                  <option>CS 302 - DSA</option>
                </select>
                <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300">Export List</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <div key={student.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 hover:transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {student.full_name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{student.full_name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{student.student_id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Course:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{student.course}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Semester:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{student.semester}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">CGPA:</span>
                      <span className={`font-medium ${student.cgpa >= 8.5 ? 'text-green-600 dark:text-green-400' : student.cgpa >= 7.0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                        {student.cgpa}
                      </span>
                    </div>
                    {student.attendance_percentage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Attendance:</span>
                        <span className={`font-medium ${student.attendance_percentage >= 85 ? 'text-green-600 dark:text-green-400' : student.attendance_percentage >= 75 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                          {student.attendance_percentage}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300">
                      View Profile
                    </button>
                    <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "courses" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h2>
              <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300">+ Add Course</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{course.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{course.code} • {course.semester} Semester</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">{course.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      course.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Enrolled Students:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{course.students_enrolled}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Credits:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{course.credits}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Schedule:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{course.schedule}</span>
                    </div>
                  </div>
                  <div className="mt-6 flex space-x-2">
                    <button className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm font-medium">
                      View Details
                    </button>
                    <button className="flex-1 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors duration-200 text-sm font-medium">
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h2>
              <button className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300">+ Create Assignment</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{assignment.title}</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">{assignment.course}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      assignment.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      assignment.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Submissions:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {assignment.submissions}/{assignment.total_students}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.round((assignment.submissions / assignment.total_students) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round((assignment.submissions / assignment.total_students) * 100)}% completion rate
                    </div>
                  </div>
                  <div className="mt-6 flex space-x-2">
                    <button className="flex-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors duration-200 text-sm font-medium">
                      Grade Submissions
                    </button>
                    <button className="flex-1 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors duration-200 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "research" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Research Projects</h2>
              <button className="bg-gradient-to-r from-purple-500 to-violet-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-violet-600 transition-all duration-300">+ New Research Project</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {research.map((project) => (
                <div key={project.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 hover:transform hover:scale-105 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{project.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      project.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      project.status === 'planning' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                      'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">👥</span>
                      {project.collaborators} collaborators
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">📄</span>
                      {project.publications} publications
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">⏰</span>
                      Duration: {project.duration}
                    </div>
                    {project.budget && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="mr-2">💰</span>
                        Budget: {project.budget}
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Research Domains:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.domain.map((domain) => (
                        <span key={domain} className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-xs">
                          {domain}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-purple-500 to-violet-500 text-white py-2 rounded-lg hover:from-purple-600 hover:to-violet-600 transition-all duration-300">
                    {project.status === 'active' ? 'Manage Project' : 'View Details'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Events</h2>
              <button className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white px-6 py-2 rounded-lg hover:from-indigo-600 hover:to-blue-600 transition-all duration-300">+ Create Event</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.length > 0 ? events.map((event) => (
                <div key={event.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 hover:transform hover:scale-105 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{event.title}</h3>
                    <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm">
                      {event.type}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{event.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">📅</span>
                      {new Date(event.start_time).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">⏰</span>
                      {new Date(event.start_time).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">📍</span>
                      {event.location}
                    </div>
                    {event.attendees_count && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="mr-2">👥</span>
                        {event.attendees_count} attendees
                      </div>
                    )}
                  </div>

                  <button className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white py-2 rounded-lg hover:from-indigo-600 hover:to-blue-600 transition-all duration-300">
                    {event.is_organizer ? 'Manage Event' : 'Join Event'}
                  </button>
                </div>
              )) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No upcoming events</p>
                  <p className="text-gray-400 dark:text-gray-500 mt-2">Create your first academic event</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "committee" && user?.email?.includes('head') && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Committee Management</h2>
                <p className="text-gray-600 dark:text-gray-400">{user?.email?.split('@')[0] || 'Committee Head'}</p>
              </div>
              <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300">+ Create New Event</button>
            </div>

            {/* Committee Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Committee Members</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{committeeMembers.length}</p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Upcoming Events</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{committeeEvents.filter(e => e.status === 'planned').length}</p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Recent Activities</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{committeeActivities.length}</p>
                  </div>
                  <div className="text-4xl">📋</div>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Budget</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">₹30K</p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>
            </div>

            {/* Committee Tabs */}
            <div className="mb-8">
              <div className="flex space-x-1 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                <button className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                  <span>📅</span>
                  <span>Events</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50">
                  <span>👥</span>
                  <span>Members</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50">
                  <span>📋</span>
                  <span>Activities</span>
                </button>
              </div>
            </div>

            {/* Committee Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {committeeEvents.map((event) => (
                <div key={event.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 hover:transform hover:scale-105 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{event.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      event.status === 'planned' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                      event.status === 'ongoing' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      event.status === 'completed' ? 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200' :
                      'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{event.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">📅</span>
                      {event.date} at {event.time}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">📍</span>
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">👥</span>
                      {event.attendees} expected attendees
                    </div>
                    {event.budget && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="mr-2">💰</span>
                        Budget: {event.budget}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <span className="mr-2">🏷️</span>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300">
                      Manage Event
                    </button>
                    <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300">
                      Edit
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New Event Card */}
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 border-dashed hover:transform hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl mb-4">
                  ➕
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Create New Event</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Organize workshops, meetings, or activities</p>
                <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "timetable" && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Faculty Timetable</h2>
                  <p className="text-blue-100">Your weekly teaching schedule and office hours</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">15</div>
                    <div className="text-blue-200 text-sm">Hours/Week</div>
                  </div>
                  <div className="hidden md:block">
                    <span className="text-6xl">🕐</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Faculty Schedule */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  📅 <span className="ml-3">Weekly Teaching Schedule</span>
                </h3>
              </div>
              <div className="p-6">
                {timetableData && timetableData.timetable ? (
                  <>
                    <div className="grid grid-cols-8 gap-4 mb-4">
                      <div className="text-center font-semibold text-gray-900">Time</div>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <div key={day} className="text-center font-semibold text-gray-900">{day}</div>
                      ))}
                    </div>

                    {/* Group by time slots */}
                    {(() => {
                      const timeSlots: {[time: string]: {[day: string]: any[]}} = {};

                      // Group classes by time and day
                      Object.entries(timetableData.timetable).forEach(([day, classes]) => {
                        (classes as any[]).forEach(cls => {
                          const time = cls.time || 'TBA';
                          if (!timeSlots[time]) {
                            timeSlots[time] = {};
                          }
                          if (!timeSlots[time][day]) {
                            timeSlots[time][day] = [];
                          }
                          timeSlots[time][day].push(cls);
                        });
                      });

                      return Object.entries(timeSlots).map(([time, dayClasses]) => (
                        <div key={time} className="grid grid-cols-8 gap-4 mb-2">
                          <div className="bg-gray-50 rounded-lg p-3 text-center font-medium text-gray-700">
                            {time}
                          </div>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                            const classes = dayClasses[day] || [];
                            return (
                              <div
                                key={day}
                                className={`rounded-lg p-3 text-xs ${
                                  classes.length > 0
                                    ? classes[0].type === 'lecture'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : classes[0].type === 'lab'
                                      ? 'bg-green-100 text-green-800 border border-green-200'
                                      : 'bg-purple-100 text-purple-800 border border-purple-200'
                                    : 'bg-gray-50 text-gray-400'
                                }`}
                              >
                                {classes.length > 0 ? (
                                  <div className="space-y-1">
                                    {classes.map((cls: any, idx: number) => (
                                      <div key={idx}>
                                        <div className="font-semibold">{cls.subject || cls.subject_code}</div>
                                        <div className="text-xs opacity-80">{cls.room}</div>
                                        {cls.course && <div className="text-xs opacity-70">{cls.course} {cls.semester}</div>}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center">Free</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">No timetable available</h4>
                    <p className="text-gray-600">Your teaching schedule will appear here once it's set up.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Office Hours & Research Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  ⏰ <span className="ml-2">Office Hours</span>
                </h3>
                <div className="space-y-3">
                  {[
                    { day: 'Monday', time: '10:45 AM - 12:15 PM', status: 'Available' },
                    { day: 'Wednesday', time: '1:00 PM - 2:30 PM', status: 'Available' },
                    { day: 'Thursday', time: '2:45 PM - 4:15 PM', status: 'Busy' },
                    { day: 'Friday', time: '10:45 AM - 12:15 PM', status: 'Available' }
                  ].map((office, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900">{office.day}</div>
                        <div className="text-sm text-gray-600">{office.time}</div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        office.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {office.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  🔬 <span className="ml-2">Research Schedule</span>
                </h3>
                <div className="space-y-3">
                  {[
                    { activity: 'PhD Student Guidance', time: 'Thu 9:00-10:30', priority: 'high' },
                    { activity: 'Paper Writing Session', time: 'Tue 1:00-2:30', priority: 'medium' },
                    { activity: 'Data Analysis', time: 'Wed 2:45-4:15', priority: 'high' },
                    { activity: 'MTech Supervision', time: 'Fri 1:00-2:30', priority: 'medium' }
                  ].map((research, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900">{research.activity}</div>
                        <div className="text-sm text-gray-600">{research.time}</div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        research.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {research.priority} priority
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "canteen" && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Faculty Canteen</h2>
                  <p className="text-green-100">Order meals for pickup or delivery to your office</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setShowCart(!showCart)}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center space-x-2"
                  >
                    ☕ <span className="ml-2">Cart ({getTotalItems()})</span>
                  </button>
                  <div className="hidden md:block">
                    <span className="text-6xl">☕</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Sidebar */}
            {showCart && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Your Cart</h3>
                  <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-green-600 font-bold">₹{item.price}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">Total: ₹{getTotalAmount()}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button className="bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors">
                          Pay Now
                        </button>
                        <button className="bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors">
                          Pay Later
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Category Selection and Search */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Menu Categories</h3>
              
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔍</span>
                  </div>
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="mb-4">
                <label htmlFor="category-dropdown" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Category
                </label>
                <select
                  id="category-dropdown"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                >
                  <option value="all">All Categories</option>
                  <option value="breakfast">🥞 Breakfast</option>
                  <option value="lunch">🍛 Lunch</option>
                  <option value="snacks">🍟 Snacks</option>
                  <option value="beverages">☕ Beverages</option>
                  <option value="desserts">🍰 Desserts</option>
                  <option value="healthy">🥗 Healthy Options</option>
                </select>
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`p-4 rounded-xl flex flex-col items-center space-y-2 transition-all duration-200 ${
                    selectedCategory === 'all'
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                  }`}
                >
                  <span className="text-2xl">🍽️</span>
                  <span className="text-sm font-medium">All Items</span>
                </button>
                {[
                  { id: 'breakfast', name: 'Breakfast', icon: '🥞' },
                  { id: 'lunch', name: 'Lunch', icon: '🍛' },
                  { id: 'snacks', name: 'Snacks', icon: '🍟' },
                  { id: 'beverages', name: 'Beverages', icon: '☕' },
                  { id: 'desserts', name: 'Desserts', icon: '🍰' },
                  { id: 'healthy', name: 'Healthy Options', icon: '🥗' }
                ].map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-xl flex flex-col items-center space-y-2 transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                    }`}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-green-50 p-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedCategory === 'all' ? 'All Menu Items' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Menu`}
                  {searchTerm && <span className="text-lg font-normal text-gray-600 ml-2">- "{searchTerm}"</span>}
                </h3>
                <p className="text-gray-600 mt-1">
                  {getFilteredMenuItems().length} items found
                </p>
              </div>
              <div className="p-6">
                {getFilteredMenuItems().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">😕</div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {searchTerm ? 'No items found' : 'No items in this category'}
                    </h4>
                    <p className="text-gray-600">
                      {searchTerm 
                        ? 'Try adjusting your search terms or browse other categories.'
                        : 'This category is currently empty. Check back later!'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredMenuItems().map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-xl p-4 hover:bg-green-50 transition-all duration-200 transform hover:scale-105 border border-gray-100">
                        <div className="text-4xl mb-3 text-center">{item.image}</div>
                        <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-green-600 font-bold text-lg">₹{item.price}</span>
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full capitalize">
                            {item.category}
                          </span>
                        </div>
                        <button 
                          onClick={() => addToCart(item)}
                          className="w-full bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors font-medium"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === "ai-insights" && (
          <div className="space-y-6">
            <AIDashboard userType="teacher" userId={1} />
          </div>
        )}

        {/* Faculty Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <AllFacultyBookings />
          </div>
        )}

        {/* Staff Orders Tab */}
        {activeTab === "staff-orders" && (
          <div className="space-y-6">
            <StaffCanteenOrders />
          </div>
        )}
      </main>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        {isChatOpen ? (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 h-96 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  👨‍🎓
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Faculty Assistant</h3>
                  <p className="text-xs text-green-500">Online</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.isBot 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Ask about courses, students, research..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={handleChatSend}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 flex items-center justify-center text-2xl"
          >
            👨‍🎓
          </button>
        )}
      </div>
    </div>
  );
}

