'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { 
  MapPin, 
  Search, 
  Filter,
  Route,
  Clock,
  MapIcon,
  Car,
  Bike,
  GraduationCap,
  Utensils,
  Dumbbell,
  Car as ParkingIcon,
  Wifi,
  Heart,
  Phone,
  Users,
  Calendar,
  Star,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Home,
  Target,
  Share2
} from 'lucide-react';

// Type definitions
interface Location {
  id: string;
  name: string;
  description: string;
  category: 'academic' | 'dining' | 'recreation' | 'services' | 'parking' | 'hostel' | 'admin';
  coordinates: { lat: number; lng: number };
  floor?: number;
  building?: string;
  openHours?: string;
  contact?: string;
  amenities: string[];
  image: string;
  accessibility: boolean;
  rating?: number;
  reviews?: number;
  isIndoor: boolean;
}

interface NavigationRoute {
  id: string;
  from: string;
  to: string;
  distance: string;
  estimatedTime: string;
  mode: 'walking' | 'driving' | 'cycling';
  directions: string[];
  landmarks: string[];
}

interface SavedPlace {
  id: string;
  name: string;
  location: Location;
  addedAt: string;
  category: 'favorite' | 'recent' | 'bookmark';
}

const CampusNavigationPage = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'search' | 'favorites' | 'directions'>('map');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<NavigationRoute | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapView, setMapView] = useState<'satellite' | 'map' | 'hybrid'>('map');
  const [navigationMode, setNavigationMode] = useState<'walking' | 'driving' | 'cycling'>('walking');
  const mapRef = useRef<HTMLDivElement>(null);

  // Sample campus locations data
  const [locations] = useState<Location[]>([
    // Academic Buildings
    {
      id: '1',
      name: 'Computer Science Department',
      description: 'Main computer science building with labs, classrooms, and faculty offices',
      category: 'academic',
      coordinates: { lat: 19.0760, lng: 72.8777 },
      floor: 3,
      building: 'CS Block',
      openHours: '8:00 AM - 8:00 PM',
      contact: 'cs@college.edu',
      amenities: ['WiFi', 'Computer Labs', 'Projectors', 'AC', 'Faculty Offices'],
      image: '/api/placeholder/400/250',
      accessibility: true,
      rating: 4.5,
      reviews: 120,
      isIndoor: true
    },
    {
      id: '2',
      name: 'Central Library',
      description: 'Main campus library with extensive collection and study areas',
      category: 'academic',
      coordinates: { lat: 19.0765, lng: 72.8780 },
      floor: 4,
      building: 'Library Block',
      openHours: '7:00 AM - 11:00 PM',
      contact: 'library@college.edu',
      amenities: ['Silent Study Area', 'Group Discussion Rooms', 'Digital Library', 'Printing', 'AC'],
      image: '/api/placeholder/400/250',
      accessibility: true,
      rating: 4.7,
      reviews: 200,
      isIndoor: true
    },
    {
      id: '3',
      name: 'Lecture Hall Complex',
      description: 'Large auditoriums and lecture halls for events and classes',
      category: 'academic',
      coordinates: { lat: 19.0770, lng: 72.8775 },
      building: 'LH Block',
      openHours: '8:00 AM - 6:00 PM',
      amenities: ['Audio Visual Equipment', 'AC', 'Stage', 'Sound System'],
      image: '/api/placeholder/400/250',
      accessibility: true,
      rating: 4.3,
      reviews: 85,
      isIndoor: true
    },

    // Dining
    {
      id: '4',
      name: 'Main Canteen',
      description: 'Primary dining facility with variety of food options',
      category: 'dining',
      coordinates: { lat: 19.0762, lng: 72.8782 },
      building: 'Canteen Block',
      openHours: '7:00 AM - 9:00 PM',
      contact: 'canteen@college.edu',
      amenities: ['Multiple Counters', 'Seating Area', 'Vegetarian Options', 'Payment Cards'],
      image: '/api/placeholder/400/250',
      accessibility: true,
      rating: 4.1,
      reviews: 350,
      isIndoor: true
    },
    {
      id: '5',
      name: 'Food Court',
      description: 'Modern food court with various food stalls and cuisines',
      category: 'dining',
      coordinates: { lat: 19.0758, lng: 72.8785 },
      building: 'Student Center',
      openHours: '8:00 AM - 10:00 PM',
      amenities: ['Multiple Cuisines', 'Outdoor Seating', 'Fast Food', 'Beverages'],
      image: '/api/placeholder/400/250',
      accessibility: true,
      rating: 4.4,
      reviews: 180,
      isIndoor: false
    },

    // Recreation
    {
      id: '6',
      name: 'Sports Complex',
      description: 'Complete sports facility with courts and gymnasium',
      category: 'recreation',
      coordinates: { lat: 19.0755, lng: 72.8770 },
      building: 'Sports Block',
      openHours: '6:00 AM - 9:00 PM',
      contact: 'sports@college.edu',
      amenities: ['Basketball Court', 'Badminton Courts', 'Gymnasium', 'Changing Rooms'],
      image: '/api/placeholder/400/250',
      accessibility: true,
      rating: 4.6,
      reviews: 95,
      isIndoor: true
    },
    {
      id: '7',
      name: 'Swimming Pool',
      description: 'Olympic size swimming pool with modern facilities',
      category: 'recreation',
      coordinates: { lat: 19.0753, lng: 72.8768 },
      openHours: '6:00 AM - 8:00 PM',
      amenities: ['Olympic Pool', 'Changing Rooms', 'Shower Facilities', 'Lifeguard'],
      image: '/api/placeholder/400/250',
      accessibility: false,
      rating: 4.2,
      reviews: 60,
      isIndoor: false
    },

    // Services
    {
      id: '8',
      name: 'Administrative Office',
      description: 'Main administrative building for student services',
      category: 'services',
      coordinates: { lat: 19.0768, lng: 72.8778 },
      floor: 2,
      building: 'Admin Block',
      openHours: '9:00 AM - 5:00 PM',
      contact: 'admin@college.edu',
      amenities: ['Student Services', 'Admission Office', 'Accounts', 'Document Processing'],
      image: '/api/placeholder/400/250',
      accessibility: true,
      rating: 3.8,
      reviews: 150,
      isIndoor: true
    },
    {
      id: '9',
      name: 'Medical Center',
      description: 'Campus health center with medical facilities',
      category: 'services',
      coordinates: { lat: 19.0764, lng: 72.8772 },
      building: 'Health Center',
      openHours: '8:00 AM - 6:00 PM',
      contact: 'health@college.edu',
      amenities: ['Emergency Care', 'Pharmacy', 'Doctor Consultation', 'First Aid'],
      image: '/api/placeholder/400/250',
      accessibility: true,
      rating: 4.0,
      reviews: 80,
      isIndoor: true
    },

    // Parking
    {
      id: '10',
      name: 'Main Parking Area',
      description: 'Primary parking facility for students and faculty',
      category: 'parking',
      coordinates: { lat: 19.0750, lng: 72.8775 },
      openHours: '24/7',
      amenities: ['CCTV Security', 'Two Wheeler Parking', 'Car Parking', 'Security Guard'],
      image: '/api/placeholder/400/250',
      accessibility: true,
      rating: 3.5,
      reviews: 45,
      isIndoor: false
    },

    // Hostels
    {
      id: '11',
      name: 'Boys Hostel Block A',
      description: 'Residential facility for male students',
      category: 'hostel',
      coordinates: { lat: 19.0745, lng: 72.8785 },
      building: 'Hostel A',
      openHours: '24/7',
      contact: 'hostel.boys@college.edu',
      amenities: ['WiFi', 'Common Room', 'Mess', 'Laundry', 'Security'],
      image: '/api/placeholder/400/250',
      accessibility: true,
      rating: 3.9,
      reviews: 120,
      isIndoor: true
    },
    {
      id: '12',
      name: 'Girls Hostel Block B',
      description: 'Residential facility for female students',
      category: 'hostel',
      coordinates: { lat: 19.0748, lng: 72.8788 },
      building: 'Hostel B',
      openHours: '24/7',
      contact: 'hostel.girls@college.edu',
      amenities: ['WiFi', 'Common Room', 'Mess', 'Laundry', 'Security', 'Study Room'],
      image: '/api/placeholder/400/250',
      accessibility: true,
      rating: 4.1,
      reviews: 90,
      isIndoor: true
    }
  ]);

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([
    {
      id: '1',
      name: 'My Classroom',
      location: locations[0],
      addedAt: '2024-01-15',
      category: 'favorite'
    },
    {
      id: '2',
      name: 'Favorite Study Spot',
      location: locations[1],
      addedAt: '2024-01-20',
      category: 'bookmark'
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Locations', icon: MapIcon, count: locations.length },
    { id: 'academic', name: 'Academic', icon: GraduationCap, count: locations.filter(l => l.category === 'academic').length },
    { id: 'dining', name: 'Dining', icon: Utensils, count: locations.filter(l => l.category === 'dining').length },
    { id: 'recreation', name: 'Recreation', icon: Dumbbell, count: locations.filter(l => l.category === 'recreation').length },
    { id: 'services', name: 'Services', icon: Heart, count: locations.filter(l => l.category === 'services').length },
    { id: 'parking', name: 'Parking', icon: ParkingIcon, count: locations.filter(l => l.category === 'parking').length },
    { id: 'hostel', name: 'Hostels', icon: Home, count: locations.filter(l => l.category === 'hostel').length }
  ];

  const navigationModes = [
    { id: 'walking', name: 'Walking', icon: Users, avgSpeed: '5 km/h' },
    { id: 'cycling', name: 'Cycling', icon: Bike, avgSpeed: '15 km/h' },
    { id: 'driving', name: 'Driving', icon: Car, avgSpeed: '30 km/h' }
  ];

  const filteredLocations = locations.filter(location => {
    const matchesCategory = selectedCategory === 'all' || location.category === selectedCategory;
    const matchesSearch = location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         location.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         location.building?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const generateRoute = (from: Location, to: Location) => {
    // Simulate route generation
    const distance = (Math.random() * 2 + 0.1).toFixed(1);
    const baseTime = parseFloat(distance) * (navigationMode === 'walking' ? 12 : navigationMode === 'cycling' ? 4 : 2);
    const estimatedTime = Math.ceil(baseTime);

    const route: NavigationRoute = {
      id: Date.now().toString(),
      from: from.name,
      to: to.name,
      distance: `${distance} km`,
      estimatedTime: `${estimatedTime} min`,
      mode: navigationMode,
      directions: [
        `Start from ${from.name}`,
        'Head towards the main pathway',
        'Turn right at the library junction',
        'Continue straight for 200m',
        'Turn left at the canteen',
        `Arrive at ${to.name}`
      ],
      landmarks: ['Library', 'Main Canteen', 'Admin Building']
    };

    setCurrentRoute(route);
  };

  const toggleFavorite = (location: Location) => {
    const existingIndex = savedPlaces.findIndex(place => place.location.id === location.id);
    
    if (existingIndex >= 0) {
      setSavedPlaces(savedPlaces.filter(place => place.location.id !== location.id));
    } else {
      const newSavedPlace: SavedPlace = {
        id: Date.now().toString(),
        name: location.name,
        location,
        addedAt: new Date().toISOString().split('T')[0],
        category: 'favorite'
      };
      setSavedPlaces([newSavedPlace, ...savedPlaces]);
    }
  };

  const isFavorite = (locationId: string) => {
    return savedPlaces.some(place => place.location.id === locationId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'academic': return GraduationCap;
      case 'dining': return Utensils;
      case 'recreation': return Dumbbell;
      case 'services': return Heart;
      case 'parking': return ParkingIcon;
      case 'hostel': return Home;
      default: return MapIcon;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academic': return 'text-blue-600 bg-blue-100';
      case 'dining': return 'text-orange-600 bg-orange-100';
      case 'recreation': return 'text-green-600 bg-green-100';
      case 'services': return 'text-purple-600 bg-purple-100';
      case 'parking': return 'text-gray-600 bg-gray-100';
      case 'hostel': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Header component
  const Header = () => (
    <div className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campus Navigation</h1>
            <p className="text-gray-600 mt-1">Find your way around campus with interactive maps and directions</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search locations..."
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
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
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
            { id: 'map', label: 'Interactive Map', icon: MapIcon },
            { id: 'search', label: 'Search & Browse', icon: Search },
            { id: 'favorites', label: 'Saved Places', icon: Star },
            { id: 'directions', label: 'Get Directions', icon: Route }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'map' | 'search' | 'favorites' | 'directions')}
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

  // Map controls
  const MapControls = () => (
    <div className="absolute top-4 right-4 space-y-2 z-10">
      <div className="bg-white rounded-lg shadow-lg border">
        <button
          onClick={() => setMapView('map')}
          className={`px-3 py-2 text-sm rounded-t-lg ${mapView === 'map' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Map
        </button>
        <button
          onClick={() => setMapView('satellite')}
          className={`px-3 py-2 text-sm ${mapView === 'satellite' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapView('hybrid')}
          className={`px-3 py-2 text-sm rounded-b-lg ${mapView === 'hybrid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Hybrid
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg border p-2 space-y-2">
        <button className="p-2 w-full text-gray-600 hover:bg-gray-50 rounded" title="Zoom in">
          <span className="text-lg font-bold">+</span>
        </button>
        <button className="p-2 w-full text-gray-600 hover:bg-gray-50 rounded" title="Zoom out">
          <span className="text-lg font-bold">−</span>
        </button>
        <button className="p-2 w-full text-gray-600 hover:bg-gray-50 rounded" title="Reset view">
          <RotateCcw size={16} />
        </button>
        <button className="p-2 w-full text-gray-600 hover:bg-gray-50 rounded" title="My location">
          <Target size={16} />
        </button>
      </div>
    </div>
  );

  // Interactive map view
  const InteractiveMapView = () => (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-[calc(100vh-200px)]'}`}>
      {isFullscreen && (
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => setIsFullscreen(false)}
            className="bg-white p-2 rounded-lg shadow-lg border"
            title="Exit fullscreen"
          >
            <X size={20} />
          </button>
        </div>
      )}
      
      <div
        ref={mapRef}
        className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 relative overflow-hidden"
      >
        {/* Map background */}
        <div className="absolute inset-0">
          <div className="grid grid-cols-20 grid-rows-20 h-full w-full opacity-20">
            {Array.from({ length: 400 }, (_, i) => (
              <div key={i} className="border border-gray-300"></div>
            ))}
          </div>
        </div>

        {/* Campus layout paths */}
        <svg className="absolute inset-0 w-full h-full">
          {/* Main pathways */}
          <path d="M 100 300 Q 300 200 500 300 T 900 300" stroke="#4B5563" strokeWidth="8" fill="none" opacity="0.6" />
          <path d="M 300 100 L 300 500" stroke="#4B5563" strokeWidth="6" fill="none" opacity="0.6" />
          <path d="M 600 150 L 600 450" stroke="#4B5563" strokeWidth="6" fill="none" opacity="0.6" />
          
          {/* Secondary paths */}
          <path d="M 150 200 L 850 250" stroke="#6B7280" strokeWidth="4" fill="none" opacity="0.4" />
          <path d="M 200 350 L 800 400" stroke="#6B7280" strokeWidth="4" fill="none" opacity="0.4" />
        </svg>

        {/* Location markers */}
        {filteredLocations.map((location, index) => {
          const x = 150 + (index % 6) * 150;
          const y = 150 + Math.floor(index / 6) * 120;
          const CategoryIcon = getCategoryIcon(location.category);
          
          return (
            <div
              key={location.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: x, top: y }}
              onClick={() => setSelectedLocation(location)}
            >
              <div className={`p-3 rounded-full shadow-lg border-2 border-white ${getCategoryColor(location.category)}`}>
                <CategoryIcon size={20} />
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white px-2 py-1 rounded shadow text-xs font-medium whitespace-nowrap">
                {location.name}
              </div>
            </div>
          );
        })}

        {/* Current route */}
        {currentRoute && (
          <svg className="absolute inset-0 w-full h-full">
            <path
              d="M 200 200 Q 400 150 600 200 T 800 300"
              stroke="#3B82F6"
              strokeWidth="4"
              fill="none"
              strokeDasharray="10,5"
              className="animate-pulse"
            />
            {/* Route markers */}
            <circle cx="200" cy="200" r="8" fill="#10B981" />
            <circle cx="800" cy="300" r="8" fill="#EF4444" />
          </svg>
        )}
      </div>

      <MapControls />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border p-3">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          {categories.slice(1).map(category => {
            const Icon = category.icon;
            return (
              <div key={category.id} className="flex items-center space-x-2">
                <div className={`p-1 rounded ${getCategoryColor(category.id)}`}>
                  <Icon size={12} />
                </div>
                <span>{category.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Search and browse view
  const SearchBrowseView = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {showFilters && (
        <div className="bg-white rounded-lg shadow-lg border p-4 mb-6">
          <h3 className="font-semibold mb-4">Filter Locations</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex flex-col items-center p-3 rounded-lg border ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs mt-1">{category.name}</span>
                  <span className="text-xs text-gray-500">({category.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocations.map(location => {
          const CategoryIcon = getCategoryIcon(location.category);
          
          return (
            <div key={location.id} className="bg-white rounded-xl shadow-lg overflow-hidden border">
              <div className="relative">
                <Image
                  src={location.image}
                  alt={location.name}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 left-2 flex space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(location.category)}`}>
                    {location.category}
                  </span>
                  {location.accessibility && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Accessible
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleFavorite(location)}
                  className="absolute top-2 right-2 p-2 bg-white rounded-full shadow"
                  title={isFavorite(location.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star size={16} className={isFavorite(location.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg">{location.name}</h3>
                  {location.rating && (
                    <div className="flex items-center space-x-1">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      <span className="text-sm text-gray-600">{location.rating}</span>
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{location.description}</p>
                
                <div className="space-y-2 mb-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <MapPin size={14} />
                    <span>{location.building ? `${location.building}, ` : ''}{location.floor ? `Floor ${location.floor}` : 'Ground Level'}</span>
                  </div>
                  {location.openHours && (
                    <div className="flex items-center space-x-2">
                      <Clock size={14} />
                      <span>{location.openHours}</span>
                    </div>
                  )}
                  {location.contact && (
                    <div className="flex items-center space-x-2">
                      <Phone size={14} />
                      <span>{location.contact}</span>
                    </div>
                  )}
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Amenities:</h4>
                  <div className="flex flex-wrap gap-1">
                    {location.amenities.slice(0, 3).map(amenity => (
                      <span key={amenity} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {amenity}
                      </span>
                    ))}
                    {location.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{location.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedLocation(location)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      // Add to recent places and switch to directions
                      setActiveTab('directions');
                    }}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm"
                  >
                    Get Directions
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredLocations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No locations found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );

  // Saved places view
  const SavedPlacesView = () => (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Saved Places</h2>
      
      {savedPlaces.length > 0 ? (
        <div className="space-y-4">
          {savedPlaces.map(savedPlace => (
            <div key={savedPlace.id} className="bg-white rounded-xl shadow-lg p-6 border">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${getCategoryColor(savedPlace.location.category)}`}>
                    {React.createElement(getCategoryIcon(savedPlace.location.category), { size: 24 })}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{savedPlace.name}</h3>
                    <p className="text-gray-600">{savedPlace.location.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin size={14} />
                        <span>{savedPlace.location.building || 'Campus Location'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>Added {new Date(savedPlace.addedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  savedPlace.category === 'favorite' ? 'bg-yellow-100 text-yellow-800' :
                  savedPlace.category === 'recent' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {savedPlace.category}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {savedPlace.location.openHours && (
                    <span>Open: {savedPlace.location.openHours}</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedLocation(savedPlace.location)}
                    className="text-blue-600 text-sm hover:text-blue-800"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('directions');
                      // Could set this as destination
                    }}
                    className="text-green-600 text-sm hover:text-green-800"
                  >
                    Get Directions
                  </button>
                  <button
                    onClick={() => setSavedPlaces(savedPlaces.filter(p => p.id !== savedPlace.id))}
                    className="text-red-600 text-sm hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Star className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No saved places yet</h3>
          <p className="mt-1 text-sm text-gray-500">Save your favorite campus locations for quick access.</p>
          <button
            onClick={() => setActiveTab('search')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Locations
          </button>
        </div>
      )}
    </div>
  );

  // Directions view
  const DirectionsView = () => {
    const [fromLocation, setFromLocation] = useState<string>('');
    const [toLocation, setToLocation] = useState<string>('');

    const handleGetDirections = () => {
      const from = locations.find(l => l.id === fromLocation);
      const to = locations.find(l => l.id === toLocation);
      
      if (from && to) {
        generateRoute(from, to);
      }
    };

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Get Directions</h2>
        
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <select
                value={fromLocation}
                onChange={(e) => setFromLocation(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                title="Select starting location"
              >
                <option value="">Select starting location</option>
                <option value="current">📍 My Current Location</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <select
                value={toLocation}
                onChange={(e) => setToLocation(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                title="Select destination"
              >
                <option value="">Select destination</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-4">
              <span className="text-sm font-medium text-gray-700">Travel Mode:</span>
              {navigationModes.map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setNavigationMode(mode.id as 'walking' | 'driving' | 'cycling')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                      navigationMode === mode.id
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="text-sm">{mode.name}</span>
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={handleGetDirections}
              disabled={!fromLocation || !toLocation}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Directions
            </button>
          </div>
        </div>
        
        {currentRoute && (
          <div className="bg-white rounded-xl shadow-lg border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentRoute.from} → {currentRoute.to}
                </h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Route size={14} />
                    <span>{currentRoute.distance}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{currentRoute.estimatedTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {React.createElement(
                      navigationModes.find(m => m.id === currentRoute.mode)?.icon || Users,
                      { size: 14 }
                    )}
                    <span className="capitalize">{currentRoute.mode}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="Share route">
                  <Share2 size={16} />
                </button>
                <button
                  onClick={() => setCurrentRoute(null)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Clear route"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Step-by-step directions:</h4>
                <div className="space-y-2">
                  {currentRoute.directions.map((direction, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-700">{direction}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Landmarks to look for:</h4>
                <div className="flex flex-wrap gap-2">
                  {currentRoute.landmarks.map(landmark => (
                    <span key={landmark} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {landmark}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Location details modal
  const LocationDetailsModal = () => (
    selectedLocation && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedLocation.name}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleFavorite(selectedLocation)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title={isFavorite(selectedLocation.id) ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star size={20} className={isFavorite(selectedLocation.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'} />
                </button>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Close details"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <Image
              src={selectedLocation.image}
              alt={selectedLocation.name}
              width={600}
              height={300}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{selectedLocation.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Location Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Building:</span>
                      <span>{selectedLocation.building || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Floor:</span>
                      <span>{selectedLocation.floor ? `Floor ${selectedLocation.floor}` : 'Ground Level'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span className="capitalize">{selectedLocation.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accessibility:</span>
                      <span className={selectedLocation.accessibility ? 'text-green-600' : 'text-red-600'}>
                        {selectedLocation.accessibility ? 'Accessible' : 'Not Accessible'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Contact & Hours</h3>
                  <div className="space-y-2 text-sm">
                    {selectedLocation.openHours && (
                      <div>
                        <span className="text-gray-600">Hours:</span>
                        <div>{selectedLocation.openHours}</div>
                      </div>
                    )}
                    {selectedLocation.contact && (
                      <div>
                        <span className="text-gray-600">Contact:</span>
                        <div>{selectedLocation.contact}</div>
                      </div>
                    )}
                    {selectedLocation.rating && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Rating:</span>
                        <div className="flex items-center space-x-1">
                          <Star size={14} className="text-yellow-500 fill-current" />
                          <span>{selectedLocation.rating}</span>
                          <span className="text-gray-500">({selectedLocation.reviews} reviews)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Amenities & Facilities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedLocation.amenities.map(amenity => (
                    <div key={amenity} className="flex items-center space-x-2 text-sm">
                      <Wifi size={14} className="text-green-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedLocation(null);
                  setActiveTab('directions');
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
              >
                Get Directions
              </button>
              <button
                onClick={() => setSelectedLocation(null)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
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
      
      {activeTab === 'map' && <InteractiveMapView />}
      {activeTab === 'search' && <SearchBrowseView />}
      {activeTab === 'favorites' && <SavedPlacesView />}
      {activeTab === 'directions' && <DirectionsView />}
      
      <LocationDetailsModal />
    </div>
  );
};

export default CampusNavigationPage;
