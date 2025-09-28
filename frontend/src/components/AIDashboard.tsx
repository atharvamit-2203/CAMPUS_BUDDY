'use client';

import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Clock, Users, Zap, Target, AlertTriangle, CheckCircle } from 'lucide-react';

interface AIInsight {
  room_utilization: {
    average_utilization: number;
    peak_utilization: number;
    high_demand_percentage: number;
  };
  popular_times: {
    peak_hours: Array<{ hour: number; utilization: number }>;
  };
  conflict_summary: {
    conflicts_by_type: Array<{
      type: string;
      count: number;
      resolution_rate: number;
    }>;
  };
  prediction_accuracy: {
    accuracy_by_type: Array<{
      type: string;
      accuracy: number;
      sample_size: number;
    }>;
  };
  user_engagement: {
    engagement_by_type: Array<{
      type: string;
      acceptance_rate: number;
      avg_relevance: number;
      total_suggestions: number;
    }>;
  };
}

interface RoomSuggestion {
  room_id: number;
  room_number: string;
  room_name: string;
  building: string;
  capacity: number;
  confidence_score: number;
  availability_score: number;
  reason: string;
  optimal_time_slots: Array<{
    time: string;
    availability_score: number;
    confidence: number;
    recommended: boolean;
  }>;
}

interface MenuRecommendation {
  item_id: number;
  name: string;
  category: string;
  price: number;
  recommendation_type: string;
  reason: string;
  confidence: number;
}

const AIDashboard: React.FC<{ userType: 'student' | 'teacher'; userId: number }> = ({ userType, userId }) => {
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [roomSuggestions, setRoomSuggestions] = useState<RoomSuggestion[]>([]);
  const [menuRecommendations, setMenuRecommendations] = useState<MenuRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAIData = async () => {
      try {
        setLoading(true);
        
        // Fetch AI insights
        const insightsResponse = await fetch('/api/ai/insights/dashboard');
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          setInsights(insightsData);
        }

        // Fetch menu recommendations
        const menuResponse = await fetch(`/api/ai/recommendations/menu/${userId}`);
        if (menuResponse.ok) {
          const menuData = await menuResponse.json();
          setMenuRecommendations(menuData);
        }

        // For teachers, fetch room suggestions
        if (userType === 'teacher') {
          const today = new Date().toISOString().split('T')[0];
          const roomResponse = await fetch('/api/ai/rooms/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              requested_date: today,
              start_time: '10:00:00',
              duration_minutes: 90,
              capacity_needed: 30
            })
          });
          
          if (roomResponse.ok) {
            const roomData = await roomResponse.json();
            setRoomSuggestions(roomData);
          }
        }

      } catch (err) {
        setError('Failed to load AI data');
        console.error('AI data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAIData();
  }, [userId, userType]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="text-purple-600 animate-pulse" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">AI Insights</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="text-red-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-800">AI Insights</h2>
        </div>
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center space-x-3">
          <Brain size={32} />
          <div>
            <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
            <p className="text-purple-100">Smart recommendations and predictions for better campus experience</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-800">Room Utilization</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Average:</span>
                <span className="font-semibold">{insights.room_utilization.average_utilization}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Peak:</span>
                <span className="font-semibold">{insights.room_utilization.peak_utilization}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`bg-blue-600 h-2 rounded-full`}
                  style={{ width: `${insights.room_utilization.average_utilization}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="text-green-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-800">Peak Hours</h3>
            </div>
            <div className="space-y-2">
              {insights.popular_times.peak_hours.slice(0, 3).map((hour, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600">{hour.hour}:00</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-green-600 h-2 rounded-full`}
                        style={{ width: `${hour.utilization}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{hour.utilization.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Target className="text-purple-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-800">AI Accuracy</h3>
            </div>
            <div className="space-y-2">
              {insights.prediction_accuracy.accuracy_by_type.map((pred, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-600 capitalize">{pred.type.replace('_', ' ')}</span>
                  <span className={`font-semibold ${getConfidenceColor(pred.accuracy)}`}>
                    {pred.accuracy.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Smart Room Suggestions for Teachers */}
      {userType === 'teacher' && roomSuggestions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Zap className="text-yellow-600" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Smart Room Suggestions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roomSuggestions.slice(0, 4).map((room) => (
              <div key={room.room_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-800">{room.room_number}</h4>
                    <p className="text-sm text-gray-600">{room.room_name} • {room.building}</p>
                    <p className="text-sm text-gray-500">Capacity: {room.capacity}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBadge(room.confidence_score)}`}>
                    {room.confidence_score.toFixed(0)}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{room.reason}</p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${room.availability_score > 80 ? 'bg-green-500' : room.availability_score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-600">{room.availability_score.toFixed(0)}% available</span>
                  </div>
                  {room.optimal_time_slots.length > 0 && (
                    <div className="text-xs text-gray-600">
                      Best: {room.optimal_time_slots[0].time}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Menu Recommendations */}
      {menuRecommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="text-orange-600" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Personalized Menu Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuRecommendations.slice(0, 6).map((item) => (
              <div key={item.item_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <p className="text-sm text-purple-600 capitalize">{item.category}</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">₹{item.price}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{item.reason}</p>
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceBadge(item.confidence * 100)}`}>
                    {item.recommendation_type}
                  </span>
                  <div className="flex items-center space-x-1">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-xs text-gray-600">{(item.confidence * 100).toFixed(0)}% match</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict Alerts */}
      {insights?.conflict_summary.conflicts_by_type && insights.conflict_summary.conflicts_by_type.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <AlertTriangle className="text-red-600" size={24} />
            <h3 className="text-xl font-bold text-gray-800">System Alerts</h3>
          </div>
          <div className="space-y-3">
            {insights.conflict_summary.conflicts_by_type.map((conflict, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-800 capitalize">
                    {conflict.type.replace('_', ' ')} Issues
                  </span>
                  <span className="ml-2 text-sm text-gray-600">({conflict.count} detected)</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-600">Resolution Rate:</span>
                  <span className={`ml-1 font-semibold ${conflict.resolution_rate > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {conflict.resolution_rate.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Performance Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">AI Performance Summary</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {insights?.prediction_accuracy.accuracy_by_type.reduce((acc, curr) => acc + curr.accuracy, 0) / (insights?.prediction_accuracy.accuracy_by_type.length || 1) || 0}%
            </div>
            <div className="text-sm text-gray-600">Avg Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {insights?.user_engagement.engagement_by_type.reduce((acc, curr) => acc + curr.acceptance_rate, 0) / (insights?.user_engagement.engagement_by_type.length || 1) || 0}%
            </div>
            <div className="text-sm text-gray-600">Acceptance Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {roomSuggestions.length + menuRecommendations.length}
            </div>
            <div className="text-sm text-gray-600">Active Suggestions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {insights?.room_utilization.high_demand_percentage || 0}%
            </div>
            <div className="text-sm text-gray-600">High Demand</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;
