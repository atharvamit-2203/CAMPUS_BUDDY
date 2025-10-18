'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, ShoppingBag, Clock, User, DollarSign, CheckCircle, XCircle, RefreshCw, Camera, X } from 'lucide-react';

interface OrderItem {
  id: number;
  order_id: number;
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

interface CanteenOrder {
  id: number;
  user_id: number;
  student_name: string;
  student_email: string;
  student_id: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  qr_token: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

const StaffCanteenOrders: React.FC = () => {
  const [orders, setOrders] = useState<CanteenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanningOrder, setScanningOrder] = useState<number | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [filter, setFilter] = useState<'all' | 'queued' | 'preparing' | 'ready'>('all');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${API}/canteen/staff/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (e) {
      const error = e as Error;
      setError(error?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => {
      clearInterval(interval);
      stopCamera(); // Clean up camera on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Camera QR Scanner Functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCameraScanner(true);
      // Start scanning
      scanQRFromVideo();
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('Failed to access camera. Please check permissions or use manual QR entry.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraScanner(false);
  };

  const scanQRFromVideo = () => {
    if (!videoRef.current || !canvasRef.current || !showCameraScanner) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Try to detect QR code using jsQR library
    try {
      // We'll use a simple approach: import jsQR dynamically
      import('jsqr').then(({ default: jsQR }) => {
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          // QR code detected!
          const qrData = code.data;
          stopCamera();
          handleScanQR(qrData, 0);
        } else {
          // Continue scanning
          if (showCameraScanner) {
            requestAnimationFrame(scanQRFromVideo);
          }
        }
      }).catch(() => {
        // jsQR not available, continue scanning
        if (showCameraScanner) {
          requestAnimationFrame(scanQRFromVideo);
        }
      });
    } catch (err) {
      console.error('QR scanning error:', err);
      if (showCameraScanner) {
        requestAnimationFrame(scanQRFromVideo);
      }
    }
  };

  const handleScanQR = async (qrToken: string, orderId: number) => {
    try {
      setScanningOrder(orderId);
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';

      const response = await fetch(`${API}/canteen/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ qr_data: qrToken })
      });

      const result = await response.json();

      if (result.valid) {
        alert(result.message);
        loadOrders(); // Refresh the orders list
      } else {
        alert(result.message || 'Invalid QR code');
      }
    } catch (e) {
      const error = e as Error;
      alert(error?.message || 'Failed to scan QR code');
    } finally {
      setScanningOrder(null);
      setQrInput('');
      setShowQrScanner(false);
    }
  };

  const handleManualQrScan = () => {
    if (!qrInput.trim()) {
      alert('Please enter QR code');
      return;
    }
    handleScanQR(qrInput, 0);
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';

      const response = await fetch(`${API}/canteen/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        loadOrders();
      } else {
        throw new Error('Failed to update status');
      }
    } catch (e) {
      const error = e as Error;
      alert(error?.message || 'Failed to update order status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'served':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return order.status !== 'served';
    return order.status === filter;
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingBag className="w-7 h-7" />
          Staff - Canteen Orders
        </h2>
        <div className="flex gap-2">
          <button
            onClick={startCamera}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Scan with Camera
          </button>
          <button
            onClick={() => setShowQrScanner(!showQrScanner)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Manual Entry
          </button>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Camera QR Scanner Modal */}
      {showCameraScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="w-6 h-6" />
                Scan QR Code
              </h3>
              <button
                onClick={stopCamera}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Close Scanner"
                aria-label="Close Scanner"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="relative bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                className="w-full h-auto max-h-96"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-4 border-green-500 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <p className="text-center text-gray-600 dark:text-gray-400">
              Position the QR code within the frame to scan
            </p>
          </div>
        </div>
      )}

      {/* Manual QR Scanner */}
      {showQrScanner && (
        <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Manual QR Code Entry
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Enter QR code or token..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleManualQrScan()}
            />
            <button
              onClick={handleManualQrScan}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Verify
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {(['all', 'queued', 'preparing', 'ready'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <ShoppingBag className="mx-auto h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-all bg-white dark:bg-gray-750"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      Order #{order.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    <span>{order.student_name}</span>
                    {order.student_id && <span>({order.student_id})</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                    <DollarSign className="w-5 h-5" />
                    ₹{order.total_amount.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatDate(order.created_at)}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              {order.items && order.items.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Order Items:
                  </h4>
                  <ul className="space-y-1">
                    {order.items.map((item) => (
                      <li key={item.id} className="text-sm text-gray-600 dark:text-gray-400 flex justify-between">
                        <span>
                          {item.quantity}x {item.item_name}
                        </span>
                        <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Payment Status */}
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Payment:</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {order.payment_status}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">via {order.payment_method}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={startCamera}
                  disabled={scanningOrder === order.id || order.status === 'served'}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scanningOrder === order.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Scan with Camera
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleScanQR(order.qr_token, order.id)}
                  disabled={scanningOrder === order.id || order.status === 'served'}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <QrCode className="w-4 h-4" />
                  Verify Manually
                </button>

                {order.status === 'queued' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Preparing
                  </button>
                )}

                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Ready
                  </button>
                )}

                {order.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'served')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Served
                  </button>
                )}

                {order.status !== 'served' && order.status !== 'cancelled' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffCanteenOrders;
