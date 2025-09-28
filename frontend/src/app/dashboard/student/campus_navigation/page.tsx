'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { MapPin, Building2, Target, AlertCircle, Check, X, MessageCircle, Send } from 'lucide-react';

// === TYPES ===
interface RoutePoint {
  node: string;
  floor: string;
  x: number;
  y: number;
}

interface ChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export default function NavigationPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Role-based access control
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.push('/login');
      return;
    }
    
    if (!isLoading && user && user.role !== 'student') {
      console.log(`Access denied: ${user.role} trying to access student campus navigation`);
      router.push('/dashboard');
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [currentFloor, setCurrentFloor] = useState<'ground' | 'first' | 'second' | 'third'>('ground');
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState('');
  const [animationStep, setAnimationStep] = useState(0);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      text: "Hi! I'm your Campus Navigator assistant. Type your start and destination to get directions.",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Image URLs - maps stored in public/maps/
  const mapUrls = {
    ground: '/maps/ground.png',
    first: '/maps/first.png',
    second: '/maps/second.png',
    third: '/maps/third.png',
  };

  // Handle form submission with improved debugging
  const handleGetRoute = async () => {
    if (!start.trim()) return setError('Please enter a starting point.');
    if (!end.trim()) return setError('Please enter a destination.');

    setError('');
    setIsAnimating(true);
    setRoute([]);
    setTotalDistance(null);
    setAnimationStep(0);

    try {
      const res = await fetch('http://127.0.0.1:8000/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: start.trim(), end: end.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Location not found or no path exists.');
      }

      const data = await res.json();

      console.log("✅ Backend Response:", data); // Debug log for backend response

      const pathWithCoords = data.coordinates.map((point: any) => ({
        node: point.node,
        floor: point.floor,
        x: point.x,
        y: point.y,
      }));

      console.log("🔄 Mapped route:", pathWithCoords); // Debug log for mapped route
      console.log("📊 Route length:", pathWithCoords.length); // Debug route length

      setRoute(pathWithCoords);
      setTotalDistance(data.total_distance);
      setCurrentFloor(pathWithCoords[0].floor as any);
      setAnimationStep(0);

      // Force re-render and start animation after state update
      setTimeout(() => {
        if (pathWithCoords.length > 1) {
          console.log("🎬 Starting animation for", pathWithCoords.length, "steps");
          setAnimationStep(0); // Reset to 0 and let useEffect handle the rest
        }
      }, 100);

    } catch (err: any) {
      setError(`Error: ${err.message}`);
      console.error("❌ Route error:", err);
    } finally {
      setIsAnimating(false);
    }
  };

  // Improved animation effect with better debugging
  useEffect(() => {
    if (!isAnimating || route.length <= 1) {
      console.log("⏸️ Animation stopped - isAnimating:", isAnimating, "route length:", route.length);
      return;
    }

    console.log("▶️ Starting animation for route with", route.length, "steps");

    const interval = setInterval(() => {
      setAnimationStep((prev) => {
        const nextStep = prev + 1;
        
        console.log(`🎬 Animation step ${nextStep} of ${route.length}:`, route[nextStep]);
        
        if (nextStep >= route.length) {
          console.log("🏁 Animation completed");
          setIsAnimating(false);
          clearInterval(interval);
          return prev;
        }

        // Switch floor when moving between floors
        if (route[nextStep]?.floor !== route[prev]?.floor) {
          console.log("🏢 Floor change:", route[prev]?.floor, "→", route[nextStep]?.floor);
          setCurrentFloor(route[nextStep].floor as any);
        }

        return nextStep;
      });
    }, 800);

    return () => {
      console.log("🔄 Cleaning up animation interval");
      clearInterval(interval);
    };
  }, [isAnimating, route]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Chat send handler with improved responses
  const sendChatMessage = () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      text: chatInput,
      isBot: false,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    
    const input = chatInput.toLowerCase().trim();
    setChatInput('');

    setTimeout(() => {
      let botResponse = "I can help you navigate! Enter a valid start and end point above.";
      
      // More intelligent responses based on input
      if (input.includes('help') || input.includes('how')) {
        botResponse = "Enter your starting point (e.g., 'Auditorium') and destination (e.g., 'C005') in the fields above, then click 'Find Route' to get directions.";
      } else if (input.includes('floor') || input.includes('level')) {
        botResponse = "You can switch between floors using the floor selector. The system will automatically show you the path across different floors.";
      } else if (input.includes('distance')) {
        botResponse = "The total walking distance will be shown once you generate a route.";
      } else if (route.length > 0) {
        botResponse = `Your current route has ${route.length} steps. ${isAnimating ? 'Animation is in progress.' : 'Use the floor selector to view different levels.'}`;
      }

      const botMsg: ChatMessage = {
        id: Date.now() + 1,
        text: botResponse,
        isBot: true,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  // Points on current floor
  const pointsOnCurrentFloor = route.filter((p) => p.floor === currentFloor);
  const animatedPathForFloor = route
    .slice(0, animationStep + 1)
    .filter((p) => p.floor === currentFloor);

  // Start and End nodes on current floor
  const startNode = route.length > 0 && route[0]?.floor === currentFloor ? route[0] : null;
  const endNode =
    route.length > 0 && route[route.length - 1]?.floor === currentFloor ? route[route.length - 1] : null;

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <RoleBasedNavigation currentPage="campus_navigation" />
          <main className="flex-1 ml-64 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">Loading...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <RoleBasedNavigation currentPage="campus_navigation" />
      
      <div className="flex-1 overflow-hidden">
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-100">
          {/* Header */}
          <header className="bg-gradient-to-r from-teal-600 via-cyan-700 to-blue-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <MapPin className="w-8 h-8 text-white" />
                <h1 className="text-2xl font-bold text-white">Campus Navigator</h1>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-teal-600" />
              Navigate Campus
            </h2>

            {/* Input Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Starting Point</label>
                <input
                  type="text"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  placeholder="e.g., Auditorium, c005"
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Destination</label>
                <input
                  type="text"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  placeholder="e.g., l209, Reception"
                  className="w-full p-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 font-medium placeholder-gray-500 bg-white"
                />
              </div>

              <button
                onClick={handleGetRoute}
                disabled={isAnimating}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 px-4 rounded-xl hover:from-teal-600 hover:to-cyan-600 transition-all font-semibold shadow-md disabled:opacity-70"
              >
                {isAnimating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Finding Path...
                  </span>
                ) : (
                  'Find Route'
                )}
              </button>

              {error && (
                <p className="text-red-600 text-sm mt-2 flex items-center font-medium bg-red-50 p-3 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {error}
                </p>
              )}
            </div>

            {/* Floor Selector */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-teal-600" />
                Select Floor
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {(['ground', 'first', 'second', 'third'] as const).map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setCurrentFloor(floor)}
                    disabled={isAnimating}
                    className={`p-3 rounded-lg text-sm font-medium transition-all ${
                      currentFloor === floor
                        ? 'bg-gradient-to-b from-teal-600 to-teal-700 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300'
                    } ${isAnimating ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        currentFloor === floor ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      {floor === 'ground' ? 'G' : floor.charAt(0).toUpperCase()}
                    </div>
                    <span className={`mt-1 block font-semibold ${currentFloor === floor ? 'text-white' : 'text-gray-800'}`}>
                      {floor === 'ground' ? 'Ground' : `${floor.charAt(0).toUpperCase()}F`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Route Details - Always show full route */}
            {route.length > 0 && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-teal-600" />
                  Route Summary ({route.length} steps)
                </h3>

                {totalDistance !== null && (
                  <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Total Distance</span>
                      <span className="font-bold text-lg text-blue-900">{totalDistance} m</span>
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                  {route.map((p, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-sm transition-all duration-300 border ${
                        animationStep >= i
                          ? 'bg-green-50 border-green-300 border-l-4 border-l-green-500 transform scale-[1.02]'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{p.node}</span>
                        <span className="text-xs bg-gray-700 text-white px-2 py-1 rounded-full font-medium">
                          {p.floor === 'ground' ? 'G' : p.floor.charAt(0).toUpperCase()}F
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-600 font-medium">Step {i + 1}</span>
                        {animationStep >= i && (
                          <div className="text-xs text-green-700 flex items-center animate-fade-in font-semibold">
                            <Check className="w-3 h-3 mr-1" />
                            Reached
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Animation Progress Bar */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-900 mb-2 font-medium">
                    <span>Progress</span>
                    <span>{animationStep} / {route.length}</span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-3 border border-gray-400">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(animationStep / route.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map View */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {currentFloor === 'ground' ? 'Ground' : currentFloor.charAt(0).toUpperCase() + currentFloor.slice(1)} Floor
              </h3>
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg border border-gray-300">
                <div className={`w-3 h-3 rounded-full ${isAnimating ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-sm font-medium text-gray-800">{isAnimating ? 'Routing...' : 'Ready'}</span>
              </div>
            </div>

            <div className="relative h-[500px] bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-300">
              {/* Floor Map with fallback */}
              <img
                src={mapUrls[currentFloor]}
                alt={`${currentFloor} floor`}
                className="w-full h-full object-cover"
                style={{ transform: 'scale(1.05)' }}
                onError={(e) => {
                  console.log("❌ Map image failed to load:", mapUrls[currentFloor]);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjI1MCIgeT0iMjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMzc0MTUxIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5GbG9vciBNYXA8L3RleHQ+PC9zdmc+';
                }}
              />

              {/* Start Marker (Red) */}
              {startNode && (
                <div
                  className="absolute w-6 h-6 bg-red-500 rounded-full border-3 border-white shadow-lg animate-pulse z-10"
                  style={{
                    left: `${startNode.x}%`,
                    top: `${startNode.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={`Start: ${startNode.node}`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-semibold">
                    START
                  </div>
                </div>
              )}

              {/* End Marker (Blue) */}
              {endNode && (
                <div
                  className="absolute w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg z-10"
                  style={{
                    left: `${endNode.x}%`,
                    top: `${endNode.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={`End: ${endNode.node}`}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-semibold">
                    END
                  </div>
                </div>
              )}

              {/* Animated Route Line */}
              {animatedPathForFloor.length > 1 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-5">
                  <polyline
                    points={animatedPathForFloor.map((p) => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                    className="animate-pulse"
                    style={{ 
                      strokeDasharray: '10,5',
                      animation: 'dash 2s linear infinite'
                    }}
                  />
                </svg>
              )}

              {/* Route Points */}
              {pointsOnCurrentFloor.map((point, i) => (
                <div
                  key={i}
                  className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-md z-10 ${
                    animationStep >= route.indexOf(point) ? 'bg-green-500' : 'bg-yellow-400'
                  }`}
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  title={point.node}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm font-medium text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span>Start</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Destination</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Reached</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <span>Upcoming</span>
              </div>
            </div>
          </div>
        </div> {/* Close grid */}
      </main>

      {/* Chat Bot Toggle */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full shadow-2xl hover:scale-110 transition-all z-50 flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Enhanced Chat Interface */}
      {isChatOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border-2 border-gray-300 flex flex-col z-50">
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Navigation Assistant</h3>
                <p className="text-xs text-teal-100">Online • Ready to help</p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-white hover:bg-white/20 p-1 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-xs p-3 rounded-xl text-sm font-medium ${
                    msg.isBot
                      ? 'bg-white text-gray-900 rounded-bl-md border border-gray-200 shadow-sm'
                      : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-md shadow-md'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className={`mt-1 text-xs font-normal ${msg.isBot ? 'text-gray-500' : 'text-teal-100'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t-2 border-gray-200 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about navigation..."
                className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 font-medium bg-white"
              />
              <button
                onClick={sendChatMessage}
                className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}