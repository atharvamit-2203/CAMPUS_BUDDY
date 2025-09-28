'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  Clock,
  Download,
  Check
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  available: boolean;
}

const StudentCanteen = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pay_now' | 'pay_later' | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    id: string;
    items: CartItem[];
    total_amount: number;
    payment_method: string;
    payment_status: string;
    order_date: Date;
    qr_code: string;
    pickup_code: string;
  } | null>(null);

  const menuItems: MenuItem[] = [
    // Main Course
    { id: '1', name: 'Butter Chicken with Rice', price: 120, description: 'Tender chicken in rich tomato-based curry', category: 'main', available: true },
    { id: '2', name: 'Veg Biryani', price: 100, description: 'Aromatic basmati rice with mixed vegetables', category: 'main', available: true },
    { id: '3', name: 'Paneer Tikka Masala', price: 110, description: 'Grilled paneer in spicy masala sauce', category: 'main', available: false },
    
    // Snacks
    { id: '4', name: 'Samosa (2 pcs)', price: 30, description: 'Crispy fried pastry with spiced filling', category: 'snacks', available: true },
    { id: '5', name: 'Club Sandwich', price: 80, description: 'Multi-layer sandwich with veggies', category: 'snacks', available: true },
    { id: '6', name: 'Pizza Slice', price: 60, description: 'Margherita pizza slice', category: 'snacks', available: true },
    
    // Beverages
    { id: '7', name: 'Masala Tea', price: 15, description: '', category: 'beverages', available: true },
    { id: '8', name: 'Filter Coffee', price: 25, description: '', category: 'beverages', available: true },
    { id: '9', name: 'Fresh Juice', price: 40, description: '', category: 'beverages', available: true },
    { id: '10', name: 'Cold Drink', price: 30, description: '', category: 'beverages', available: true },
  ];

  const addToCart = (item: MenuItem) => {
    if (!item.available) return;
    
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        category: item.category
      }]);
    }
    
    setShowCart(true);
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    setShowCart(false);
    setShowCheckout(true);
  };

  const handlePayment = async (method: 'pay_now' | 'pay_later') => {
    setPaymentMethod(method);
    if (method === 'pay_now') {
      // Store cart and amount, redirect to payment page
      localStorage.setItem('canteen_cart', JSON.stringify(cart));
      localStorage.setItem('canteen_amount', String(getTotalAmount()));
      window.location.href = '/dashboard/student/canteen/payment';
      return;
    }
    try {
      const orderData = {
        items: cart,
        total_amount: getTotalAmount(),
        payment_method: method,
        payment_status: 'pending'
      };
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API}/canteen/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        const generatedOrder = {
          id: String(result.order_id),
          items: cart,
          total_amount: getTotalAmount(),
          payment_method: method,
          payment_status: 'pending',
          order_date: new Date(),
          qr_code: result.qr_url,
          pickup_code: (result.qr_token || '').slice(0,8).toUpperCase()
        };
        
        setOrderDetails(generatedOrder);
        setOrderPlaced(true);
        setCart([]);
        setShowCheckout(false);
      }
    } catch {
      // If API fails, still create mock order for demo
      const generatedOrder = {
        id: `ORD${Date.now()}`,
        items: cart,
        total_amount: getTotalAmount(),
        payment_method: method,
        payment_status: method === 'pay_now' ? 'paid' : 'pending',
        order_date: new Date(),
        qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ORDER_${Date.now()}`,
        pickup_code: Math.random().toString(36).substr(2, 8).toUpperCase()
      };
      
      setOrderDetails(generatedOrder);
      setOrderPlaced(true);
      setCart([]);
      setShowCheckout(false);
    }
  };

  const generatePDFReceipt = () => {
    if (!orderDetails) return;

    // Create PDF content using window.print() for simplicity
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Campus Canteen - Order Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: white; color: black; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .order-info { margin: 20px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          .items-table th { background-color: #f5f5f5; }
          .total-row { font-weight: bold; background-color: #f9f9f9; }
          .qr-section { text-align: center; margin: 30px 0; }
          .qr-code { margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          .pickup-code { font-size: 18px; font-weight: bold; background: #e7f3ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .payment-status { padding: 5px 10px; border-radius: 3px; font-weight: bold; }
          .paid { background: #d4edda; color: #155724; }
          .pending { background: #fff3cd; color: #856404; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🏫 Campus Canteen</div>
          <h2>Order Receipt</h2>
        </div>
        
        <div class="order-info">
          <p><strong>Order ID:</strong> ${orderDetails.id}</p>
          <p><strong>Customer:</strong> ${user?.full_name || 'N/A'}</p>
          <p><strong>Email:</strong> ${user?.email || 'N/A'}</p>
          <p><strong>Date & Time:</strong> ${orderDetails.order_date.toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${orderDetails.payment_method === 'pay_now' ? 'Paid Now' : 'Pay Later'}</p>
          <p><strong>Payment Status:</strong> 
            <span class="payment-status ${orderDetails.payment_status === 'paid' ? 'paid' : 'pending'}">
              ${orderDetails.payment_status.toUpperCase()}
            </span>
          </p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderDetails.items.map((item: CartItem) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>₹${item.price}</td>
                <td>₹${item.price * item.quantity}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3"><strong>Total Amount</strong></td>
              <td><strong>₹${orderDetails.total_amount}</strong></td>
            </tr>
          </tbody>
        </table>

        <div class="qr-section">
          <div class="pickup-code">
            <strong>Pickup Code: ${orderDetails.pickup_code}</strong>
          </div>
          <div class="qr-code">
            <img src="${orderDetails.qr_code}" alt="Order QR Code" style="width: 150px; height: 150px;">
          </div>
          <p><strong>Scan QR Code for Order Verification</strong></p>
        </div>

        <div class="footer">
          <p>Thank you for your order!</p>
          <p>Please show this receipt when collecting your order.</p>
          <p>For any queries, contact: canteen@college.edu | +91-98765-43210</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    
    // Auto print after a short delay
    setTimeout(() => {
      printWindow.print();
    }, 1000);
  };

  const renderMenuItem = (item: MenuItem, categoryColor: string) => (
    <div key={item.id} className={`bg-white/5 rounded-lg p-4 border border-white/10 ${!item.available ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <h5 className="font-medium text-white">{item.name}</h5>
        <span className={`font-semibold ${item.available ? 'text-green-400' : 'text-gray-400'}`}>₹{item.price}</span>
      </div>
      {item.description && (
        <p className="text-sm text-gray-400 mb-3">{item.description}</p>
      )}
      <button 
        onClick={() => addToCart(item)}
        disabled={!item.available}
        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
          item.available 
            ? `bg-${categoryColor}-500/20 hover:bg-${categoryColor}-500/30 text-${categoryColor}-400` 
            : 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
        }`}
      >
        {item.available ? 'Add to Cart' : 'Sold Out'}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="canteen" />
      
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header with Cart */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Campus Canteen</h1>
            
            {/* Cart Icon */}
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
          
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            {/* Today's Menu */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Today&apos;s Menu</h3>
              
              {/* Main Course */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-green-400 mb-3">Main Course</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {menuItems.filter(item => item.category === 'main').map(item => renderMenuItem(item, 'green'))}
                </div>
              </div>

              {/* Snacks */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-yellow-400 mb-3">Snacks & Fast Food</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {menuItems.filter(item => item.category === 'snacks').map(item => renderMenuItem(item, 'yellow'))}
                </div>
              </div>

              {/* Beverages */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-blue-400 mb-3">Beverages</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {menuItems.filter(item => item.category === 'beverages').map(item => renderMenuItem(item, 'blue'))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex">
          <div className="ml-auto w-96 bg-gray-800 h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Your Cart</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-white"
                  title="Close cart"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Your cart is empty</p>
                  <p className="text-sm mt-2">Add items from the menu</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map(item => (
                      <div key={item.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{item.name}</h4>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-300"
                            title="Remove from cart"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="bg-red-500/20 text-red-400 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-500/30"
                              title="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="bg-green-500/20 text-green-400 rounded-full w-8 h-8 flex items-center justify-center hover:bg-green-500/30"
                              title="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-gray-400 text-sm">₹{item.price} each</div>
                            <div className="text-green-400 font-semibold">₹{item.price * item.quantity}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-bold text-white">Total:</span>
                      <span className="text-lg font-bold text-green-400">₹{getTotalAmount()}</span>
                    </div>
                    
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl p-6 w-96 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-6">Checkout</h3>
            
            {/* Order Summary */}
            <div className="mb-6">
              <h4 className="font-medium text-white mb-3">Order Summary</h4>
              <div className="space-y-2 text-sm">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-gray-300">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-bold text-white">
                <span>Total:</span>
                <span>₹{getTotalAmount()}</span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="mb-6">
              <h4 className="font-medium text-white mb-3">Payment Method</h4>
              <div className="space-y-3">
                <button
                  onClick={() => handlePayment('pay_now')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Pay Now</span>
                </button>
                
                <button
                  onClick={() => handlePayment('pay_later')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Clock className="w-5 h-5" />
                  <span>Pay Later</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowCheckout(false)}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {orderPlaced && orderDetails && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl p-6 w-[500px] border border-white/10">
            <div className="text-center mb-6">
              <div className="bg-green-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Order Placed Successfully!</h3>
              <p className="text-gray-300">Your order has been confirmed</p>
            </div>

            {/* Order Details */}
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Order ID:</span>
                  <div className="text-white font-medium">{orderDetails.id}</div>
                </div>
                <div>
                  <span className="text-gray-400">Pickup Code:</span>
                  <div className="text-white font-medium">{orderDetails.pickup_code}</div>
                </div>
                <div>
                  <span className="text-gray-400">Total Amount:</span>
                  <div className="text-green-400 font-medium">₹{orderDetails.total_amount}</div>
                </div>
                <div>
                  <span className="text-gray-400">Payment:</span>
                  <div className={`font-medium ${orderDetails.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {orderDetails.payment_status === 'paid' ? 'Paid' : 'Pay Later'}
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center mb-6">
              <div className="bg-white p-4 rounded-lg inline-block">
                <Image 
                  src={orderDetails.qr_code} 
                  alt="Order QR Code" 
                  width={128}
                  height={128}
                  className="w-32 h-32"
                />
              </div>
              <p className="text-gray-400 text-sm mt-2">Show this QR code when collecting your order</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={generatePDFReceipt}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download Receipt (PDF)</span>
              </button>
              
              <button
                onClick={() => setOrderPlaced(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCanteen;
