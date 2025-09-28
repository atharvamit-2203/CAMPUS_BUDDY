'use client';

import { useState, useEffect } from 'react';
import { 
  FiMapPin, 
  FiCalendar, 
  FiClock, 
  FiUsers, 
  FiPlus, 
  FiEdit, 
  FiTrash,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiMonitor,
  FiWifi,
  FiMic,
  FiCamera
} from 'react-icons/fi';

interface Room {
  id: number;
  name: string;
  type: 'classroom' | 'lab' | 'auditorium' | 'conference';
  capacity: number;
  facilities: string[];
  location: string;
  isAvailable: boolean;
  currentBooking?: {
    faculty: string;
    subject: string;
    time: string;
  };
}

interface Booking {
  id: number;
  roomId: number;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
  subject: string;
  attendees: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  equipment: string[];
}

export default function FacultyBookingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [startTimeFilter, setStartTimeFilter] = useState('09:00');
  const [endTimeFilter, setEndTimeFilter] = useState('10:00');

useEffect(() => {
    const fetchData = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';

        // Load upcoming bookings visible to all faculty
        const bookingsResp = await fetch(`${API}/rooms/bookings?upcoming_only=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (bookingsResp.ok) {
          const data = await bookingsResp.json();
          const mapped: Booking[] = (data || []).map((rb: any) => ({
            id: rb.id,
            roomId: rb.room_id,
            roomName: rb.room_name || rb.room_number || `Room ${rb.room_id}`,
            date: rb.booking_date,
            startTime: (rb.start_time || '').toString().slice(0,5),
            endTime: (rb.end_time || '').toString().slice(0,5),
            purpose: rb.purpose || 'Class',
            subject: rb.purpose || 'Class',
            attendees: 0,
            status: (rb.status || 'confirmed') as any,
            equipment: []
          }));
          setBookings(mapped);
        }

// Load rooms (filter by availability if date/time provided)
        let roomsUrl = `${API}/rooms`;
        if (selectedDate && startTimeFilter && endTimeFilter) {
          roomsUrl += `?booking_date=${selectedDate}&start_time=${startTimeFilter}&end_time=${endTimeFilter}`;
        }
        const roomsResp = await fetch(roomsUrl, { headers: { Authorization: `Bearer ${token}` }});
        let roomsData: any[] = [];
        if (roomsResp.ok) {
          roomsData = await roomsResp.json();
        }
        const mappedRooms: Room[] = (roomsData || []).map((r: any) => ({
          id: r.id,
          name: r.room_name || r.room_number || `Room ${r.id}`,
          type: (r.room_type || 'classroom') as any,
          capacity: r.capacity || 0,
          facilities: (r.facilities ? String(r.facilities).split(',') : []).filter(Boolean),
          location: r.building ? `${r.building}` : 'Campus',
          isAvailable: true
        }));
setRooms(mappedRooms);

        // Mock bookings data
        const mockBookings: Booking[] = [
          {
            id: 1,
            roomId: 1,
            roomName: 'Room 301',
            date: '2025-09-15',
            startTime: '09:00',
            endTime: '10:30',
            purpose: 'Regular Class',
            subject: 'Data Structures',
            attendees: 45,
            status: 'confirmed',
            equipment: ['Projector', 'Whiteboard']
          },
          {
            id: 2,
            roomId: 3,
            roomName: 'Auditorium A',
            date: '2025-09-16',
            startTime: '14:00',
            endTime: '16:00',
            purpose: 'Workshop',
            subject: 'Machine Learning Basics',
            attendees: 80,
            status: 'pending',
            equipment: ['Sound System', 'Projector']
          },
          {
            id: 3,
            roomId: 2,
            roomName: 'Computer Lab 1',
            date: '2025-09-17',
            startTime: '11:00',
            endTime: '12:30',
            purpose: 'Practical Session',
            subject: 'Web Development',
            attendees: 35,
            status: 'confirmed',
            equipment: ['Computers', 'Projector']
          }
        ];

        setRooms(mockRooms);
        setBookings(mockBookings);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
}, [selectedDate, startTimeFilter, endTimeFilter]);

  const getRoomTypeIcon = (type: string) => {
    switch (type) {
      case 'classroom': return <FiUsers className="text-blue-500" />;
      case 'lab': return <FiMonitor className="text-green-500" />;
      case 'auditorium': return <FiMic className="text-purple-500" />;
      case 'conference': return <FiCamera className="text-orange-500" />;
      default: return <FiMapPin className="text-gray-500" />;
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'classroom': return 'bg-blue-100 text-blue-800';
      case 'lab': return 'bg-green-100 text-green-800';
      case 'auditorium': return 'bg-purple-100 text-purple-800';
      case 'conference': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = roomTypeFilter === 'all' || room.type === roomTypeFilter;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Room Booking</h1>
            <p className="text-gray-600">Book classrooms, labs, and facilities for your classes</p>
          </div>
          <button 
            onClick={() => setShowBookingModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FiPlus className="mr-2" />
            New Booking
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiMapPin className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
            <p className="text-sm text-gray-600">Total Rooms</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {rooms.filter(room => room.isAvailable).length}
            </p>
            <p className="text-sm text-gray-600">Available Now</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiCalendar className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            <p className="text-sm text-gray-600">My Bookings</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiClock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {bookings.filter(booking => booking.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-600">Pending Approval</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
            >
              <option value="all">All Room Types</option>
              <option value="classroom">Classrooms</option>
              <option value="lab">Labs</option>
              <option value="auditorium">Auditoriums</option>
              <option value="conference">Conference Rooms</option>
            </select>
            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Time Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={startTimeFilter}
                onChange={(e) => setStartTimeFilter(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={endTimeFilter}
                onChange={(e) => setEndTimeFilter(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button onClick={() => { /* triggers useEffect via state change */ }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg w-full">Refresh Availability</button>
            </div>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Rooms */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Available Rooms</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {filteredRooms.map((room) => (
                  <div key={room.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getRoomTypeIcon(room.type)}
                        <div>
                          <h3 className="font-medium text-gray-900">{room.name}</h3>
                          <p className="text-sm text-gray-600">{room.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoomTypeColor(room.type)}`}>
                          {room.type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          room.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {room.isAvailable ? 'Available' : 'Occupied'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiUsers className="mr-1" />
                        Capacity: {room.capacity}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiWifi className="mr-1" />
                        {room.facilities.length} facilities
                      </div>
                    </div>

                    {!room.isAvailable && room.currentBooking && (
                      <div className="bg-red-50 p-3 rounded-lg mb-3">
                        <p className="text-sm text-red-800">
                          Currently occupied by {room.currentBooking.faculty}
                        </p>
                        <p className="text-xs text-red-600">
                          {room.currentBooking.subject} - {room.currentBooking.time}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mb-3">
                      {room.facilities.map((facility, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {facility}
                        </span>
                      ))}
                    </div>

                    <button 
                      className={`w-full py-2 px-4 rounded-lg text-sm font-medium ${
                        room.isAvailable 
                          ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!room.isAvailable}
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowBookingModal(true);
                      }}
                    >
                      {room.isAvailable ? 'Book Room' : 'Currently Occupied'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* My Bookings */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">My Bookings</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{booking.roomName}</h3>
                        <p className="text-sm text-gray-600">{booking.subject}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Edit Booking">
                          <FiEdit className="h-4 w-4 text-gray-500" />
                        </button>
<button className="p-1 hover:bg-gray-100 rounded" title="Cancel Booking" onClick={async ()=>{
                          try {
                            const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
                            const resp = await fetch(`${API}/rooms/bookings/${booking.id}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }});
                            if (!resp.ok) throw new Error('Cancel failed');
                            // reload bookings
                            const bookingsResp = await fetch(`${API}/rooms/bookings?upcoming_only=1`, { headers: { Authorization: `Bearer ${token}` }});
                            if (bookingsResp.ok) {
                              const data = await bookingsResp.json();
                              const mapped: Booking[] = (data || []).map((rb: any) => ({
                                id: rb.id,
                                roomId: rb.room_id,
                                roomName: rb.room_name || rb.room_number || `Room ${rb.room_id}`,
                                date: rb.booking_date,
                                startTime: (rb.start_time || '').toString().slice(0,5),
                                endTime: (rb.end_time || '').toString().slice(0,5),
                                purpose: rb.purpose || 'Class',
                                subject: rb.purpose || 'Class',
                                attendees: 0,
                                status: (rb.status || 'confirmed') as any,
                                equipment: []
                              }));
                              setBookings(mapped);
                            }
                          } catch(e) { console.error(e);} 
                        }}>
                          <FiTrash className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiCalendar className="mr-1" />
                        {booking.date}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FiClock className="mr-1" />
                        {booking.startTime} - {booking.endTime}
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <FiUsers className="mr-1" />
                      {booking.attendees} attendees
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {booking.equipment.map((item, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedRoom ? `Book ${selectedRoom.name}` : 'New Booking'}
              </h3>
              <BookingForm 
                room={selectedRoom} 
onSave={async (booking) => {
                  try {
                    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
                    // Persist booking to backend
                    const resp = await fetch(`${API}/rooms/book`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        room_id: booking.roomId || selectedRoom?.id,
                        booking_date: booking.date,
                        start_time: booking.startTime,
                        end_time: booking.endTime,
                        purpose: booking.purpose || booking.subject || 'Class'
                      })
                    });
                    if (!resp.ok) throw new Error('Failed to book');
                    // Reload upcoming bookings
                    const bookingsResp = await fetch(`${API}/rooms/bookings?upcoming_only=1`, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (bookingsResp.ok) {
                      const data = await bookingsResp.json();
                      const mapped: Booking[] = (data || []).map((rb: any) => ({
                        id: rb.id,
                        roomId: rb.room_id,
                        roomName: rb.room_name || rb.room_number || `Room ${rb.room_id}`,
                        date: rb.booking_date,
                        startTime: (rb.start_time || '').toString().slice(0,5),
                        endTime: (rb.end_time || '').toString().slice(0,5),
                        purpose: rb.purpose || 'Class',
                        subject: rb.purpose || 'Class',
                        attendees: 0,
                        status: (rb.status || 'confirmed') as any,
                        equipment: []
                      }));
                      setBookings(mapped);
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setShowBookingModal(false);
                    setSelectedRoom(null);
                  }
                }}
                onCancel={() => {
                  setShowBookingModal(false);
                  setSelectedRoom(null);
                }} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Booking Form Component
interface BookingFormProps {
  room: Room | null;
  onSave: (booking: Omit<Booking, 'id'>) => void;
  onCancel: () => void;
}

function BookingForm({ room, onSave, onCancel }: BookingFormProps) {
  const [formData, setFormData] = useState({
    roomId: room?.id || 0,
    roomName: room?.name || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:30',
    purpose: '',
    subject: '',
    attendees: 1,
    status: 'pending' as const,
    equipment: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter subject name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
        <select
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Select purpose</option>
          <option value="Regular Class">Regular Class</option>
          <option value="Practical Session">Practical Session</option>
          <option value="Workshop">Workshop</option>
          <option value="Seminar">Seminar</option>
          <option value="Meeting">Meeting</option>
          <option value="Exam">Exam</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Attendees</label>
        <input
          type="number"
          value={formData.attendees}
          onChange={(e) => setFormData({ ...formData, attendees: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="1"
          max={room?.capacity || 100}
          required
        />
      </div>

      {room && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Required Equipment</label>
          <div className="space-y-2">
            {room.facilities.map((facility) => (
              <label key={facility} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.equipment.includes(facility)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, equipment: [...formData.equipment, facility] });
                    } else {
                      setFormData({ ...formData, equipment: formData.equipment.filter(eq => eq !== facility) });
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{facility}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
        >
          Book Room
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
