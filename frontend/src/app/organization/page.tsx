"use client";   //dashboard for organization after login
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Calendar, 
  Search, 
  Filter, 
  UserCheck, 
  UserX, 
  Video, 
  Eye,
  Send,
  ChevronRight,
  MapPin,
  Clock,
  ExternalLink,
  Heart,
  X,
  Check,
  Settings,
  Bell,
  LogOut
} from 'lucide-react';
import EventManagement from './event/page';
import MeetingCalendar from './meeting/page';

// Type definitions
interface Event {
  id?: number;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  formLink: string;
  footfall?: string;
  guest?: string;
}

interface Profile {
  id: number;
  name: string;
  university?: string;
  course: string;
  year: string;
  interests: string[];
  skills: string[];
  avatar: string;
  rating?: number;
  cgpa?: string;
  projects?: number;
  status?: string;
  acceptedPosition?: string;
}

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (event: Omit<Event, 'id'>) => void;
}

interface ViewEventModalProps {
  event: Event | null;
  onClose: () => void;
}

interface ProfileCardProps {
  profile: Profile;
}

interface ViewProfileModalProps {
  profile: Profile | null;
  onClose: () => void;
}

interface InviteStep {
  profile: Profile;
  team?: string;
  position?: string;
  role?: string;
  sent?: boolean;
}

interface InviteModalProps {
  step: InviteStep | null;
  setStep: (step: InviteStep | null) => void;
  onClose: () => void;
}

interface ScheduleMeetingModalProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (date: string, time: string) => void;
}

interface TeamSelectionModalProps {
  profileId: number | null;
  onClose: () => void;
  onSelect: (team: string, position: string, role: string) => void;
}

interface EventCardProps {
  event: Event;
}


