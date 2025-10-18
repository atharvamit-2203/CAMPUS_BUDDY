'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Building, Users } from 'lucide-react';

interface RoomBooking {
  id: number;
  room_id: number;
  room_number: string;
  room_name: string;
  building: string;
  capacity: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: string;
  booked_by: number;
  booked_by_name: string;
  booked_by_email: string;
  created_at: string;
}

const AllFacultyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming'>('upcoming');

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${API}/rooms/all-faculty-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    // Handle both HH:MM:SS and HH:MM formats
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const bookingDate = new Date(dateString);
    return today.toDateString() === bookingDate.toDateString();
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'today') {
      return isToday(booking.booking_date);
    }
    if (filter === 'upcoming') {
      const bookingDate = new Date(booking.booking_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return bookingDate >= today;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          All Faculty Room Bookings
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'upcoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Calendar className="mx-auto h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg">No faculty bookings found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className={`border rounded-lg p-4 transition-all hover:shadow-lg ${
                isToday(booking.booking_date)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-750'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                    <Building className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">
                      {booking.building} - {booking.room_number}
                    </span>
                  </div>
                  {booking.room_name && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                      {booking.room_name}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1 ml-7">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {booking.capacity}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="font-medium">{formatDate(booking.booking_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ml-7">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">{booking.booked_by_name}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                    {booking.booked_by_email}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-600 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Purpose:
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {booking.purpose}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex justify-between items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    booking.status === 'approved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {booking.status}
                </span>
                {isToday(booking.booking_date) && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Today
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllFacultyBookings;
