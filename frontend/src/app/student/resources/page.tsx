'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Search, 
  Filter,
  Monitor,
  Microscope,
  Wifi,
  Car,
  Home,
  Building,
  Gamepad2,
  Book,
  Coffee,
  Plus,
  X,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Type definitions
interface Resource {
  id: string;
  name: string;
  description: string;
  category: 'lab' | 'room' | 'equipment' | 'facility' | 'vehicle';
  capacity: number;
  location: string;
  image: string;
  amenities: string[];
  hourlyRate?: number;
  availability: boolean;
  rules: string[];
  contact: string;
}

interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  attendees: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'cancelled';
  bookedBy: string;
  contactNumber: string;
  specialRequirements?: string;
  totalCost: number;
  createdAt: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  bookedBy?: string;
}

const ResourceBookingPage = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings' | 'calendar'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Sample resources data
  const [resources] = useState<Resource[]>([
    // Computer Labs
    {
      id: '1',
      name: 'Computer Science Lab A',
      description: 'High-performance computing lab with latest software development tools and IDEs',
      category: 'lab',
      capacity: 40,
      location: 'CS Building, 3rd Floor, Room 301',
      image: '/api/placeholder/400/250',
      amenities: ['40 Desktop PCs', 'Projector', 'Whiteboard', 'Air Conditioning', 'High-speed Internet'],
      hourlyRate: 100,
      availability: true,
      rules: [
        'Food and drinks not allowed',
        'Maintain silence during sessions',
        'Report technical issues immediately',
        'Clean workspace before leaving'
      ],
      contact: 'lab.coordinator@college.edu'
    },
    {
      id: '2',
      name: 'AI/ML Research Lab',
      description: 'Specialized lab with GPU clusters for machine learning and artificial intelligence research',
      category: 'lab',
      capacity: 20,
      location: 'CS Building, 4th Floor, Room 402',
      image: '/api/placeholder/400/250',
      amenities: ['20 High-end Workstations', 'GPU Clusters', 'Deep Learning Software', 'Research Tools'],
      hourlyRate: 200,
      availability: true,
      rules: [
        'Research projects only',
        'Advance booking required',
        'Faculty supervision mandatory',
        'Data backup required'
      ],
      contact: 'ai.lab@college.edu'
    },
    
    // Conference Rooms
    {
      id: '3',
      name: 'Executive Conference Room',
      description: 'Premium conference room for important meetings and presentations',
      category: 'room',
      capacity: 25,
      location: 'Admin Building, 2nd Floor, Room 201',
      image: '/api/placeholder/400/250',
      amenities: ['Smart TV', 'Video Conferencing', 'Premium Audio System', 'Climate Control', 'Coffee Service'],
      hourlyRate: 150,
      availability: true,
      rules: [
        'Professional attire required',
        'Advance booking mandatory',
        'Cancel 24 hours prior if not needed',
        'No external catering without permission'
      ],
      contact: 'admin.booking@college.edu'
    },
    {
      id: '4',
      name: 'Seminar Hall B',
      description: 'Large seminar hall suitable for lectures, workshops, and academic events',
      category: 'room',
      capacity: 100,
      location: 'Main Building, Ground Floor',
      image: '/api/placeholder/400/250',
      amenities: ['Projector', 'Audio System', 'Stage', 'Air Conditioning', 'Recording Equipment'],
      hourlyRate: 80,
      availability: true,
      rules: [
        'Academic purposes only',
        'Set up 30 minutes before event',
        'Clean up after use',
        'Report equipment issues'
      ],
      contact: 'seminar.booking@college.edu'
    },
    
    // Equipment
    {
      id: '5',
      name: 'DSLR Camera Kit',
      description: 'Professional camera equipment for photography and videography projects',
      category: 'equipment',
      capacity: 1,
      location: 'Media Center, Equipment Room',
      image: '/api/placeholder/400/250',
      amenities: ['Canon EOS R5 Camera', 'Multiple Lenses', 'Tripod', 'External Flash', 'Memory Cards'],
      hourlyRate: 50,
      availability: true,
      rules: [
        'Photography/videography experience required',
        'Security deposit mandatory',
        'Return in original condition',
        'Report damage immediately'
      ],
      contact: 'media.center@college.edu'
    },
    {
      id: '6',
      name: 'Arduino Development Kit',
      description: 'Complete IoT development kit with sensors and components',
      category: 'equipment',
      capacity: 1,
      location: 'Electronics Lab, Equipment Storage',
      image: '/api/placeholder/400/250',
      amenities: ['Arduino Boards', 'Sensors Kit', 'Breadboards', 'Jumper Wires', 'Components'],
      hourlyRate: 25,
      availability: true,
      rules: [
        'Basic electronics knowledge required',
        'Return all components',
        'Check kit contents before and after use',
        'Faculty approval for advanced projects'
      ],
      contact: 'electronics.lab@college.edu'
    },
    
    // Sports Facilities
    {
      id: '7',
      name: 'Basketball Court',
      description: 'Full-size basketball court with modern facilities',
      category: 'facility',
      capacity: 20,
      location: 'Sports Complex, Court 1',
      image: '/api/placeholder/400/250',
      amenities: ['Full Court', 'Scoreboard', 'Seating Area', 'Changing Rooms', 'Equipment Storage'],
      hourlyRate: 60,
      availability: true,
      rules: [
        'Sports shoes mandatory',
        'Maximum 20 players',
        'Clean court after use',
        'No outside equipment'
      ],
      contact: 'sports.booking@college.edu'
    },
    {
      id: '8',
      name: 'Gymnasium',
      description: 'Fully equipped gymnasium with modern fitness equipment',
      category: 'facility',
      capacity: 30,
      location: 'Sports Complex, Ground Floor',
      image: '/api/placeholder/400/250',
      amenities: ['Weight Training', 'Cardio Equipment', 'Yoga Mats', 'Sound System', 'Lockers'],
      hourlyRate: 40,
      availability: true,
      rules: [
        'Proper gym attire required',
        'Use equipment safely',
        'Wipe equipment after use',
        'No personal trainers without approval'
      ],
      contact: 'gym.booking@college.edu'
    },
    
    // Vehicles
    {
      id: '9',
      name: 'College Bus',
      description: 'AC bus for educational trips and college events',
      category: 'vehicle',
      capacity: 45,
      location: 'College Parking Area',
      image: '/api/placeholder/400/250',
      amenities: ['Air Conditioning', 'Sound System', 'First Aid Kit', 'GPS Tracking', 'Professional Driver'],
      hourlyRate: 300,
      availability: true,
      rules: [
        'Educational purposes only',
        'Faculty accompaniment required',
        'Advance booking mandatory',
        'Fuel costs additional'
      ],
      contact: 'transport.office@college.edu'
    }
  ]);

  const categories = [
    { id: 'all', name: 'All Resources', icon: Building },
    { id: 'lab', name: 'Computer Labs', icon: Monitor },
    { id: 'room', name: 'Meeting Rooms', icon: Home },
    { id: 'equipment', name: 'Equipment', icon: Microscope },
    { id: 'facility', name: 'Sports Facilities', icon: Gamepad2 },
    { id: 'vehicle', name: 'Vehicles', icon: Car }
  ];

  // Generate time slots for a day
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 8; hour <= 18; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const isBooked = Math.random() > 0.7; // Random booking simulation
      slots.push({
        time,
        available: !isBooked,
        bookedBy: isBooked ? 'Another User' : undefined
      });
    }
    return slots;
  };

  const [bookingForm, setBookingForm] = useState({
    date: selectedDate,
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: 1,
    contactNumber: '',
    specialRequirements: ''
  });

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const submitBooking = () => {
    if (!selectedResource || !bookingForm.date || !bookingForm.startTime || !bookingForm.endTime) {
      return;
    }

    const startHour = parseInt(bookingForm.startTime.split(':')[0]);
    const endHour = parseInt(bookingForm.endTime.split(':')[0]);
    const duration = endHour - startHour;
    const totalCost = (selectedResource.hourlyRate || 0) * duration;

    const newBooking: Booking = {
      id: Date.now().toString(),
      resourceId: selectedResource.id,
      resourceName: selectedResource.name,
      date: bookingForm.date,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      purpose: bookingForm.purpose,
      attendees: bookingForm.attendees,
      status: 'pending',
      bookedBy: 'Current User',
      contactNumber: bookingForm.contactNumber,
      specialRequirements: bookingForm.specialRequirements,
      totalCost,
      createdAt: new Date().toLocaleString()
    };

    setBookings([newBooking, ...bookings]);
    setShowBookingModal(false);
    setSelectedResource(null);
    setBookingForm({
      date: selectedDate,
      startTime: '',
      endTime: '',
      purpose: '',
      attendees: 1,
      contactNumber: '',
      specialRequirements: ''
    });

    // Simulate booking approval
    setTimeout(() => {
      setBookings(prevBookings => prevBookings.map(booking =>
        booking.id === newBooking.id ? { ...booking, status: 'approved' } : booking
      ));
    }, 3000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lab': return Monitor;
      case 'room': return Home;
      case 'equipment': return Microscope;
      case 'facility': return Gamepad2;
      case 'vehicle': return Car;
      default: return Building;
    }
  };

  // Header component
  const Header = () => (
    <div className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resource Booking</h1>
            <p className="text-gray-600 mt-1">Book labs, rooms, equipment, and facilities for your academic needs</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={20} />
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
            { id: 'browse', label: 'Browse Resources', icon: Building },
            { id: 'bookings', label: 'My Bookings', icon: Calendar },
            { id: 'calendar', label: 'Availability Calendar', icon: Clock }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'browse' | 'bookings' | 'calendar')}
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

  // Category filter
  const CategoryFilter = () => (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-4 py-4 overflow-x-auto">
          {categories.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedCategory(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full border whitespace-nowrap ${
                selectedCategory === id
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Resource card
  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const CategoryIcon = getCategoryIcon(resource.category);
    
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
        <div className="relative">
          <Image
            src={resource.image}
            alt={resource.name}
            width={400}
            height={250}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 left-2 flex space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              resource.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {resource.availability ? 'Available' : 'Unavailable'}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {resource.category}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 text-lg">{resource.name}</h3>
            {resource.hourlyRate && (
              <span className="text-lg font-bold text-blue-600">₹{resource.hourlyRate}/hr</span>
            )}
          </div>
          
          <p className="text-gray-600 text-sm mb-3">{resource.description}</p>
          
          <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Users size={14} />
              <span>Capacity: {resource.capacity}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin size={14} />
              <span className="truncate">{resource.location}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Amenities:</h4>
            <div className="flex flex-wrap gap-1">
              {resource.amenities.slice(0, 3).map(amenity => (
                <span key={amenity} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {amenity}
                </span>
              ))}
              {resource.amenities.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{resource.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedResource(resource)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm"
            >
              View Details
            </button>
            <button
              onClick={() => {
                setSelectedResource(resource);
                setShowBookingModal(true);
              }}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 text-sm"
              disabled={!resource.availability}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Browse resources view
  const BrowseResourcesView = () => (
    <div className="space-y-6">
      <CategoryFilter />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(resource => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
        
        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <Building className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );

  // My bookings view
  const MyBookingsView = () => (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h2>
      
      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-xl shadow-lg p-6 border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{booking.resourceName}</h3>
                  <p className="text-gray-600 text-sm">Booking ID: #{booking.id}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{new Date(booking.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock size={14} className="text-gray-400" />
                  <span>{booking.startTime} - {booking.endTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users size={14} className="text-gray-400" />
                  <span>{booking.attendees} attendees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 font-medium">₹{booking.totalCost}</span>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600"><strong>Purpose:</strong> {booking.purpose}</p>
                {booking.specialRequirements && (
                  <p className="text-sm text-gray-600"><strong>Special Requirements:</strong> {booking.specialRequirements}</p>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Booked on {booking.createdAt}</span>
                <div className="flex space-x-2">
                  {booking.status === 'pending' && (
                    <button className="text-red-600 text-sm hover:text-red-800">Cancel</button>
                  )}
                  {booking.status === 'approved' && (
                    <button className="text-blue-600 text-sm hover:text-blue-800">Modify</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings yet</h3>
          <p className="mt-1 text-sm text-gray-500">Your booking history will appear here once you make your first reservation.</p>
          <button
            onClick={() => setActiveTab('browse')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Resources
          </button>
        </div>
      )}
    </div>
  );

  // Calendar view
  const CalendarView = () => {
    const timeSlots = generateTimeSlots();
    
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Availability Calendar</h2>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
            />
            <select className="p-2 border border-gray-300 rounded-lg">
              <option value="">All Resources</option>
              {resources.map(resource => (
                <option key={resource.id} value={resource.id}>{resource.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-semibold">Time Slots for {new Date(selectedDate).toLocaleDateString()}</h3>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-11 gap-2 p-4">
            {timeSlots.map(slot => (
              <div
                key={slot.time}
                className={`p-3 rounded-lg border text-center text-sm ${
                  slot.available
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : 'bg-red-100 border-red-300 text-red-800'
                }`}
              >
                <div className="font-medium">{slot.time}</div>
                <div className="text-xs mt-1">
                  {slot.available ? 'Available' : 'Booked'}
                </div>
                {slot.bookedBy && (
                  <div className="text-xs mt-1 truncate">{slot.bookedBy}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Resource details modal
  const ResourceDetailsModal = () => (
    selectedResource && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedResource.name}</h2>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-gray-400 hover:text-gray-600"
                title="Close details"
              >
                <X size={24} />
              </button>
            </div>
            
            <Image
              src={selectedResource.image}
              alt={selectedResource.name}
              width={600}
              height={300}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{selectedResource.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <span>{selectedResource.capacity} people</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span className="capitalize">{selectedResource.category}</span>
                    </div>
                    {selectedResource.hourlyRate && (
                      <div className="flex justify-between">
                        <span>Rate:</span>
                        <span>₹{selectedResource.hourlyRate}/hour</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="text-right">{selectedResource.location}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                  <p className="text-sm text-gray-600">{selectedResource.contact}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Amenities</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedResource.amenities.map(amenity => (
                    <div key={amenity} className="flex items-center space-x-2 text-sm">
                      <Check size={14} className="text-green-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Rules & Guidelines</h3>
                <div className="space-y-1">
                  {selectedResource.rules.map(rule => (
                    <div key={rule} className="flex items-start space-x-2 text-sm">
                      <AlertTriangle size={14} className="text-amber-500 mt-0.5" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBookingModal(true);
                }}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                disabled={!selectedResource.availability}
              >
                Book This Resource
              </button>
              <button
                onClick={() => setSelectedResource(null)}
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

  // Booking modal
  const BookingModal = () => (
    showBookingModal && selectedResource && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Book {selectedResource.name}</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Close booking form"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={bookingForm.date}
                  onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <textarea
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Describe the purpose of your booking..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
                  <input
                    type="number"
                    value={bookingForm.attendees}
                    onChange={(e) => setBookingForm({ ...bookingForm, attendees: parseInt(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    min="1"
                    max={selectedResource.capacity}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={bookingForm.contactNumber}
                    onChange={(e) => setBookingForm({ ...bookingForm, contactNumber: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="Your phone number"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                <textarea
                  value={bookingForm.specialRequirements}
                  onChange={(e) => setBookingForm({ ...bookingForm, specialRequirements: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Any special requirements or notes..."
                />
              </div>
              
              {selectedResource.hourlyRate && bookingForm.startTime && bookingForm.endTime && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Duration:</span>
                    <span>
                      {parseInt(bookingForm.endTime.split(':')[0]) - parseInt(bookingForm.startTime.split(':')[0])} hours
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total Cost:</span>
                    <span>
                      ₹{(parseInt(bookingForm.endTime.split(':')[0]) - parseInt(bookingForm.startTime.split(':')[0])) * selectedResource.hourlyRate}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitBooking}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!bookingForm.date || !bookingForm.startTime || !bookingForm.endTime || !bookingForm.purpose}
              >
                Submit Booking
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
      
      {activeTab === 'browse' && <BrowseResourcesView />}
      {activeTab === 'bookings' && <MyBookingsView />}
      {activeTab === 'calendar' && <CalendarView />}
      
      <ResourceDetailsModal />
      <BookingModal />
    </div>
  );
};

export default ResourceBookingPage;