const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated or not an organization user
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login/organization');
      return;
    }
    if (user && user.role !== 'organization') {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Show loading or redirect while checking authentication
  if (!isAuthenticated || !user || user.role !== 'organization') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  // Event Creation Modal
  const CreateEventModal: React.FC<CreateEventModalProps> = ({ open, onClose, onCreate }) => {
    const [form, setForm] = useState({
      title: '',
      description: '',
      date: '',
      time: '',
      venue: '',
      formLink: '',
      footfall: '',
      guest: '',
    });
    const [error, setError] = useState('');
    if (!open) return null;
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = () => {
      if (!form.title || !form.description || !form.date || !form.time || !form.venue || !form.formLink) {
        setError('All fields except footfall and guest are required.');
        return;
      }
      setError('');
      onCreate(form);
      setForm({ title: '', description: '', date: '', time: '', venue: '', formLink: '', footfall: '', guest: '' });
    };
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative text-black">
          <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose}><X size={24} /></button>
          <h3 className="text-2xl font-bold mb-4 text-black">Create Event</h3>
          <div className="space-y-3">
            <div>
              <label className="block font-semibold mb-1 text-black">Event Name*</label>
              <input name="title" value={form.title} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded text-black" placeholder="Enter event name" />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">Event Description*</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded text-black" placeholder="Enter event description" />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">Date*</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded text-black" />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">Time*</label>
              <input type="time" name="time" value={form.time} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded text-black" />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">Venue*</label>
              <input name="venue" value={form.venue} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded text-black" placeholder="Enter venue" />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">Google Form Link*</label>
              <input name="formLink" value={form.formLink} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded text-black" placeholder="Paste Google Form link" />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">Last Year Footfall (optional)</label>
              <input name="footfall" value={form.footfall} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded text-black" placeholder="Number of people participated last year" />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-black">Guest/Alumni/Speaker Invited (optional)</label>
              <input name="guest" value={form.guest} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded text-black" placeholder="Guest/Alumni/Speaker name" />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 mt-2" onClick={handleSubmit}>Create Event</button>
          </div>
        </div>
      </div>
    );
  };

  // View Event Modal
  const ViewEventModal: React.FC<ViewEventModalProps> = ({ event, onClose }) => {
    if (!event) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative text-black">
          <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose}><X size={24} /></button>
          <h3 className="text-2xl font-bold mb-2 text-black">{event.title}</h3>
          <div className="mb-2"><span className="font-semibold">Description:</span> {event.description}</div>
          <div className="mb-2"><span className="font-semibold">Date:</span> {event.date}</div>
          <div className="mb-2"><span className="font-semibold">Time:</span> {event.time}</div>
          <div className="mb-2"><span className="font-semibold">Venue:</span> {event.venue}</div>
          {event.guest && <div className="mb-2"><span className="font-semibold">Guest/Alumni/Speaker Invited:</span> {event.guest}</div>}
          {event.footfall && <div className="mb-2"><span className="font-semibold">Last Year Footfall:</span> {event.footfall}</div>}
          <a href={event.formLink} target="_blank" rel="noopener noreferrer" className="block mt-4 text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Apply Now</a>
        </div>
      </div>
    );
  };
  // State for event creation modal
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    formLink: '',
    footfall: '',
    guest: '',
  });
  const [viewEvent, setViewEvent] = useState(null); // event object
  const [activeTab, setActiveTab] = useState('recruitment');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showTeamSelection, setShowTeamSelection] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkills, setFilterSkills] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  // Meeting scheduling state
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Canteen states
  const [cart, setCart] = useState<{id: string, name: string, price: number, quantity: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('breakfast');
  const [showCart, setShowCart] = useState(false);

  // Sample menu data for organizations
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

  // Cart functions for organization canteen
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

  const [meetingDate, setMeetingDate] = useState('');
  const [scheduledMeetings, setScheduledMeetings] = useState([
    // Existing meetings (Priya Mehta example)
    {
      name: 'Priya Mehta',
      position: 'Social Media Manager',
      date: '2025-09-12',
      time: '2:00 PM',
      location: 'Google Meet',
      status: 'Scheduled',
    },
    {
      name: 'Arjun Sharma',
      position: 'Creative Head',
      date: '2025-09-10',
      time: '3:00 PM',
      location: 'Google Meet',
      status: 'Join',
    },
  ]);

  // Sample data
  const studentProfiles = [
    {
      id: 1,
      name: "Arjun Sharma",
      course: "Computer Science",
      year: "3rd Year",
      interests: ["Drawing", "Digital Art", "Painting", "DIY Crafts", "Graphic Design"],
      skills: ["Photoshop", "Illustrator", "Canva", "Photography"],
      avatar: "AS",
      cgpa: "8.5",
      projects: 5
    },
    {
      id: 2,
      name: "Priya Mehta",
      course: "Business Administration",
      year: "2nd Year",
      interests: ["Social Media", "Marketing", "Content Writing", "Event Planning"],
      skills: ["Social Media Marketing", "Content Creation", "Analytics"],
      avatar: "PM",
      cgpa: "9.1",
      projects: 8
    },
    {
      id: 3,
      name: "Rahul Gupta",
      course: "Information Technology",
      year: "4th Year",
      interests: ["Web Development", "UI/UX Design", "Technical Writing"],
      skills: ["React", "Node.js", "Figma", "Technical Documentation"],
      avatar: "RG",
      cgpa: "8.8",
      projects: 12
    },
    // New sample profile 1: Sneha Nighot (accepted invite, special options)
    {
      id: 4,
      name: "Sneha Nighot",
      course: "Mass Communication",
      year: "2nd Year",
      interests: ["Photography", "PR", "Event Management"],
      skills: ["Photography", "Public Relations", "Social Media"],
      avatar: "SN",
      cgpa: "9.0",
      projects: 6,
      status: "accepted",
      acceptedPosition: "PR Photography Co-Head"
    },
    // New sample profile 2
    {
      id: 5,
      name: "Amit Patel",
      course: "Civil Engineering",
      year: "1st Year",
      interests: ["Sketching", "Model Making", "Site Visits"],
      skills: ["AutoCAD", "Teamwork"],
      avatar: "AP",
      cgpa: "8.1",
      projects: 2
    },
    // New sample profile 3
    {
      id: 6,
      name: "Fatima Ali",
      course: "Mathematics",
      year: "3rd Year",
      interests: ["Data Science", "Statistics", "Chess", "Blogging"],
      skills: ["Python", "R", "Machine Learning", "Publications"],
      avatar: "FA",
      cgpa: "9.6",
      projects: 10
    }
  ];

  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Tech Fest 2025",
      date: "2025-10-15",
      time: "10:00 AM",
      venue: "Main Auditorium",
      description: "Annual technical festival showcasing innovation and creativity",
      formLink: "https://forms.google.com/techfest2025"
    },
    {
      id: 2,
      title: "Cultural Night",
      date: "2025-09-25",
      time: "6:00 PM",
      venue: "Open Ground",
      description: "Celebrate diversity with music, dance, and cultural performances",
      formLink: "https://forms.google.com/culturalnight"
    }
  ]);

  const teamOptions: Record<string, string[]> = {
    pr: ["Creatives", "Editorial", "Marketing", "Social Media", "Photography"],
    core: ["Secretary", "Treasurer", "Vice President", "Vice Treasurer", "Finance Head", "Event Head", "External Technical Club Head", "Internal Technical Club", "Executives", "Security Head"]
  };

  const roleHierarchy = ["Head", "Co-Head", "Core Member", "Member"];

  const filteredProfiles = studentProfiles.filter(profile => 
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.interests.some(interest => 
      interest.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    profile.skills.some(skill => 
      skill.toLowerCase().includes(filterSkills.toLowerCase())
    )
  );

  // Drag handlers
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragStartPos({ x: clientX, y: clientY });
    e.preventDefault();
  };

  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - dragStartPos.x;
    const deltaY = clientY - dragStartPos.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
    e.preventDefault();
  };

  const handleDragEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    
    const swipeThreshold = 100;
    const { x } = dragOffset;
    
    if (Math.abs(x) > swipeThreshold) {
      // Swipe detected
      if (x > 0) {
        // Right swipe - Accept
        handleAccept();
      } else {
        // Left swipe - Reject
        handleReject();
      }
      
      // Animate card off screen
      setDragOffset({ x: x > 0 ? 1000 : -1000, y: dragOffset.y });
      
      setTimeout(() => {
        nextCard();
      }, 300);
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 });
    }
    
    setIsDragging(false);
    e.preventDefault();
  };

  const handleAccept = () => {
    const profile = studentProfiles[currentCardIndex];
    setShowTeamSelection(profile.id);
    console.log(`Accepted: ${profile.name}`);
  };

  const handleReject = () => {
    const profile = studentProfiles[currentCardIndex];
    console.log(`Rejected: ${profile.name}`);
  };

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % studentProfiles.length);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleTeamSelection = (team: string, position: string, role: string) => {
    setSelectedTeam(team);
    setSelectedPosition(position);
    setSelectedRole(role);
    console.log(`Selected for ${team} - ${position} as ${role}`);
    setShowTeamSelection(null);
  };

  // Header Component
  const Header = () => (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <img
              src="/campusbuddywhite.jpg"
              alt="CampusBuddy Logo"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Organization Dashboard</h1>
              <p className="text-sm text-gray-500">Manage your organization</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <Bell size={20} className="text-gray-600" />
            </button>
            <button className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <Settings size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => {
                router.push('/login');
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );

  // Navigation Component
  const Navigation = () => (
    <nav className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {[
            { id: 'recruitment', label: 'Recruitment', icon: Users, description: 'Find members' },
            { id: 'events', label: 'Events', icon: Calendar, description: 'Manage events' },
            { id: 'calendar', label: 'Meetings', icon: Video, description: 'Schedule meetings' },
            { id: 'timetable', label: 'Schedule', icon: Clock, description: 'Organization schedule' },
            { id: 'canteen', label: 'Canteen', icon: Heart, description: 'Order meals' }
          ].map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'recruitment' | 'events' | 'calendar' | 'timetable' | 'canteen')}
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

  // State for modals
  const [viewProfile, setViewProfile] = useState(null); // profile object
  const [inviteStep, setInviteStep] = useState<InviteStep | null>(null); // {profile, team, position, role, sent}

  // Example events and projects for demo
  const studentEvents: Record<number, string[]> = {
    1: ["Tech Fest 2024", "AI Bootcamp"],
    2: ["Marketing Summit", "Content Creators Meet"],
    3: ["UI/UX Hackathon", "Open Source Day"],
    4: ["Photography Expo", "PR Workshop"],
    5: ["Civil Model Expo"],
    6: ["Math Olympiad", "Data Science Symposium"]
  };
  const studentProjects: Record<number, string[]> = {
    1: ["Art Portfolio Website", "Digital Art Gallery"],
    2: ["Social Media Campaign", "Event Plan Doc"],
    3: ["Tech Blog", "UI Kit"],
    4: ["Photo Story", "PR Campaign"],
    5: ["Bridge Model"],
    6: ["Chess AI", "Statistical Analysis"]
  };

  const ProfileCard: React.FC<ProfileCardProps> = ({ profile }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100 hover:shadow-xl transition-shadow flex flex-col h-full">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {profile.avatar}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
          <p className="text-gray-600">{profile.course}</p>
          <p className="text-purple-600 font-medium">{profile.year}</p>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">Interests</h4>
        <div className="flex flex-wrap gap-2">
          {profile.interests.map((interest: string, index: number) => (
            <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              {interest}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">Skills</h4>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill: string, index: number) => (
            <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
        <span>CGPA: {profile.cgpa}</span>
        <span>Projects: {profile.projects}</span>
      </div>

      {/* Special options for Sneha Nighot (accepted invite) */}
      {profile.status === 'accepted' && profile.name === 'Sneha Nighot' ? (
          <div className="flex flex-col space-y-2 mt-auto">
            <div className="text-green-700 bg-green-100 rounded px-3 py-1 text-center font-semibold text-sm mb-2">
              {profile.name} accepted your invite for {profile.acceptedPosition}
            </div>
            <div className="flex space-x-3">
              <button
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                onClick={() => setShowScheduleModal(true)}
              >
                <Video size={16} />
                <span>Schedule Meeting</span>
              </button>
              <button
                className="flex-1 bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors flex items-center justify-center space-x-2"
                onClick={() => window.alert('Okay, will redirect the message to Sneha Nighot.')}
              >
                <X size={16} />
                <span>Position Unavailable</span>
              </button>
            </div>
          </div>
      ) : (
        <div className="flex space-x-3 mt-auto">
          <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
            onClick={() => setViewProfile(profile)}>
            <Eye size={16} />
            <span>View Profile</span>
          </button>
          <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            onClick={() => setInviteStep({profile})}>
            <Send size={16} />
            <span>Send Invite</span>
          </button>
        </div>
      )}
    </div>
  );
  // View Profile Modal
  const ViewProfileModal: React.FC<ViewProfileModalProps> = ({ profile, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 relative">
        <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose}><X size={24} /></button>
        <h3 className="text-2xl font-bold mb-2 text-purple-700">{profile.name}</h3>
        <p className="mb-1 text-gray-700"><span className="font-semibold">College:</span> Campus Solutions University</p>
        <p className="mb-1 text-gray-700"><span className="font-semibold">Course:</span> {profile.course}</p>
        <p className="mb-1 text-gray-700"><span className="font-semibold">Year:</span> {profile.year}</p>
        <p className="mb-1 text-gray-700"><span className="font-semibold">CGPA:</span> {profile.cgpa}</p>
        <div className="mb-2">
          <span className="font-semibold text-gray-700">Interests:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {profile.interests.map((i: string, idx: number) => <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">{i}</span>)}
          </div>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-gray-700">Skills:</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {profile.skills.map((s: string, idx: number) => <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">{s}</span>)}
          </div>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-gray-700">Description:</span>
          <p className="text-gray-600 mt-1 text-sm">{profile.name} is a passionate student of {profile.course} ({profile.year}) with a CGPA of {profile.cgpa}. They are interested in {profile.interests.join(", ")}. Skilled in {profile.skills.join(", ")}. Always eager to learn and contribute to new projects and events.</p>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-gray-700">Events Attended:</span>
          <ul className="list-disc ml-6 text-gray-600 text-sm mt-1">
            {(studentEvents[profile.id] || []).map((e: string, idx: number) => <li key={idx}>{e}</li>)}
          </ul>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-gray-700">Projects:</span>
          <ul className="list-disc ml-6 text-gray-600 text-sm mt-1">
            {(studentProjects[profile.id] || []).map((p: string, idx: number) => <li key={idx}>{p}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );

  // Invite Modal Stepper
  const InviteModal: React.FC<InviteModalProps> = ({ step, setStep, onClose }) => {
    if (!step) return null;
    const { profile, team, position, role, sent } = step;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4 relative">
          <button className="absolute top-4 right-4 text-gray-500 hover:text-gray-700" onClick={onClose}><X size={24} /></button>
          <h3 className="text-2xl font-extrabold mb-4 text-purple-700">Send Invitation to {profile.name}</h3>
          {!team && (
            <>
              <p className="mb-4 font-semibold text-gray-700">Select Team:</p>
              <div className="flex gap-4">
                <button className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700" onClick={()=>setStep({...step, team:'pr'})}>PR Team</button>
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700" onClick={()=>setStep({...step, team:'core'})}>Core Team</button>
              </div>
            </>
          )}
          {team && !position && (
            <>
              <p className="mb-4 font-bold text-gray-900">Select Position:</p>
              <select className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-gray-900 placeholder-gray-500" value="" onChange={e=>setStep({...step, position:e.target.value})}>
                <option value="" className="text-gray-900">Select Position</option>
                {(teamOptions[team] || []).map((pos: string) => (<option key={pos} value={pos} className="text-gray-900">{pos}</option>))}
              </select>
            </>
          )}
          {team && position && !role && (
            <>
              <p className="mb-4 font-bold text-gray-900">Select Role:</p>
              <select className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-gray-900" value="" onChange={e=>setStep({...step, role:e.target.value})}>
                <option value="" className="text-gray-900">Select Role</option>
                {roleHierarchy.map(r=>(<option key={r} value={r} className="text-gray-900">{r}</option>))}
              </select>
            </>
          )}
          {team && position && role && !sent && (
            <>
              <div className="mb-4 text-center">
                <p className="text-black">Invite for <span className="font-semibold text-purple-700">{team==='pr'?'PR':'Core'} Team</span></p>
                <p className="text-black">Position: <span className="font-semibold text-black">{position}</span></p>
                <p className="text-black">Role: <span className="font-semibold text-black">{role}</span></p>
              </div>
              <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700" onClick={()=>setStep({...step, sent:true})}>Send Invitation</button>
            </>
          )}
          {sent && (
            <div className="text-center text-green-700 font-semibold text-lg">Invitation sent successfully!</div>
          )}
        </div>
      </div>
    );
  };
  // (Modals will be rendered inside the main return below)
  // Meeting Schedule Modal
  const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({ open, onClose, onSchedule }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    return open ? (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Schedule Meeting with Sneha Nighot</h3>
          <label className="block mb-2 font-semibold text-gray-800">Select Date</label>
          <input
            type="date"
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-gray-900"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <label className="block mb-2 font-semibold text-gray-800">Select Time</label>
          <input
            type="time"
            className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-gray-900"
            value={time}
            onChange={e => setTime(e.target.value)}
          />
          <div className="flex space-x-3 mt-4">
            <button
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              onClick={() => {
                if (date && time) {
                  onSchedule(date, time);
                }
              }}
              disabled={!date || !time}
            >
              Schedule
            </button>
            <button
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    ) : null;
  };

  const SwipeCard = () => {
    const currentProfile = studentProfiles[currentCardIndex];
    const rotation = dragOffset.x * 0.1;
    const opacity = Math.max(0.7, 1 - Math.abs(dragOffset.x) / 300);

    return (
      <div className="relative flex justify-center items-center h-[600px]">
        {/* Background cards */}
        <div className="absolute w-80 h-96 bg-white rounded-2xl shadow-lg opacity-30 transform scale-95 rotate-2"></div>
        <div className="absolute w-80 h-96 bg-white rounded-2xl shadow-lg opacity-60 transform scale-98 -rotate-1"></div>

        {/* Main draggable card */}
        <div
          className="relative w-80 h-96 bg-white rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing select-none overflow-hidden"
          style={{
            transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
            opacity: opacity,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out',
          }}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          {/* Swipe indicators */}
          <div className={`absolute top-8 left-8 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg transform rotate-12 transition-opacity ${
            dragOffset.x > 50 ? 'opacity-100' : 'opacity-0'
          }`}>
            LIKE
          </div>

          <div className={`absolute top-8 right-8 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg transform -rotate-12 transition-opacity ${
            dragOffset.x < -50 ? 'opacity-100' : 'opacity-0'
          }`}>
            NOPE
          </div>

          {/* Profile photo area with avatar initials in the big white circle */}
          <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold text-3xl shadow-md">
              {currentProfile.avatar}
            </div>
          </div>

          {/* Profile info */}
          <div className="p-6 space-y-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-gray-900">{currentProfile.name}</h2>
                <span className="text-xl text-gray-600">{currentProfile.year.split(' ')[0]}</span>
              </div>
              <p className="text-gray-600">{currentProfile.course}</p>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm inline-block mt-1">
                ✓ Meeting Completed
              </div>
            </div>

            <div className="flex justify-between text-center bg-gray-50 rounded-lg p-3">
              <div>
                <div className="font-bold text-purple-600">{currentProfile.cgpa}</div>
                <div className="text-xs text-gray-500">CGPA</div>
              </div>
              <div>
                <div className="font-bold text-purple-600">{currentProfile.projects}</div>
                <div className="text-xs text-gray-500">Projects</div>
              </div>
              <div>
                <div className="font-bold text-purple-600">{currentProfile.skills.length}</div>
                <div className="text-xs text-gray-500">Skills</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Top Interests</h4>
              <div className="flex flex-wrap gap-2">
                {currentProfile.interests.slice(0, 3).map((interest, index) => (
                  <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Drag instruction - moved further down for better appearance */}
          <div className="absolute left-0 right-0 text-center" style={{ bottom: 40 }}>
            <div className="flex items-center justify-center space-x-4 text-gray-400 text-sm mt-6">
              <div className="flex items-center space-x-1">
                <X size={16} className="text-red-500" />
                <span>Drag left</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <span>Drag right</span>
                <Heart size={16} className="text-green-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({ profileId, onClose, onSelect }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Select Team & Position</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Team Type</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <option value="">Select Team</option>
              <option value="pr" className="text-gray-900">PR Team</option>
              <option value="core" className="text-gray-900">Core Team</option>
            </select>
          </div>
          
          {selectedTeam && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                onChange={(e) => setSelectedPosition(e.target.value)}
              >
                <option value="">Select Position</option>
                {teamOptions[selectedTeam]?.map((position: string) => (
                  <option key={position} value={position} className="text-gray-900">{position}</option>
                ))}
              </select>
            </div>
          )}
          
          {selectedPosition && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">Select Role</option>
                {roleHierarchy.map(role => (
                  <option key={role} value={role} className="text-gray-900">{role}</option>
                ))}
              </select>
            </div>
          )}
          
          {selectedTeam && selectedPosition && selectedRole && (
            <button
              onClick={() => onSelect(selectedTeam, selectedPosition, selectedRole)}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Send Selection Request
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const EventCard: React.FC<EventCardProps> = ({ event }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
      <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar size={16} />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Clock size={16} />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin size={16} />
          <span>{event.venue}</span>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
          <Eye size={16} />
          <span>View Event</span>
        </button>
        <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
          <ExternalLink size={16} />
          <span>Apply Now</span>
        </button>
      </div>
    </div>
  );

  // Handler for scheduling meeting with Sneha Nighot
  const handleScheduleMeeting = (date: string, time: string) => {
    setScheduledMeetings(prev => [
      ...prev,
      {
        name: 'Sneha Nighot',
        position: 'PR Photography Co-Head',
        date,
        time,
        location: 'Google Meet',
        status: 'Scheduled',
      },
    ]);
    setShowScheduleModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Header />
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Recruitment Tab */}
        {activeTab === 'recruitment' && (
          <div>
            {/* Search and Filter */}
            <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-purple-100">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, course, or interests..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Filter size={20} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Filter by skills..."
                    className="w-64 pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                    value={filterSkills}
                    onChange={(e) => setFilterSkills(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredProfiles.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>

            {/* PURE SWIPE INTERFACE - NO BUTTONS */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Post-Meeting Decision</h3>
                <p className="text-gray-600">Drag the card to make your decision</p>
              </div>
              <SwipeCard />
              <div className="mt-6 text-center">
                <div className="flex justify-center space-x-1 mb-2">
                  {studentProfiles.map((_, index) => (
                    <div 
                      key={index} 
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentCardIndex ? 'bg-purple-500 w-6' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Card {currentCardIndex + 1} of {studentProfiles.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="w-full">
            <EventManagement />
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <MeetingCalendar />
        )}

        {/* Timetable Tab */}
        {activeTab === 'timetable' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Organization Schedule</h2>
                  <p className="text-blue-100">Meeting schedules and organization activities</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-blue-200 text-sm">Events/Week</div>
                  </div>
                  <div className="hidden md:block">
                    <Clock className="w-16 h-16 text-white/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Calendar className="w-6 h-6 text-blue-500 mr-3" />
                  Weekly Organization Schedule
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
                  { time: '9:00-11:00', activities: ['Team Meeting\nConference Room\nWeekly Planning', '', 'Workshop Prep\nActivity Hall\nEvent Planning', '', 'Recruitment Drive\nMain Campus\nStudent Outreach', 'Community Service\nOff-Campus\nSocial Initiative', ''] },
                  { time: '11:00-1:00', activities: ['', 'Technical Training\nLab A-205\nSkill Development', '', 'Interview Sessions\nMeeting Room B\nCandidate Assessment', '', 'Event Execution\nVarious Venues\nActivity Coordination', ''] },
                  { time: '2:00-4:00', activities: ['Project Review\nProject Hall\nProgress Assessment', 'Mentor Meeting\nFaculty Lounge\nGuidance Session', 'Creative Session\nDesign Studio\nContent Creation', 'Team Building\nOutdoor Area\nTeam Activities', 'Organization Fair\nMain Quad\nPromotion Drive', '', ''] },
                  { time: '4:00-6:00', activities: ['', '', 'Event Planning\nPlanning Room\nStrategy Discussion', 'Alumni Connect\nAuditorium\nNetworking Session', 'Documentation\nOffice Space\nReport Writing', '', ''] },
                  { time: '6:00-8:00', activities: ['', '', '', 'Evening Events\nEvent Venues\nExecutions', '', '', ''] }
                ].map((slot, slotIndex) => (
                  <div key={slotIndex} className="grid grid-cols-8 gap-4 mb-2">
                    <div className="bg-gray-50 rounded-lg p-3 text-center font-medium text-gray-700">
                      {slot.time}
                    </div>
                    {slot.activities.map((activity, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`rounded-lg p-3 text-xs ${
                          activity
                            ? activity.includes('Meeting')
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : activity.includes('Workshop') || activity.includes('Training')
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : activity.includes('Event') || activity.includes('Fair')
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : activity.includes('Recruitment') || activity.includes('Interview')
                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : 'bg-gray-50 text-gray-400'
                        }`}
                      >
                        {activity ? (
                          <div className="space-y-1">
                            {activity.split('\n').map((line, lineIndex) => (
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

            {/* Upcoming Activities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                  Upcoming Activities
                </h3>
                <div className="space-y-3">
                  {[
                    { activity: 'Technical Workshop', date: 'Sep 15', time: '2:00 PM', priority: 'high' },
                    { activity: 'Team Meeting', date: 'Sep 16', time: '9:00 AM', priority: 'medium' },
                    { activity: 'Recruitment Drive', date: 'Sep 18', time: '9:00 AM', priority: 'high' },
                    { activity: 'Alumni Connect', date: 'Sep 19', time: '4:00 PM', priority: 'medium' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900">{item.activity}</div>
                        <div className="text-sm text-gray-600">{item.date} at {item.time}</div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        item.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.priority} priority
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 text-green-500 mr-2" />
                  Team Availability
                </h3>
                <div className="space-y-3">
                  {[
                    { member: 'Core Team', availability: '9:00 AM - 6:00 PM', status: 'available' },
                    { member: 'Tech Team', availability: '11:00 AM - 4:00 PM', status: 'busy' },
                    { member: 'Creative Team', availability: '2:00 PM - 8:00 PM', status: 'available' },
                    { member: 'Event Team', availability: '10:00 AM - 5:00 PM', status: 'available' }
                  ].map((team, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900">{team.member}</div>
                        <div className="text-sm text-gray-600">{team.availability}</div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        team.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {team.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canteen Tab */}
        {activeTab === 'canteen' && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Organization Canteen</h2>
                  <p className="text-green-100">Order meals for meetings and events</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setShowCart(!showCart)}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center space-x-2"
                  >
                    <Heart className="w-5 h-5" />
                    <span>Cart ({getTotalItems()})</span>
                  </button>
                  <div className="hidden md:block">
                    <Heart className="w-16 h-16 text-white/20" />
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

        {/* Meeting Schedule Modal for Sneha Nighot */}
        <ScheduleMeetingModal
          open={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleScheduleMeeting}
        />

        {/* Team Selection Modal */}
        {showTeamSelection && (
          <TeamSelectionModal
            profileId={showTeamSelection}
            onClose={() => setShowTeamSelection(null)}
            onSelect={handleTeamSelection}
          />
        )}

        {/* View Profile Modal */}
        {viewProfile && <ViewProfileModal profile={viewProfile} onClose={()=>setViewProfile(null)} />}
        {/* Invite Modal */}
        {inviteStep && <InviteModal step={inviteStep} setStep={setInviteStep} onClose={()=>setInviteStep(null)} />}

  {/* Event Modals removed: now handled in /organization/event */}
      </main>
    </div>
  );
};

export default Dashboard;