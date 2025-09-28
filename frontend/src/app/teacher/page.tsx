'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import AIDashboard from "@/components/AIDashboard";

// TypeScript interfaces for faculty dashboard data

interface Student {
  id: number;
  full_name: string;
  username: string;
  student_id: string;
  course: string;
  semester: string;
  cgpa: number;
  email: string;
  attendance_percentage?: number;
  recent_submissions?: number;
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
  description: string;
  schedule: string;
  credits: number;
  status: string;
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
  const [loading, setLoading] = useState(true);
  
  // Committee management states
  const [committeeEvents, setCommitteeEvents] = useState<CommitteeEvent[]>([]);
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>([]);
  const [committeeActivities, setCommitteeActivities] = useState<CommitteeActivity[]>([]);

  // Canteen states
  const [cart, setCart] = useState<{id: string, name: string, price: number, quantity: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('breakfast');
  const [showCart, setShowCart] = useState(false);

  // Sample menu data for teachers
  const menuData = {
    breakfast: [
      { id: 'b1', name: 'Aloo Paratha', price: 60, description: 'Stuffed potato flatbread with butter', image: '🥞' },
      { id: 'b2', name: 'Poha', price: 40, description: 'Flattened rice with onions and spices', image: '🍚' },
      { id: 'b3', name: 'Upma', price: 35, description: 'Semolina breakfast with vegetables', image: '🥣' },
      { id: 'b4', name: 'Bread Omelette', price: 50, description: 'Fluffy omelette with bread slices', image: '🍳' },
      { id: 'b5', name: 'Masala Dosa', price: 80, description: 'Crispy crepe with potato filling', image: '🥞' },
      { id: 'b6', name: 'Idli Sambhar', price: 45, description: 'Steamed rice cakes with lentil curry', image: '🍘' }
    ],
    lunch: [
      { id: 'l1', name: 'Veg Thali', price: 120, description: 'Complete meal with rice, dal, vegetables, roti', image: '🍛' },
      { id: 'l2', name: 'Chicken Biryani', price: 180, description: 'Aromatic basmati rice with chicken', image: '🍚' },
      { id: 'l3', name: 'Paneer Butter Masala', price: 140, description: 'Creamy cottage cheese curry with naan', image: '🍛' },
      { id: 'l4', name: 'Rajma Rice', price: 100, description: 'Kidney bean curry with steamed rice', image: '🍚' },
      { id: 'l5', name: 'Fish Curry', price: 160, description: 'South Indian fish curry with rice', image: '🐟' },
      { id: 'l6', name: 'Chole Bhature', price: 110, description: 'Spicy chickpeas with fried bread', image: '🍞' }
    ],
    snacks: [
      { id: 's1', name: 'Samosa', price: 25, description: 'Crispy fried pastry with potato filling', image: '🥟' },
      { id: 's2', name: 'Pakoras', price: 40, description: 'Mixed vegetable fritters', image: '🥢' },
      { id: 's3', name: 'Sandwich', price: 80, description: 'Grilled vegetable sandwich', image: '🥪' },
      { id: 's4', name: 'Pav Bhaji', price: 90, description: 'Spiced vegetable curry with bread rolls', image: '🍞' },
      { id: 's5', name: 'Chaat', price: 50, description: 'Tangy street food snack', image: '🥗' },
      { id: 's6', name: 'Spring Roll', price: 60, description: 'Crispy vegetable spring rolls', image: '🌯' }
    ],
    beverages: [
      { id: 'bv1', name: 'Masala Chai', price: 20, description: 'Spiced Indian tea', image: '☕' },
      { id: 'bv2', name: 'Coffee', price: 30, description: 'Hot coffee with milk', image: '☕' },
      { id: 'bv3', name: 'Fresh Lime Water', price: 25, description: 'Refreshing lime juice', image: '🍋' },
      { id: 'bv4', name: 'Lassi', price: 40, description: 'Yogurt-based drink', image: '🥛' },
      { id: 'bv5', name: 'Cold Coffee', price: 50, description: 'Iced coffee with ice cream', image: '🧊' },
      { id: 'bv6', name: 'Fresh Juice', price: 60, description: 'Seasonal fruit juice', image: '🧃' }
    ],
    desserts: [
      { id: 'd1', name: 'Gulab Jamun', price: 40, description: 'Sweet milk dumplings in syrup', image: '🍰' },
      { id: 'd2', name: 'Ice Cream', price: 50, description: 'Vanilla/Chocolate ice cream', image: '🍦' },
      { id: 'd3', name: 'Kheer', price: 45, description: 'Rice pudding with nuts', image: '🍮' },
      { id: 'd4', name: 'Jalebi', price: 35, description: 'Crispy spirals in sugar syrup', image: '🍯' }
    ],
    healthy: [
      { id: 'h1', name: 'Fruit Salad', price: 70, description: 'Fresh seasonal fruits', image: '🥗' },
      { id: 'h2', name: 'Green Salad', price: 60, description: 'Mixed vegetables with dressing', image: '🥗' },
      { id: 'h3', name: 'Sprouts Chaat', price: 50, description: 'Protein-rich sprouts salad', image: '🌱' },
      { id: 'h4', name: 'Grilled Chicken', price: 150, description: 'Healthy grilled chicken breast', image: '🍗' }
    ]
  };
  
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
        // Since API doesn't exist yet, use mock data
        // const [studentsData, researchData, eventsData] = await Promise.all([
        //   api.get('/faculty/students'),
        //   api.get('/faculty/research'),
        //   api.get('/faculty/events')
        // ]);
        
        // setStudents(studentsData.data);
        // setResearch(researchData.data);
        // setEvents(eventsData.data);

        // Fetch committee data if user is committee head
        const isCommitteeHead = user?.email?.includes('head') || false; // Mock check
        if (isCommitteeHead) {
          try {
            // const committeeData = await api.get('/faculty/committee');
            // setCommitteeEvents(committeeData.data.events || []);
            // setCommitteeMembers(committeeData.data.members || []);
            // setCommitteeActivities(committeeData.data.activities || []);
            
            // Mock committee data
            setCommitteeEvents([
              {
                id: "1",
                title: "Monthly Committee Meeting",
                description: "Regular monthly meeting to discuss upcoming activities",
                date: "2025-09-15",
                time: "10:00 AM",
                location: "Conference Room A",
                type: "meeting",
                status: "planned",
                attendees: 8,
                budget: "₹5,000"
              },
              {
                id: "2",
                title: "Tech Workshop: AI in Education",
                description: "Workshop on implementing AI tools in educational processes",
                date: "2025-09-20",
                time: "2:00 PM",
                location: "Auditorium",
                type: "workshop",
                status: "planned",
                attendees: 50,
                budget: "₹25,000"
              }
            ]);

            setCommitteeMembers([
              {
                id: 1,
                name: "Dr. Sarah Johnson",
                role: "Vice Head",
                department: "Computer Science",
                email: "sarah.johnson@college.edu",
                phone: "+91 9876543210",
                status: "active"
              },
              {
                id: 2,
                name: "Prof. Rajesh Kumar",
                role: "Secretary",
                department: "Information Technology",
                email: "rajesh.kumar@college.edu",
                status: "active"
              }
            ]);

            setCommitteeActivities([
              {
                id: "1",
                title: "Budget Approval for Annual Tech Fest",
                description: "Approved budget allocation for the annual technology festival",
                type: "decision",
                date: "2025-09-01",
                participants: ["Dr. Sarah Johnson", "Prof. Rajesh Kumar", "Dr. Mike Chen"],
                outcome: "Approved ₹2,50,000 budget"
              }
            ]);
          } catch (committeeError) {
            console.error('Error fetching committee data:', committeeError);
          }
        }

        // Mock assignments data
        setAssignments([
          { 
            id: "1", 
            title: "Machine Learning Project", 
            course: "CS 401 - AI & ML", 
            due_date: "2025-09-15",
            submissions: 28,
            total_students: 35,
            status: "Active"
          },
          { 
            id: "2", 
            title: "Database Design Assignment", 
            course: "CS 301 - DBMS", 
            due_date: "2025-09-12",
            submissions: 42,
            total_students: 45,
            status: "Active"
          },
          { 
            id: "3", 
            title: "Algorithm Analysis", 
            course: "CS 302 - DSA", 
            due_date: "2025-09-08",
            submissions: 30,
            total_students: 30,
            status: "Completed"
          }
        ]);

        // Mock events data
        setEvents([
          {
            id: 1,
            title: "Faculty Development Workshop",
            description: "Workshop on modern teaching methodologies",
            start_time: "2025-09-15T10:00:00",
            end_time: "2025-09-15T16:00:00", 
            location: "Conference Hall",
            type: "workshop",
            attendees_count: 25,
            is_organizer: false
          },
          {
            id: 2,
            title: "Research Symposium", 
            description: "Annual research presentation event",
            start_time: "2025-09-20T09:00:00",
            end_time: "2025-09-20T17:00:00",
            location: "Main Auditorium",
            type: "symposium", 
            attendees_count: 150,
            is_organizer: true
          }
        ]);
      } catch (error) {
        console.error('Error fetching faculty data:', error);
        // Mock data as fallback
        setCourses([
          { id: 1, name: "Artificial Intelligence & Machine Learning", code: "CS 401", semester: "7th", students_enrolled: 35, description: "Advanced concepts in AI and ML", schedule: "Mon, Wed, Fri - 10:00 AM", credits: 4, status: "Active" },
          { id: 2, name: "Database Management Systems", code: "CS 301", semester: "5th", students_enrolled: 45, description: "Relational and NoSQL databases", schedule: "Tue, Thu - 2:00 PM", credits: 3, status: "Active" },
          { id: 3, name: "Data Structures and Algorithms", code: "CS 302", semester: "5th", students_enrolled: 42, description: "Advanced data structures and algorithms", schedule: "Mon, Wed, Fri - 11:00 AM", credits: 4, status: "Active" }
        ]);

        setStudents([
          { id: 1, full_name: "Rahul Sharma", username: "rahul_s", student_id: "2021CS001", course: "Computer Science", semester: "7th", cgpa: 8.5, email: "rahul@example.com", attendance_percentage: 92, recent_submissions: 3 },
          { id: 2, full_name: "Priya Patel", username: "priya_p", student_id: "2021CS002", course: "Computer Science", semester: "7th", cgpa: 9.1, email: "priya@example.com", attendance_percentage: 95, recent_submissions: 4 },
          { id: 3, full_name: "Arjun Kumar", username: "arjun_k", student_id: "2021CS003", course: "Computer Science", semester: "5th", cgpa: 7.8, email: "arjun@example.com", attendance_percentage: 88, recent_submissions: 2 }
        ]);

        setResearch([
          { 
            id: "1", 
            title: "AI-Powered Educational Assessment", 
            description: "Developing intelligent systems for automated grading and feedback", 
            status: "Active",
            collaborators: 4,
            publications: 2,
            budget: "₹5,00,000",
            duration: "24 months",
            domain: ["Artificial Intelligence", "Education Technology", "Natural Language Processing"]
          },
          { 
            id: "2", 
            title: "Blockchain in Academic Credentials", 
            description: "Secure and verifiable academic credential management system", 
            status: "Planning",
            collaborators: 3,
            publications: 0,
            budget: "₹3,50,000",
            duration: "18 months",
            domain: ["Blockchain", "Security", "Academic Systems"]
          }
        ]);

        // Mock events data
        setEvents([
          {
            id: 1,
            title: "Database Systems Mid-Term Exam",
            description: "Mid-semester examination for Database Systems course",
            start_time: "2024-03-15T10:00:00",
            end_time: "2024-03-15T12:00:00",
            location: "Room A-101",
            type: "exam",
            attendees_count: 45,
            is_organizer: true
          },
          {
            id: 2,
            title: "Machine Learning Workshop",
            description: "Hands-on workshop on ML algorithms and implementation",
            start_time: "2024-03-20T14:00:00",
            end_time: "2024-03-20T17:00:00",
            location: "Computer Lab B-205",
            type: "workshop",
            attendees_count: 30,
            is_organizer: true
          },
          {
            id: 3,
            title: "Research Paper Review Meeting",
            description: "Monthly review meeting for ongoing research projects",
            start_time: "2024-03-25T15:00:00",
            end_time: "2024-03-25T16:30:00",
            location: "Conference Room C-301",
            type: "meeting",
            attendees_count: 8,
            is_organizer: false
          }
        ]);
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

  const stats = [
    {
      title: "Active Courses",
      value: courses.filter(c => c.status === "Active").length,
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
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "students", label: "Students", icon: "👨‍🎓" },
    { id: "courses", label: "Courses", icon: "📚" },
    { id: "research", label: "Research", icon: "🔬" },
    { id: "assignments", label: "Assignments", icon: "📝" },
    { id: "events", label: "Events", icon: "📅" },
    { id: "timetable", label: "Timetable", icon: "🕐" },
    { id: "canteen", label: "Canteen", icon: "☕" },
    { id: "ai-insights", label: "AI Insights", icon: "🧠" },
    ...(user?.email?.includes('head') ? [{ id: "committee", label: "Committee Management", icon: "🏛️" }] : [])
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
                <tab.icon className={`w-5 h-5 transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`} />
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
                      course.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
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
                      assignment.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                      assignment.status === 'Completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
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
                      project.status === 'Active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      project.status === 'Planning' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
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
                    {project.status === 'Active' ? 'Manage Project' : 'View Details'}
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
                <div className="grid grid-cols-8 gap-4 mb-4">
                  <div className="text-center font-semibold text-gray-900">Time</div>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="text-center font-semibold text-gray-900">{day}</div>
                  ))}
                </div>

                {[
                  { time: '9:00-10:30', classes: ['Database Systems\nRoom A-101\nCSE-3A (45 students)', 'Office Hours\nFaculty Room 205\nStudent Consultations', 'Machine Learning\nLab B-205\nCSE-3B (40 students)', 'Research Work\nResearch Lab\nPhD Guidance', 'Database Systems\nRoom A-101\nCSE-3C (42 students)', '', ''] },
                  { time: '10:45-12:15', classes: ['Research Meeting\nConference Room\nProject Review', 'Database Systems\nRoom A-101\nCSE-3B (40 students)', 'Faculty Meeting\nAdmin Block\nDepartment Meeting', 'Machine Learning\nLab B-205\nCSE-3A (45 students)', 'Office Hours\nFaculty Room 205\nStudent Consultations', '', ''] },
                  { time: '1:00-2:30', classes: ['Machine Learning\nLab B-205\nCSE-3C (42 students)', 'Research Work\nResearch Lab\nPaper Writing', 'Office Hours\nFaculty Room 205\nStudent Consultations', 'Database Systems\nRoom A-101\nCSE-3A (45 students)', 'Research Supervision\nResearch Lab\nMTech Guidance', '', ''] },
                  { time: '2:45-4:15', classes: ['Office Hours\nFaculty Room 205\nStudent Consultations', 'Machine Learning\nLab B-205\nCSE-3B (40 students)', 'Research Work\nResearch Lab\nData Analysis', 'Office Hours\nFaculty Room 205\nStudent Consultations', 'Faculty Seminar\nSeminar Hall\nTech Talk', '', ''] },
                  { time: '4:30-6:00', classes: ['Research Work\nResearch Lab\nProject Development', '', 'Research Work\nResearch Lab\nExperiment Setup', '', '', '', ''] }
                ].map((slot, slotIndex) => (
                  <div key={slotIndex} className="grid grid-cols-8 gap-4 mb-2">
                    <div className="bg-gray-50 rounded-lg p-3 text-center font-medium text-gray-700">
                      {slot.time}
                    </div>
                    {slot.classes.map((classInfo, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`rounded-lg p-3 text-xs ${
                          classInfo
                            ? classInfo.includes('Database Systems')
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : classInfo.includes('Machine Learning')
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : classInfo.includes('Office Hours')
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : classInfo.includes('Research')
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-orange-100 text-orange-800 border border-orange-200'
                            : 'bg-gray-50 text-gray-400'
                        }`}
                      >
                        {classInfo ? (
                          <div className="space-y-1">
                            {classInfo.split('\n').map((line, lineIndex) => (
                              <div
                                key={lineIndex}
                                className={
                                  lineIndex === 0
                                    ? 'font-semibold'
                                    : lineIndex === 1
                                    ? 'text-xs opacity-80'
                                    : 'text-xs opacity-70'
                                }
                              >
                                {line}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center">Free</div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
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

            {/* Category Selection */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Menu Categories</h3>
              <div className="flex flex-wrap gap-3">
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
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-green-100'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-green-50 p-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 capitalize">
                  {selectedCategory} Menu
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(menuData[selectedCategory as keyof typeof menuData] || []).map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-4 hover:bg-green-50 transition-all duration-200 transform hover:scale-105">
                      <div className="text-4xl mb-3 text-center">{item.image}</div>
                      <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                      <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-green-600 font-bold text-lg">₹{item.price}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
