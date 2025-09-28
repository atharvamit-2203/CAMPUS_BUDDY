'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AIDashboard from '@/components/AIDashboard';
import { 
  User, 
  Users, 
  Bell, 
  Search, 
  Calendar, 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Star, 
  BookOpen, 
  Target, 
  Heart,
  ChevronRight,
  Zap,
  Trophy,
  Coffee,
  Send,
  Minimize2,
  X,
  Brain
} from 'lucide-react';

// ----------------------------------------------------------------------
// TYPE DEFINITIONS
// ----------------------------------------------------------------------

interface StudentProfile {
  id: string;
  fullName: string;
  course: string;
  batch: string;
  skills: string[];
  interests: string[];
  avatarUrl?: string;
}

interface RecommendedClub {
  id: string;
  name: string;
  memberCount: number;
  logoUrl?: string;
}

interface NetworkingProfile {
  id: string;
  fullName: string;
  course: string;
  commonInterests: string[];
  avatarUrl?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'workshop' | 'seminar' | 'competition' | 'social';
}

interface ChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

// Sample data (in a real app, this would come from your backend)
const sampleProfile: StudentProfile = {
  id: '1',
  fullName: 'Alex Johnson',
  course: 'Computer Science Engineering',
  batch: 'Class of 2025',
  skills: ['JavaScript', 'React', 'Python', 'Machine Learning', 'Node.js', 'TypeScript'],
  interests: ['Web Development', 'Artificial Intelligence', 'Entrepreneurship', 'Blockchain', 'UI/UX Design'],
  avatarUrl: '/api/placeholder/80/80'
};

const sampleClubs: RecommendedClub[] = [
  { id: '1', name: 'AI & Machine Learning Society', memberCount: 248 },
  { id: '2', name: 'Web Development Club', memberCount: 156 },
  { id: '3', name: 'Entrepreneurship Cell', memberCount: 189 },
  { id: '4', name: 'Blockchain Technology Group', memberCount: 97 },
  { id: '5', name: 'UI/UX Design Community', memberCount: 134 },
  { id: '6', name: 'Competitive Programming Club', memberCount: 203 }
];

const sampleNetworking: NetworkingProfile[] = [
  { id: '1', fullName: 'Sarah Chen', course: 'Data Science', commonInterests: ['AI', 'Machine Learning', 'Python'] },
  { id: '2', fullName: 'Mike Rodriguez', course: 'Computer Science', commonInterests: ['Web Development', 'JavaScript'] },
  { id: '3', fullName: 'Emily Watson', course: 'Business Administration', commonInterests: ['Entrepreneurship', 'Startups'] },
  { id: '4', fullName: 'David Kim', course: 'Information Technology', commonInterests: ['Blockchain', 'Web3'] },
  { id: '5', fullName: 'Lisa Zhang', course: 'Design', commonInterests: ['UI/UX Design', 'Creative Tech'] },
  { id: '6', fullName: 'James Wilson', course: 'Computer Engineering', commonInterests: ['AI', 'Robotics'] }
];

const sampleEvents: Event[] = [
  { id: '1', title: 'Advanced React Patterns Workshop', date: '2025-09-12', time: '2:00 PM - 5:00 PM', location: 'Tech Lab A-201', type: 'workshop' },
  { id: '2', title: 'Future of AI: Industry Panel Discussion', date: '2025-09-15', time: '10:00 AM - 12:00 PM', location: 'Main Auditorium', type: 'seminar' },
  { id: '3', title: 'Startup Pitch Competition 2025', date: '2025-09-20', time: '9:00 AM - 6:00 PM', location: 'Innovation Hub', type: 'competition' },
  { id: '4', title: 'Blockchain & Web3 Meetup', date: '2025-09-18', time: '6:00 PM - 8:00 PM', location: 'Conference Room B-105', type: 'social' },
  { id: '5', title: 'UI/UX Design Sprint', date: '2025-09-22', time: '1:00 PM - 4:00 PM', location: 'Design Studio', type: 'workshop' },
  { id: '6', title: 'Tech Career Fair 2025', date: '2025-09-25', time: '10:00 AM - 4:00 PM', location: 'Campus Central Plaza', type: 'seminar' }
];

