'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  Filter,
  Star,
  Users,
  Tag,
  Heart,
  Share2,
  ExternalLink,
  TrendingUp,
  Award,
  Music,
  Briefcase,
  GraduationCap,
  Gamepad2,
  Coffee,
  Book,
  Globe,
  X,
  Check,
  Plus,
  ArrowRight,
  Bookmark,
  Bell
} from 'lucide-react';

// Type definitions
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  image: string;
  category: 'academic' | 'cultural' | 'sports' | 'workshop' | 'career' | 'competition' | 'social' | 'other';
  organizer: string;
  capacity?: number;
  registrationCount?: number;
  price?: number;
  tags: string[];
  rating?: number;
  reviews?: number;
  featured: boolean;
  trending: boolean;
  registrationRequired: boolean;
  registrationLink?: string;
  contactEmail?: string;
  prerequisites?: string[];
  rewards?: string[];
}

interface UserPreferences {
  favoriteCategories: string[];
  interests: string[];
  notificationSettings: {
    newEvents: boolean;
    reminders: boolean;
    recommendations: boolean;
  };
}

interface RegisteredEvent {
  eventId: string;
  registeredAt: string;
  status: 'registered' | 'attended' | 'cancelled';
  reminder: boolean;
}

const EventDiscoveryPage = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'registered' | 'calendar' | 'recommendations'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'popularity' | 'rating' | 'trending'>('date');
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);

  // Sample events data with enhanced features
  const [events] = useState<Event[]>([
    // Featured Events
    {
      id: '1',
      title: 'Tech Innovation Summit 2024',
      description: 'Join industry leaders and innovators for a day of cutting-edge technology discussions, startup pitches, and networking opportunities.',
      date: '2024-02-15',
      time: '09:00',
      endTime: '17:00',
      location: 'Main Auditorium',
      image: '/api/placeholder/400/250',
      category: 'career',
      organizer: 'Tech Innovation Club',
      capacity: 500,
      registrationCount: 342,
      price: 0,
      tags: ['technology', 'innovation', 'networking', 'startup'],
      rating: 4.8,
      reviews: 156,
      featured: true,
      trending: true,
      registrationRequired: true,
      registrationLink: 'https://forms.gle/tech-summit-2024',
      contactEmail: 'tech.club@college.edu',
      prerequisites: [],
      rewards: ['Certificate of Participation', 'Networking Opportunities', 'Goodies']
    },
    {
      id: '2',
      title: 'Annual Cultural Fest - Spectrum 2024',
      description: 'A celebration of diversity and creativity featuring music, dance, drama, and art from various cultures around the world.',
      date: '2024-02-20',
      time: '18:00',
      endTime: '22:00',
      location: 'Campus Grounds',
      image: '/api/placeholder/400/250',
      category: 'cultural',
      organizer: 'Cultural Committee',
      capacity: 2000,
      registrationCount: 1450,
      price: 100,
      tags: ['culture', 'music', 'dance', 'art', 'diversity'],
      rating: 4.9,
      reviews: 320,
      featured: true,
      trending: true,
      registrationRequired: true,
      registrationLink: 'https://forms.gle/spectrum-2024',
      contactEmail: 'cultural@college.edu',
      prerequisites: [],
      rewards: ['Cultural Experience', 'Food Stalls', 'Performances']
    },
    {
      id: '3',
      title: 'AI/ML Workshop: Deep Learning Fundamentals',
      description: 'Hands-on workshop covering the basics of deep learning, neural networks, and practical implementation using TensorFlow.',
      date: '2024-02-18',
      time: '14:00',
      endTime: '17:00',
      location: 'Computer Lab A',
      image: '/api/placeholder/400/250',
      category: 'workshop',
      organizer: 'Data Science Society',
      capacity: 40,
      registrationCount: 35,
      price: 0,
      tags: ['AI', 'machine learning', 'deep learning', 'tensorflow', 'programming'],
      rating: 4.7,
      reviews: 28,
      featured: false,
      trending: true,
      registrationRequired: true,
      registrationLink: 'https://forms.gle/ai-ml-workshop',
      contactEmail: 'datascience@college.edu',
      prerequisites: ['Basic Python Knowledge', 'Linear Algebra Basics'],
      rewards: ['Certificate', 'Workshop Materials', 'Project Template']
    },
    {
      id: '4',
      title: 'Inter-College Basketball Championship',
      description: 'Annual basketball tournament featuring teams from colleges across the city. Witness exciting matches and cheer for your team!',
      date: '2024-02-22',
      time: '10:00',
      endTime: '18:00',
      location: 'Sports Complex',
      image: '/api/placeholder/400/250',
      category: 'sports',
      organizer: 'Sports Committee',
      capacity: 1000,
      registrationCount: 750,
      price: 50,
      tags: ['basketball', 'sports', 'competition', 'inter-college'],
      rating: 4.5,
      reviews: 89,
      featured: false,
      trending: false,
      registrationRequired: false,
      contactEmail: 'sports@college.edu',
      prerequisites: [],
      rewards: ['Exciting Matches', 'Refreshments', 'Prizes for Winners']
    },
    {
      id: '5',
      title: 'Career Guidance Seminar',
      description: 'Expert guidance on career planning, resume building, interview preparation, and industry insights from HR professionals.',
      date: '2024-02-25',
      time: '11:00',
      endTime: '13:00',
      location: 'Seminar Hall B',
      image: '/api/placeholder/400/250',
      category: 'career',
      organizer: 'Career Development Cell',
      capacity: 200,
      registrationCount: 156,
      price: 0,
      tags: ['career', 'guidance', 'resume', 'interview', 'professional'],
      rating: 4.6,
      reviews: 92,
      featured: false,
      trending: false,
      registrationRequired: true,
      registrationLink: 'https://forms.gle/career-seminar',
      contactEmail: 'career@college.edu',
      prerequisites: [],
      rewards: ['Career Guidance', 'Resume Templates', 'Interview Tips']
    },
    {
      id: '6',
      title: 'Photography Competition - Moments',
      description: 'Showcase your photography skills in various categories including nature, portrait, and street photography.',
      date: '2024-02-28',
      time: '15:00',
      endTime: '17:00',
      location: 'Art Gallery',
      image: '/api/placeholder/400/250',
      category: 'competition',
      organizer: 'Photography Club',
      capacity: 100,
      registrationCount: 67,
      price: 75,
      tags: ['photography', 'competition', 'art', 'creative'],
      rating: 4.4,
      reviews: 41,
      featured: false,
      trending: false,
      registrationRequired: true,
      registrationLink: 'https://forms.gle/photo-competition',
      contactEmail: 'photo.club@college.edu',
      prerequisites: ['Basic Photography Knowledge'],
      rewards: ['Cash Prizes', 'Certificates', 'Portfolio Feature']
    },
    {
      id: '7',
      title: 'Entrepreneurship Bootcamp',
      description: 'Intensive 3-day bootcamp covering business planning, funding strategies, and startup ecosystem insights.',
      date: '2024-03-01',
      time: '09:00',
      endTime: '17:00',
      location: 'Business School',
      image: '/api/placeholder/400/250',
      category: 'workshop',
      organizer: 'Entrepreneurship Cell',
      capacity: 60,
      registrationCount: 48,
      price: 200,
      tags: ['entrepreneurship', 'business', 'startup', 'funding'],
      rating: 4.8,
      reviews: 34,
      featured: true,
      trending: true,
      registrationRequired: true,
      registrationLink: 'https://forms.gle/entrepreneur-bootcamp',
      contactEmail: 'entrepreneur@college.edu',
      prerequisites: ['Business Idea (Optional)', 'Passion for Innovation'],
      rewards: ['Business Plan Template', 'Mentorship', 'Networking']
    },
    {
      id: '8',
      title: 'Music Night - Unplugged',
      description: 'An evening of soulful music featuring acoustic performances by talented students and guest artists.',
      date: '2024-03-05',
      time: '19:00',
      endTime: '22:00',
      location: 'Amphitheater',
      image: '/api/placeholder/400/250',
      category: 'cultural',
      organizer: 'Music Society',
      capacity: 300,
      registrationCount: 210,
      price: 80,
      tags: ['music', 'acoustic', 'performance', 'entertainment'],
      rating: 4.7,
      reviews: 115,
      featured: false,
      trending: false,
      registrationRequired: true,
      registrationLink: 'https://forms.gle/music-night',
      contactEmail: 'music@college.edu',
      prerequisites: [],
      rewards: ['Musical Experience', 'Refreshments', 'Open Mic Opportunity']
    }
  ]);

  const [userPreferences] = useState<UserPreferences>({
    favoriteCategories: ['workshop', 'career'],
    interests: ['technology', 'AI', 'programming', 'innovation'],
    notificationSettings: {
      newEvents: true,
      reminders: true,
      recommendations: true
    }
  });

  const categories = [
    { id: 'all', name: 'All Events', icon: Globe, count: events.length },
    { id: 'academic', name: 'Academic', icon: GraduationCap, count: events.filter(e => e.category === 'academic').length },
    { id: 'cultural', name: 'Cultural', icon: Music, count: events.filter(e => e.category === 'cultural').length },
    { id: 'sports', name: 'Sports', icon: Gamepad2, count: events.filter(e => e.category === 'sports').length },
    { id: 'workshop', name: 'Workshops', icon: Book, count: events.filter(e => e.category === 'workshop').length },
    { id: 'career', name: 'Career', icon: Briefcase, count: events.filter(e => e.category === 'career').length },
    { id: 'competition', name: 'Competitions', icon: Award, count: events.filter(e => e.category === 'competition').length },
    { id: 'social', name: 'Social', icon: Coffee, count: events.filter(e => e.category === 'social').length }
  ];

  const filteredEvents = events.filter(event => {
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         event.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'popularity':
        return (b.registrationCount || 0) - (a.registrationCount || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'trending':
        return Number(b.trending) - Number(a.trending);
      default:
        return 0;
    }
  });

  const featuredEvents = events.filter(event => event.featured);
  const trendingEvents = events.filter(event => event.trending);
  const recommendedEvents = events.filter(event => 
    event.tags.some(tag => userPreferences.interests.includes(tag)) ||
    userPreferences.favoriteCategories.includes(event.category)
  );

  const registerForEvent = (eventId: string) => {
    const existingRegistration = registeredEvents.find(reg => reg.eventId === eventId);
    
    if (existingRegistration) {
      // Unregister
      setRegisteredEvents(registeredEvents.filter(reg => reg.eventId !== eventId));
    } else {
      // Register
      const newRegistration: RegisteredEvent = {
        eventId,
        registeredAt: new Date().toISOString(),
        status: 'registered',
        reminder: true
      };
      setRegisteredEvents([...registeredEvents, newRegistration]);
    }
  };

  const isRegistered = (eventId: string) => {
    return registeredEvents.some(reg => reg.eventId === eventId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return GraduationCap;
      case 'cultural': return Music;
      case 'sports': return Gamepad2;
      case 'workshop': return Book;
      case 'career': return Briefcase;
      case 'competition': return Award;
      case 'social': return Coffee;
      default: return Globe;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'text-blue-600 bg-blue-100';
      case 'cultural': return 'text-purple-600 bg-purple-100';
      case 'sports': return 'text-green-600 bg-green-100';
      case 'workshop': return 'text-orange-600 bg-orange-100';
      case 'career': return 'text-indigo-600 bg-indigo-100';
      case 'competition': return 'text-red-600 bg-red-100';
      case 'social': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Header component
  const Header = () => (
    <div className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Discovery</h1>
            <p className="text-gray-600 mt-1">Discover exciting events, workshops, and activities happening on campus</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title="Toggle filters"
            >
              <Filter size={20} />
            </button>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="Notifications">
              <Bell size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Tab navigation
  const TabNavigation = () => (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {[
            { id: 'browse', label: 'Browse Events', icon: Search },
            { id: 'registered', label: 'My Events', icon: Bookmark },
            { id: 'calendar', label: 'Event Calendar', icon: Calendar },
            { id: 'recommendations', label: 'For You', icon: Star }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'browse' | 'registered' | 'calendar' | 'recommendations')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Filter panel
  const FilterPanel = () => (
    showFilters && (
      <div className="bg-white border-b shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'popularity' | 'rating' | 'trending')}
                className="w-full p-2 border border-gray-300 rounded-lg"
                title="Sort events by"
              >
                <option value="date">Date</option>
                <option value="popularity">Popularity</option>
                <option value="rating">Rating</option>
                <option value="trending">Trending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View Mode</label>
              <div className="flex space-x-2">
                {[
                  { id: 'grid', label: 'Grid' },
                  { id: 'list', label: 'List' },
                  { id: 'calendar', label: 'Calendar' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as 'grid' | 'list' | 'calendar')}
                    className={`px-3 py-2 rounded border text-sm ${
                      viewMode === mode.id
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg" title="Filter by price">
                <option value="">All Prices</option>
                <option value="free">Free Events</option>
                <option value="paid">Paid Events</option>
                <option value="under100">Under ₹100</option>
                <option value="under500">Under ₹500</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg" title="Filter by date">
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    )
  );

  // Event card component
  const EventCard = ({ event, compact = false }: { event: Event; compact?: boolean }) => {
    const registered = isRegistered(event.id);
    
    return (
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden border hover:shadow-xl transition-shadow ${compact ? 'flex' : ''}`}>
        <div className={`relative ${compact ? 'w-48 flex-shrink-0' : ''}`}>
          <Image
            src={event.image}
            alt={event.title}
            width={400}
            height={compact ? 150 : 250}
            className={`w-full object-cover ${compact ? 'h-full' : 'h-48'}`}
          />
          <div className="absolute top-2 left-2 flex space-x-2">
            {event.featured && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Featured
              </span>
            )}
            {event.trending && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center space-x-1">
                <TrendingUp size={12} />
                <span>Trending</span>
              </span>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <button
              onClick={() => registerForEvent(event.id)}
              className={`p-2 rounded-full shadow ${registered ? 'bg-green-500 text-white' : 'bg-white text-gray-600'}`}
              title={registered ? "Registered" : "Register for event"}
            >
              {registered ? <Check size={16} /> : <Plus size={16} />}
            </button>
          </div>
        </div>
        
        <div className={`p-6 ${compact ? 'flex-1' : ''}`}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                {event.category}
              </span>
              {event.price === 0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Free
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ₹{event.price}
                </span>
              )}
            </div>
            {event.rating && (
              <div className="flex items-center space-x-1">
                <Star size={14} className="text-yellow-500 fill-current" />
                <span className="text-sm text-gray-600">{event.rating}</span>
              </div>
            )}
          </div>
          
          <h3 className="font-semibold text-gray-900 text-lg mb-2">{event.title}</h3>
          <p className={`text-gray-600 text-sm mb-3 ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {event.description}
          </p>
          
          <div className={`space-y-2 mb-4 text-sm text-gray-500 ${compact ? 'space-y-1' : ''}`}>
            <div className="flex items-center space-x-2">
              <Calendar size={14} />
              <span>{new Date(event.date).toLocaleDateString()}</span>
              <Clock size={14} className="ml-2" />
              <span>{event.time}{event.endTime ? ` - ${event.endTime}` : ''}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin size={14} />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users size={14} />
              <span>
                {event.registrationCount || 0}
                {event.capacity ? ` / ${event.capacity}` : ''} registered
              </span>
            </div>
          </div>
          
          <div className={`mb-4 ${compact ? 'mb-2' : ''}`}>
            <div className="flex flex-wrap gap-1">
              {event.tags.slice(0, compact ? 2 : 4).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  #{tag}
                </span>
              ))}
              {event.tags.length > (compact ? 2 : 4) && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{event.tags.length - (compact ? 2 : 4)} more
                </span>
              )}
            </div>
          </div>
          
          <div className={`flex ${compact ? 'flex-col space-y-2' : 'space-x-2'}`}>
            <button
              onClick={() => setSelectedEvent(event)}
              className={`${compact ? 'w-full' : 'flex-1'} bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm`}
            >
              View Details
            </button>
            {event.registrationRequired && event.registrationLink && (
              <button
                onClick={() => window.open(event.registrationLink, '_blank')}
                className={`${compact ? 'w-full' : 'flex-1'} bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm flex items-center justify-center space-x-1`}
              >
                <span>Register</span>
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Browse events view
  const BrowseEventsView = () => (
    <div className="space-y-6">
      <FilterPanel />
      
      {/* Category filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 py-4 overflow-x-auto">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full border whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                <span>{category.name}</span>
                <span className="text-xs bg-white px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured events section */}
      {featuredEvents.length > 0 && selectedCategory === 'all' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Featured Events</h2>
            <button className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
              <span>View All</span>
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredEvents.slice(0, 2).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Main events list */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory === 'all' ? 'All Events' : categories.find(c => c.id === selectedCategory)?.name}
          </h2>
          <div className="text-sm text-gray-500">
            {filteredEvents.length} events found
          </div>
        </div>
        
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
        
        {viewMode === 'list' && (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} compact={true} />
            ))}
          </div>
        )}
        
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Registered events view
  const RegisteredEventsView = () => {
    const myEvents = events.filter(event => isRegistered(event.id));
    
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Registered Events</h2>
        
        {myEvents.length > 0 ? (
          <div className="space-y-4">
            {myEvents.map(event => {
              const registration = registeredEvents.find(reg => reg.eventId === event.id);
              return (
                <div key={event.id} className="bg-white rounded-xl shadow-lg p-6 border">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-4">
                      <Image
                        src={event.image}
                        alt={event.title}
                        width={100}
                        height={100}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{event.title}</h3>
                        <p className="text-gray-600 mb-2">{event.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar size={14} />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock size={14} />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin size={14} />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        registration?.status === 'registered' ? 'bg-green-100 text-green-800' :
                        registration?.status === 'attended' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {registration?.status || 'registered'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Registered: {registration ? new Date(registration.registeredAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      {event.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="text-blue-600 text-sm hover:text-blue-800"
                      >
                        View Details
                      </button>
                      <button className="text-yellow-600 text-sm hover:text-yellow-800 flex items-center space-x-1">
                        <Bell size={14} />
                        <span>Remind Me</span>
                      </button>
                      <button
                        onClick={() => registerForEvent(event.id)}
                        className="text-red-600 text-sm hover:text-red-800"
                      >
                        Unregister
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No registered events</h3>
            <p className="mt-1 text-sm text-gray-500">Events you register for will appear here.</p>
            <button
              onClick={() => setActiveTab('browse')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Browse Events
            </button>
          </div>
        )}
      </div>
    );
  };

  // Recommendations view
  const RecommendationsView = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
      
      {/* Trending events */}
      {trendingEvents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="text-red-500" size={20} />
            <h3 className="text-xl font-semibold text-gray-900">Trending Now</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingEvents.slice(0, 3).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
      
      {/* Personalized recommendations */}
      {recommendedEvents.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Star className="text-yellow-500" size={20} />
            <h3 className="text-xl font-semibold text-gray-900">Based on Your Interests</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedEvents.slice(0, 6).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
      
      {recommendedEvents.length === 0 && (
        <div className="text-center py-12">
          <Star className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Building recommendations</h3>
          <p className="mt-1 text-sm text-gray-500">Register for events to get personalized recommendations.</p>
        </div>
      )}
    </div>
  );

  // Event calendar view
  const EventCalendarView = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Calendar</h2>
      
      <div className="bg-white rounded-xl shadow-lg border p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50 rounded">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }, (_, i) => {
            const date = new Date(2024, 1, i - 6); // February 2024 example
            const dayEvents = events.filter(event => 
              new Date(event.date).toDateString() === date.toDateString()
            );
            
            return (
              <div key={i} className="min-h-[80px] p-2 border border-gray-200 rounded">
                <div className="text-sm text-gray-600 mb-1">{date.getDate()}</div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`text-xs p-1 rounded cursor-pointer truncate ${getCategoryColor(event.category)}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Event details modal
  const EventDetailsModal = () => (
    selectedEvent && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-3xl font-bold text-gray-900">{selectedEvent.title}</h2>
              <div className="flex space-x-2">
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="Share event">
                  <Share2 size={20} />
                </button>
                <button
                  onClick={() => registerForEvent(selectedEvent.id)}
                  className={`p-2 rounded-lg ${
                    isRegistered(selectedEvent.id) 
                      ? 'bg-green-500 text-white' 
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                  title={isRegistered(selectedEvent.id) ? "Registered" : "Register for event"}
                >
                  {isRegistered(selectedEvent.id) ? <Check size={20} /> : <Heart size={20} />}
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Close details"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <Image
              src={selectedEvent.image}
              alt={selectedEvent.title}
              width={800}
              height={400}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">About This Event</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                </div>
                
                {selectedEvent.prerequisites && selectedEvent.prerequisites.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Prerequisites</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {selectedEvent.prerequisites.map(prereq => (
                        <li key={prereq}>{prereq}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedEvent.rewards && selectedEvent.rewards.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">What You&apos;ll Get</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedEvent.rewards.map(reward => (
                        <div key={reward} className="flex items-center space-x-2">
                          <Award size={16} className="text-yellow-500" />
                          <span className="text-gray-600">{reward}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="text-blue-500 mt-1" size={18} />
                      <div>
                        <div className="font-medium">{new Date(selectedEvent.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600">{selectedEvent.time}{selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ''}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MapPin className="text-red-500 mt-1" size={18} />
                      <div>
                        <div className="font-medium">{selectedEvent.location}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Users className="text-green-500 mt-1" size={18} />
                      <div>
                        <div className="font-medium">
                          {selectedEvent.registrationCount || 0} registered
                        </div>
                        {selectedEvent.capacity && (
                          <div className="text-sm text-gray-600">
                            {selectedEvent.capacity - (selectedEvent.registrationCount || 0)} spots left
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Tag className="text-purple-500 mt-1" size={18} />
                      <div>
                        <div className="font-medium">
                          {selectedEvent.price === 0 ? 'Free' : `₹${selectedEvent.price}`}
                        </div>
                        <div className="text-sm text-gray-600">Entry fee</div>
                      </div>
                    </div>
                    
                    {selectedEvent.rating && (
                      <div className="flex items-start space-x-3">
                        <Star className="text-yellow-500 mt-1" size={18} />
                        <div>
                          <div className="font-medium">{selectedEvent.rating}/5.0</div>
                          <div className="text-sm text-gray-600">
                            Based on {selectedEvent.reviews} reviews
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizer</h3>
                  <div className="space-y-2">
                    <div className="font-medium">{selectedEvent.organizer}</div>
                    {selectedEvent.contactEmail && (
                      <div className="text-sm text-gray-600">{selectedEvent.contactEmail}</div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  {selectedEvent.registrationRequired && selectedEvent.registrationLink && (
                    <button
                      onClick={() => window.open(selectedEvent.registrationLink, '_blank')}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                    >
                      <span>Register Now</span>
                      <ExternalLink size={16} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => registerForEvent(selectedEvent.id)}
                    className={`w-full py-3 rounded-lg border ${
                      isRegistered(selectedEvent.id)
                        ? 'bg-green-100 border-green-300 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {isRegistered(selectedEvent.id) ? 'Added to My Events' : 'Add to My Events'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TabNavigation />
      
      {activeTab === 'browse' && <BrowseEventsView />}
      {activeTab === 'registered' && <RegisteredEventsView />}
      {activeTab === 'calendar' && <EventCalendarView />}
      {activeTab === 'recommendations' && <RecommendationsView />}
      
      <EventDetailsModal />
    </div>
  );
};

export default EventDiscoveryPage;