export default function StudentDashboard() {
  const { user, isAuthenticated } = useAuth();
  
  // Chatbot state (must be at top level)
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: "Hi! I'm your Campus Connect assistant. How can I help you today?", isBot: true, timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
const [activeTab, setActiveTab] = useState<'overview' | 'networking' | 'events' | 'timetable' | 'canteen' | 'resources' | 'ai-insights'>('overview');
  
  // Canteen state
  const [cart, setCart] = useState<{id: string, name: string, price: number, quantity: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('breakfast');
  const [showCart, setShowCart] = useState(false);
  
  // Sample menu data
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
  
  // Use real user data if available, fallback to sample data
  const profile: StudentProfile = user ? {
    id: user.id?.toString() || '1',
    fullName: user.full_name || 'Unknown User',
    course: user.course || 'Unknown Course',
    batch: user.batch || 'Unknown Batch',
    skills: [], // These would come from user preferences/skills table
    interests: [], // These would come from user interests table
    avatarUrl: '/api/placeholder/80/80'
  } : sampleProfile;
  
  const [recommendedClubs, setRecommendedClubs] = useState<RecommendedClub[]>(sampleClubs);
  const [networkingProfiles, setNetworkingProfiles] = useState<NetworkingProfile[]>(sampleNetworking);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>(sampleEvents);
  
  // Fetch personalized recommendations from backend when authenticated
  React.useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/student/recommendations`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.clubs)) setRecommendedClubs(data.clubs.map((c: any) => ({ id: String(c.id), name: c.name, memberCount: c.member_count || 0 })));
          if (Array.isArray(data?.networking)) setNetworkingProfiles(data.networking.map((n: any) => ({ id: String(n.id), fullName: n.full_name, course: n.course, commonInterests: [], avatarUrl: '' })));
          if (Array.isArray(data?.events)) setUpcomingEvents(data.events.map((e: any) => ({ id: String(e.id), title: e.title, date: new Date(e.start_time).toISOString().slice(0,10), time: '', location: e.venue, type: 'workshop' as const })));
        }
      } catch (e) {
        // ignore and keep sample data
      }
    };
    if (isAuthenticated) fetchRecommendations();
  }, [isAuthenticated]);
  
  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to access your dashboard</h2>
          <Link href="/login/student" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Chatbot functions
  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage: ChatMessage = {
      id: messages.length + 1,
      text: inputMessage,
      isBot: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('club') || message.includes('join')) {
      return "I can help you find clubs! Based on your interests in AI and Web Development, I recommend checking out the AI & ML Society and Web Development Club. Would you like me to show you more details?";
    } else if (message.includes('event') || message.includes('workshop')) {
      return "There are several exciting events coming up! The React Workshop on Sept 12th and AI Seminar on Sept 15th might interest you. Would you like me to help you register?";
    } else if (message.includes('network') || message.includes('connect')) {
      return "I can help you expand your network! I found 6 students with similar interests. Sarah Chen in Data Science and Mike Rodriguez in Computer Science share your passion for AI and Web Development.";
    } else if (message.includes('schedule') || message.includes('calendar')) {
      return "Your upcoming schedule looks great! You have 3 events this month and 2 club meetings. Would you like me to add any reminders?";
    } else {
      return "That's a great question! I'm here to help you with clubs, events, networking, and navigating campus life. What specific area would you like assistance with?";
    }
  };

  // Cart functions
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

  // Header Component
  const Header = () => (
    <header className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col items-start">
                <Image
                  src="/CampusBuddyLogo.png"
                  alt="CampusBuddy Logo"
                  width={100}
                  height={28}
                  className="object-contain mt-6 mb-1 ml-12"
                  priority
                />
                <p className="text-purple-100 text-sm">Your Gateway to Opportunities</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="p-3 text-white hover:bg-white/20 rounded-xl transition-all duration-200 relative group" title="Notifications">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 block h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">3</span>
              <div className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-200"></div>
            </button>
            <button className="p-3 text-white hover:bg-white/20 rounded-xl transition-all duration-200 group" title="Search">
              <Search className="w-6 h-6" />
              <div className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-200"></div>
            </button>
            <div className="flex items-center space-x-3 bg-white/20 rounded-2xl px-4 py-2 backdrop-blur-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">
                  {profile.fullName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="text-left">
                <span className="text-white font-semibold block">{profile.fullName}</span>
                <span className="text-purple-100 text-xs">{profile.course}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  // Navigation Tabs
  const Navigation = () => (
    <nav className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {[
{ id: 'overview', label: 'Overview', icon: User, description: 'Dashboard home' },
            { id: 'networking', label: 'Networking', icon: MessageCircle, description: 'Connect with peers' },
            { id: 'events', label: 'Events', icon: Calendar, description: 'Upcoming activities' },
            { id: 'timetable', label: 'Timetable', icon: Clock, description: 'Class schedule' },
            { id: 'canteen', label: 'Canteen', icon: Coffee, description: 'Order food' },
            { id: 'resources', label: 'Resources', icon: BookOpen, description: 'Study materials' },
            { id: 'ai-insights', label: 'AI Insights', icon: Brain, description: 'Smart recommendations' }
          ].map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
onClick={() => setActiveTab(id as 'overview' | 'networking' | 'events' | 'timetable' | 'canteen' | 'resources' | 'ai-insights')}
              className={`flex items-center space-x-3 py-4 px-6 border-b-3 font-medium text-sm transition-all duration-300 relative group whitespace-nowrap ${
                activeTab === id
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${activeTab === id ? 'scale-110' : 'group-hover:scale-105'}`} />
              <div className="text-left">
                <span className="block">{label}</span>
                <span className="text-xs text-gray-400 hidden sm:block">{description}</span>
              </div>
              {activeTab === id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );

// Organizations Panel for Overview
  const MyOrganizationsPanel = () => {
    const [orgs, setOrgs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    React.useEffect(() => {
      const run = async () => {
        try {
          setLoading(true);
          const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
          const resp = await fetch(`${API}/organizations/my`, { headers: { Authorization: `Bearer ${token}` }});
          if (!resp.ok) throw new Error('Failed to load organizations');
          const data = await resp.json();
          setOrgs(Array.isArray(data) ? data : (data.organizations || []));
        } catch (e:any) {
          setError(e?.message || 'Failed to load organizations');
        } finally { setLoading(false); }
      };
      run();
    }, []);
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <Users className="w-6 h-6 text-blue-500 mr-3" />
          My Organizations
        </h3>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : orgs.length === 0 ? (
          <div className="text-gray-600">You have not joined any organizations yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orgs.map((o:any) => (
              <div key={o.id} className="p-4 border border-gray-200 rounded-xl">
                <div className="font-semibold text-gray-900">{o.organization_name || o.name}</div>
                {o.category && <div className="text-xs text-gray-500 mt-1">{o.category}</div>}
                <div className="text-xs text-gray-500 mt-2">Joined: {o.joined_at ? new Date(o.joined_at).toLocaleDateString() : '-'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Overview Tab Content
  const OverviewContent = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Card */}
      <div className="lg:col-span-1">
        <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-8 border border-purple-100 transform hover:scale-105 transition-all duration-300">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <span className="text-white text-3xl font-bold transform -rotate-3">
                  {profile.fullName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-white shadow-lg"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{profile.fullName}</h3>
            <p className="text-purple-600 font-semibold mb-1">{profile.course}</p>
            <p className="text-gray-500 text-sm mb-6">{profile.batch}</p>
            
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Trophy className="w-5 h-5" />
                <span className="font-semibold">Achievement Level</span>
              </div>
              <div className="text-2xl font-bold">Rising Star</div>
              <div className="text-sm opacity-90">85% Profile Complete</div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                  Skills
                </h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {profile.skills.length} skills
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm rounded-xl font-medium border border-blue-200 hover:scale-105 transition-transform duration-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Heart className="w-5 h-5 text-red-500 mr-2" />
                  Interests
                </h4>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {profile.interests.length} interests
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, index) => (
                  <span key={index} className="px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 text-sm rounded-xl font-medium border border-green-200 hover:scale-105 transition-transform duration-200">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

{/* Stats & Quick Actions */}
      <div className="lg:col-span-2 space-y-8">
        <MyOrganizationsPanel />
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Joined Clubs</p>
                <p className="text-4xl font-bold">3</p>
                <p className="text-blue-200 text-xs mt-1">+1 this month</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Events Attended</p>
                <p className="text-4xl font-bold">12</p>
                <p className="text-green-200 text-xs mt-1">+3 this week</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Connections</p>
                <p className="text-4xl font-bold">28</p>
                <p className="text-purple-200 text-xs mt-1">+5 this week</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Target className="w-6 h-6 text-purple-500 mr-3" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/student/timetable" className="p-6 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 group text-left transform hover:scale-105 block">
              <Calendar className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <div className="font-semibold text-gray-900 mb-1">Timetable</div>
              <div className="text-xs text-gray-500">View class schedule</div>
            </Link>
            
            <Link href="/student/canteen" className="p-6 rounded-2xl border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all duration-300 group text-left transform hover:scale-105 block">
              <Coffee className="w-8 h-8 text-green-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <div className="font-semibold text-gray-900 mb-1">Canteen</div>
              <div className="text-xs text-gray-500">Order food online</div>
            </Link>
            
            <Link href="/student/resources" className="p-6 rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 group text-left transform hover:scale-105 block">
              <BookOpen className="w-8 h-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <div className="font-semibold text-gray-900 mb-1">Resources</div>
              <div className="text-xs text-gray-500">Study materials</div>
            </Link>
            
            <button className="p-6 rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 group text-left transform hover:scale-105">
              <MessageCircle className="w-8 h-8 text-orange-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
              <div className="font-semibold text-gray-900 mb-1">Network</div>
              <div className="text-xs text-gray-500">Connect with peers</div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-purple-50 p-6 border-b border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center">
              <Clock className="w-6 h-6 text-purple-500 mr-3" />
              Recent Activity
              <span className="ml-auto text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">Live</span>
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {[
                { action: 'Joined AI & ML Society', time: '2 hours ago', type: 'join', color: 'blue' },
                { action: 'Completed React Workshop', time: '1 day ago', type: 'achievement', color: 'green' },
                { action: 'Connected with Sarah Chen', time: '2 days ago', type: 'network', color: 'purple' },
                { action: 'Registered for Startup Competition', time: '3 days ago', type: 'event', color: 'orange' },
                { action: 'Updated profile skills', time: '1 week ago', type: 'profile', color: 'indigo' }
              ].map(({ action, time, color }, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200 group">
                  <div className={`flex-shrink-0 w-3 h-3 bg-${color}-400 rounded-full mt-2 group-hover:scale-125 transition-transform duration-200`}></div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium group-hover:text-gray-700">{action}</p>
                    <p className="text-gray-500 text-sm">{time}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Clubs Tab Content
  const ClubsContent = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Discover Amazing Clubs</h2>
            <p className="text-purple-100">Join communities that match your interests and grow your network</p>
          </div>
          <div className="hidden md:block">
            <Users className="w-16 h-16 text-white/20" />
          </div>
        </div>
      </div>

      {/* Recommended Clubs */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Star className="w-6 h-6 text-yellow-500 mr-3" />
            Recommended for You
          </h3>
          <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
            Based on your interests
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedClubs.map((club, index) => (
            <div key={club.id} className="group border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Rank</div>
                  <div className="text-sm font-bold text-purple-600">#{index + 1}</div>
                </div>
              </div>
              
              <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-purple-600 transition-colors duration-200">{club.name}</h4>
              
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex -space-x-2">
                  {[1,2,3].map((i) => (
                    <div key={i} className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-bold">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-gray-600 font-medium">{club.memberCount} members</span>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Activity Level</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300"
                    style={{width: `${Math.min(90, Math.round(club.memberCount / 3))}%`}}
                  >
                  </div>
                </div>
              </div>
              
              <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-4 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 font-semibold shadow-lg group-hover:shadow-xl transform group-hover:scale-105">
                Join Club
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <BookOpen className="w-6 h-6 text-blue-500 mr-3" />
          Browse by Category
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Technology', count: 12, color: 'blue', icon: '💻' },
            { name: 'Arts & Culture', count: 8, color: 'purple', icon: '🎨' },
            { name: 'Sports', count: 15, color: 'green', icon: '⚽' },
            { name: 'Business', count: 6, color: 'orange', icon: '💼' }
          ].map((category, index) => (
            <button key={index} className={`p-6 rounded-2xl border-2 border-${category.color}-200 hover:border-${category.color}-400 hover:bg-${category.color}-50 transition-all duration-300 text-left group transform hover:scale-105`}>
              <div className="text-3xl mb-3">{category.icon}</div>
              <div className="font-semibold text-gray-900 mb-1">{category.name}</div>
              <div className="text-sm text-gray-500">{category.count} clubs</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Chatbot Component
  const ChatBot = () => (
    <>
      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full shadow-2xl hover:from-purple-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center group hover:scale-110 z-50"
        >
          <MessageCircle className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
            1
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 transform transition-all duration-300 scale-100">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Campus Assistant</h3>
                <p className="text-sm text-purple-100">Online now</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsChatOpen(false)}
                title="Minimize chat"
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsChatOpen(false)}
                title="Close chat"
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  message.isBot 
                    ? 'bg-gray-100 text-gray-800 rounded-bl-md' 
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-br-md'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-purple-100'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                title="Send message"
                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Header />
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
{activeTab === 'overview' && <OverviewContent />}
        {activeTab === 'networking' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Expand Your Network</h2>
                  <p className="text-green-100">Connect with like-minded peers and build meaningful relationships</p>
                </div>
                <div className="hidden md:block">
                  <MessageCircle className="w-16 h-16 text-white/20" />
                </div>
              </div>
            </div>

            {/* Networking Opportunities */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Users className="w-6 h-6 text-green-500 mr-3" />
                  Suggested Connections
                </h3>
                <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  {networkingProfiles.length} suggestions
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {networkingProfiles.map((person, index) => (
                  <div key={person.id} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl p-6 hover:border-green-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="text-center mb-6">
                      <div className="relative inline-block">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                          <span className="text-white text-xl font-bold">
                            {person.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg group-hover:text-green-600 transition-colors duration-200">{person.fullName}</h4>
                      <p className="text-green-600 font-medium text-sm">{person.course}</p>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-500 font-medium">Common Interests</p>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {person.commonInterests.length} shared
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {person.commonInterests.map((interest, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs rounded-xl font-medium border border-blue-200">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-lg group-hover:shadow-xl">
                        <MessageCircle className="w-4 h-4 inline mr-2" />
                        Connect
                      </button>
                      <button className="w-full border-2 border-gray-200 text-gray-600 py-2 px-4 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 font-medium">
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Networking Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Total Connections</p>
                    <p className="text-3xl font-bold">28</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm mb-1">This Month</p>
                    <p className="text-3xl font-bold">+5</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">Network Score</p>
                    <p className="text-3xl font-bold">92%</p>
                  </div>
                  <Star className="w-10 h-10 text-purple-200" />
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'events' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Upcoming Events</h2>
                  <p className="text-orange-100">Don&apos;t miss out on amazing opportunities to learn and grow</p>
                </div>
                <div className="hidden md:block">
                  <Calendar className="w-16 h-16 text-white/20" />
                </div>
              </div>
            </div>

            {/* Events List */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-orange-50 p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Calendar className="w-6 h-6 text-orange-500 mr-3" />
                    This Month&apos;s Events
                  </h3>
                  <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
                    {upcomingEvents.length} events
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {upcomingEvents.map((event) => {
                    const typeColors = {
                      workshop: 'blue',
                      seminar: 'green', 
                      competition: 'purple',
                      social: 'orange'
                    };
                    const typeIcons = {
                      workshop: '🛠️',
                      seminar: '📚',
                      competition: '🏆',
                      social: '🎉'
                    };
                    const color = typeColors[event.type];
                    const icon = typeIcons[event.type];
                    
                    return (
                      <div key={event.id} className={`group border-2 border-${color}-200 rounded-2xl p-6 hover:border-${color}-400 hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-gradient-to-br from-white to-${color}-50`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-start space-x-4">
                              <div className={`w-14 h-14 bg-gradient-to-br from-${color}-500 to-${color}-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                                <span className="text-2xl">{icon}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-bold text-gray-900 text-xl group-hover:text-gray-700">{event.title}</h4>
                                  <span className={`px-3 py-1 bg-${color}-100 text-${color}-700 text-xs rounded-full font-medium capitalize`}>
                                    {event.type}
                                  </span>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span className="font-medium">{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>{event.time}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{event.location}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-3 md:ml-6">
                            <button className={`bg-gradient-to-r from-${color}-500 to-${color}-600 text-white py-3 px-6 rounded-xl hover:from-${color}-600 hover:to-${color}-700 transition-all duration-300 font-semibold shadow-lg group-hover:shadow-xl transform group-hover:scale-105 whitespace-nowrap`}>
                              Register Now
                            </button>
                            <button className="border-2 border-gray-200 text-gray-600 py-2 px-6 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 font-medium whitespace-nowrap">
                              Learn More
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Event Categories */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <BookOpen className="w-6 h-6 text-orange-500 mr-3" />
                Browse by Type
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Workshops', count: 8, color: 'blue', icon: '🛠️', desc: 'Hands-on learning' },
                  { name: 'Seminars', count: 5, color: 'green', icon: '📚', desc: 'Expert talks' },
                  { name: 'Competitions', count: 3, color: 'purple', icon: '🏆', desc: 'Show your skills' },
                  { name: 'Social Events', count: 6, color: 'orange', icon: '🎉', desc: 'Network & fun' }
                ].map((category, index) => (
                  <button key={index} className={`p-6 rounded-2xl border-2 border-${category.color}-200 hover:border-${category.color}-400 hover:bg-${category.color}-50 transition-all duration-300 text-left group transform hover:scale-105`}>
                    <div className="text-3xl mb-3">{category.icon}</div>
                    <div className="font-semibold text-gray-900 mb-1">{category.name}</div>
                    <div className="text-sm text-gray-500 mb-1">{category.count} events</div>
                    <div className="text-xs text-gray-400">{category.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'timetable' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Class Timetable</h2>
                  <p className="text-blue-100">Your weekly class schedule and important timings</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">18</div>
                    <div className="text-blue-200 text-sm">Classes/Week</div>
                  </div>
                  <div className="hidden md:block">
                    <Clock className="w-16 h-16 text-white/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-4 border border-blue-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Next Class</div>
                    <div className="font-semibold text-gray-900">Database Systems</div>
                    <div className="text-xs text-blue-600">in 45 minutes</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 border border-green-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Current Location</div>
                    <div className="font-semibold text-gray-900">Room A-101</div>
                    <div className="text-xs text-green-600">Block A, Floor 1</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 border border-purple-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Today&apos;s Classes</div>
                    <div className="font-semibold text-gray-900">4 Classes</div>
                    <div className="text-xs text-purple-600">2 completed</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-4 border border-orange-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Attendance</div>
                    <div className="font-semibold text-gray-900">92.5%</div>
                    <div className="text-xs text-orange-600">This semester</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Timetable */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Calendar className="w-6 h-6 text-blue-500 mr-3" />
                    Weekly Schedule
                  </h3>
                  <div className="text-sm text-gray-500">September 9-15, 2025</div>
                </div>
              </div>
              <div className="p-6">
                {/* Time slots header */}
                <div className="grid grid-cols-8 gap-4 mb-4">
                  <div className="text-center font-semibold text-gray-900">Time</div>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="text-center font-semibold text-gray-900">{day}</div>
                  ))}
                </div>

                {/* Time slots */}
                {[
                  { time: '9:00-10:30', classes: ['Database Systems\nRoom A-101\nDr. Smith', 'Machine Learning\nLab B-205\nDr. Johnson', 'Web Development\nRoom C-102\nProf. Wilson', 'Data Structures\nRoom A-103\nDr. Brown', 'Software Engineering\nRoom B-201\nProf. Davis', '', ''] },
                  { time: '10:45-12:15', classes: ['Algorithms\nRoom B-102\nDr. Taylor', 'Database Systems\nRoom A-101\nDr. Smith', 'Machine Learning\nLab B-205\nDr. Johnson', 'Computer Networks\nLab C-301\nProf. Miller', 'Project Work\nLab A-205\nProf. Wilson', '', ''] },
                  { time: '1:00-2:30', classes: ['Computer Networks\nLab C-301\nProf. Miller', 'Software Engineering\nRoom B-201\nProf. Davis', 'Algorithms\nRoom B-102\nDr. Taylor', 'Web Development\nRoom C-102\nProf. Wilson', 'Database Systems\nRoom A-101\nDr. Smith', '', ''] },
                  { time: '2:45-4:15', classes: ['Project Work\nLab A-205\nProf. Wilson', 'Data Structures\nRoom A-103\nDr. Brown', 'Computer Networks\nLab C-301\nProf. Miller', 'Machine Learning\nLab B-205\nDr. Johnson', 'Algorithms\nRoom B-102\nDr. Taylor', '', ''] },
                  { time: '4:30-6:00', classes: ['', '', '', '', '', '', ''] }
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
                            ? slotIndex % 2 === 0
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-green-100 text-green-800 border border-green-200'
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

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Assignments */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 text-blue-500 mr-2" />
                  Upcoming Assignments
                </h3>
                <div className="space-y-3">
                  {[
                    { subject: 'Database Systems', assignment: 'ER Diagram Project', due: 'Sep 15', priority: 'high' },
                    { subject: 'Machine Learning', assignment: 'Linear Regression Lab', due: 'Sep 18', priority: 'medium' },
                    { subject: 'Web Development', assignment: 'Portfolio Website', due: 'Sep 22', priority: 'low' }
                  ].map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900">{assignment.assignment}</div>
                        <div className="text-sm text-gray-600">{assignment.subject}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          assignment.priority === 'high' ? 'text-red-600' :
                          assignment.priority === 'medium' ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          Due {assignment.due}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          assignment.priority === 'high' ? 'bg-red-100 text-red-700' :
                          assignment.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {assignment.priority} priority
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Schedule */}
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-green-500 mr-2" />
                  Today&apos;s Schedule
                </h3>
                <div className="space-y-3">
                  {[
                    { time: '9:00-10:30', subject: 'Database Systems', room: 'A-101', status: 'completed' },
                    { time: '10:45-12:15', subject: 'Algorithms', room: 'B-102', status: 'completed' },
                    { time: '1:00-2:30', subject: 'Computer Networks', room: 'C-301', status: 'current' },
                    { time: '2:45-4:15', subject: 'Project Work', room: 'A-205', status: 'upcoming' }
                  ].map((schedule, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        schedule.status === 'completed' ? 'bg-green-400' :
                        schedule.status === 'current' ? 'bg-blue-400' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{schedule.subject}</div>
                        <div className="text-sm text-gray-600">{schedule.time} • Room {schedule.room}</div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        schedule.status === 'completed' ? 'bg-green-100 text-green-700' :
                        schedule.status === 'current' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {schedule.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'canteen' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Campus Canteen</h2>
                  <p className="text-green-100">Order your favorite meals online for pickup or delivery</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setShowCart(!showCart)}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center space-x-2"
                  >
                    <Coffee className="w-5 h-5" />
                    <span>Cart ({getTotalItems()})</span>
                  </button>
                  <div className="hidden md:block">
                    <Coffee className="w-16 h-16 text-white/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Sidebar */}
            {showCart && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Your Cart</h3>
                  <button 
                    onClick={() => setShowCart(false)} 
                    className="text-gray-500 hover:text-gray-700"
                    title="Close cart"
                    aria-label="Close cart"
                  >
                    <X className="w-5 h-5" />
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

        {activeTab === 'resources' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Study Resources</h2>
                  <p className="text-purple-100">Access course materials, notes, and academic resources</p>
                </div>
                <div className="hidden md:block">
                  <BookOpen className="w-16 h-16 text-white/20" />
                </div>
              </div>
            </div>

            {/* Resource Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Lecture Notes', count: 45, icon: '📝', color: 'blue' },
                { name: 'E-Books', count: 120, icon: '📚', color: 'green' },
                { name: 'Video Lectures', count: 35, icon: '🎥', color: 'red' },
                { name: 'Past Papers', count: 80, icon: '📄', color: 'orange' },
                { name: 'Lab Manuals', count: 25, icon: '🔬', color: 'purple' },
                { name: 'Research Papers', count: 200, icon: '📋', color: 'indigo' }
              ].map((resource, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <div className="text-4xl mb-4">{resource.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{resource.name}</h3>
                  <p className="text-gray-500 mb-4">{resource.count} resources available</p>
                  <button className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors">
                    Browse
                  </button>
                </div>
              ))}
            </div>

            {/* Recent Resources */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-purple-50 p-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Clock className="w-6 h-6 text-purple-500 mr-3" />
                  Recently Added
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { name: 'Database Design - Chapter 5 Notes', type: 'PDF', course: 'DBMS', date: '2 days ago' },
                    { name: 'Machine Learning Algorithms Video', type: 'Video', course: 'ML', date: '5 days ago' },
                    { name: 'Web Development Lab Manual', type: 'PDF', course: 'WD', date: '1 week ago' },
                    { name: 'Data Structures Practice Problems', type: 'PDF', course: 'DSA', date: '1 week ago' }
                  ].map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{resource.name}</h4>
                          <p className="text-gray-500 text-sm">{resource.course} • {resource.type} • {resource.date}</p>
                        </div>
                      </div>
                      <button className="text-purple-500 hover:text-purple-700 font-medium">Download</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === 'ai-insights' && (
          <div className="space-y-6">
            <AIDashboard userType="student" userId={1} />
          </div>
        )}
      </main>
      
      {/* Floating Chatbot */}
      <ChatBot />
    </div>
  );
}
