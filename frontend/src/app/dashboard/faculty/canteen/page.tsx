'use client';

import { useState, useEffect } from 'react';
import { 
  FiShoppingCart, 
  FiClock, 
  FiStar, 
  FiPlus, 
  FiMinus,
  FiCheckCircle,
  FiTruck,
  FiFilter,
  FiSearch,
  FiCreditCard,
  FiMapPin,
  FiPhone,
  FiCalendar
} from 'react-icons/fi';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'beverages';
  image: string;
  rating: number;
  availability: boolean;
  preparationTime: number;
  isVeg: boolean;
  calories?: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

interface Order {
  id: number;
  items: CartItem[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderTime: string;
  deliveryTime?: string;
  deliveryLocation: string;
}

export default function FacultyCanteenPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('Faculty Lounge');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch menu items from API
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : '';
        
        // Fetch menu items
        const menuResponse = await fetch(`${API}/canteen/menu`, { 
          headers: { Authorization: `Bearer ${token}` }
        });
        const menuData = await menuResponse.json();
        
        // Process menu items
        const items: any[] = Array.isArray(menuData.items) ? menuData.items : [];
        
        // Check if we got menu items from the API
        if (items.length > 0) {
          const mappedItems: MenuItem[] = items.map((item: any) => ({
            id: Number(item.id),
            name: item.name || item.item_name || 'Item',
            description: item.description || '',
            price: Number(item.price || 0),
            category: item.category || 'snacks',
            image: item.image_url || '/images/default-food.jpg',
            rating: item.rating || 4.0,
            availability: (item.is_available ?? 1) === 1,
            preparationTime: item.preparation_time || 10,
            isVeg: item.is_vegetarian === 1,
            calories: item.calories || undefined
          }));
          setMenuItems(mappedItems);
          console.log('Loaded menu items from API:', mappedItems.length);
        } else {
          setMenuItems([]);
        }
        
        // Fetch orders (or use mock data for demo)
        try {
          const ordersResponse = await fetch(`${API}/canteen/orders`, { 
            headers: { Authorization: `Bearer ${token}` }
          });
          const ordersData = await ordersResponse.json();
          if (Array.isArray(ordersData) && ordersData.length > 0) {
            setOrders(ordersData);
          } else {
            setOrders([]);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
          setOrders([]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId: number) => {
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(cartItem => 
        cartItem.id === itemId 
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.id !== itemId));
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const placeOrder = () => {
    const newOrder: Order = {
      id: Date.now(),
      items: [...cart],
      total: getCartTotal(),
      status: 'pending',
      orderTime: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }),
      deliveryLocation
    };
    
    setOrders([newOrder, ...orders]);
    setCart([]);
    setShowCart(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FiClock className="text-yellow-500" />;
      case 'preparing': return <FiTruck className="text-blue-500" />;
      case 'ready': return <FiCheckCircle className="text-green-500" />;
      case 'delivered': return <FiCheckCircle className="text-gray-500" />;
      case 'cancelled': return <FiCheckCircle className="text-red-500" />;
      default: return <FiClock className="text-gray-500" />;
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Faculty Canteen</h1>
            <p className="text-gray-600">Order delicious meals delivered to your location</p>
          </div>
          <button 
            onClick={() => setShowCart(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center relative"
          >
            <FiShoppingCart className="mr-2" />
            Cart
            {getCartItemCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getCartItemCount()}
              </span>
            )}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiShoppingCart className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiClock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter(order => order.status === 'pending' || order.status === 'preparing').length}
            </p>
            <p className="text-sm text-gray-600">Active Orders</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiCheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {orders.filter(order => order.status === 'ready').length}
            </p>
            <p className="text-sm text-gray-600">Ready for Pickup</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <FiCreditCard className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              ₹{orders.reduce((sum, order) => sum + order.total, 0)}
            </p>
            <p className="text-sm text-gray-600">Total Spent</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snacks">Snacks</option>
              <option value="beverages">Beverages</option>
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
            >
              <option value="Faculty Lounge">Faculty Lounge</option>
              <option value="Computer Science Department">Computer Science Department</option>
              <option value="Mathematics Department">Mathematics Department</option>
              <option value="Physics Department">Physics Department</option>
              <option value="Main Office">Main Office</option>
            </select>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Menu</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900 flex items-center">
                            {item.name}
                            {item.isVeg && (
                              <span className="ml-2 w-3 h-3 bg-green-500 rounded-full border border-green-600"></span>
                            )}
                            {!item.isVeg && (
                              <span className="ml-2 w-3 h-3 bg-red-500 rounded-full border border-red-600"></span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.availability ? 'Available' : 'Out of Stock'}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-3">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <FiStar 
                              key={i} 
                              className={`h-4 w-4 ${i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                          <span className="text-sm text-gray-600 ml-1">({item.rating})</span>
                        </div>
                        <div className="ml-auto flex items-center text-sm text-gray-600">
                          <FiClock className="mr-1" />
                          {item.preparationTime} min
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="text-lg font-bold text-gray-900">₹{item.price}</div>
                        {item.calories && (
                          <div className="text-sm text-gray-600">{item.calories} cal</div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {cart.find(cartItem => cartItem.id === item.id) ? (
                            <>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                              >
                                <FiMinus className="h-4 w-4" />
                              </button>
                              <span className="text-lg font-medium">
                                {cart.find(cartItem => cartItem.id === item.id)?.quantity || 0}
                              </span>
                              <button 
                                onClick={() => addToCart(item)}
                                className="w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center"
                              >
                                <FiPlus className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => addToCart(item)}
                              disabled={!item.availability}
                              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                item.availability 
                                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">Order #{order.id}</h3>
                          <p className="text-sm text-gray-600">{order.orderTime}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t">
                        <div className="flex items-center text-sm text-gray-600">
                          <FiMapPin className="mr-1" />
                          {order.deliveryLocation}
                        </div>
                        <div className="font-bold text-gray-900">₹{order.total}</div>
                      </div>

                      {order.status === 'ready' && (
                        <div className="mt-3">
                          <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm">
                            Mark as Collected
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Modal */}
        {showCart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Cart</h3>
                <button 
                  onClick={() => setShowCart(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {cart.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">₹{item.price} each</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <FiMinus className="h-3 w-3" />
                          </button>
                          <span className="text-lg font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => addToCart(item)}
                            className="w-6 h-6 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center text-xs"
                          >
                            <FiPlus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total: ₹{getCartTotal()}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Location
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={deliveryLocation}
                      onChange={(e) => setDeliveryLocation(e.target.value)}
                    >
                      <option value="Faculty Lounge">Faculty Lounge</option>
                      <option value="Computer Science Department">Computer Science Department</option>
                      <option value="Mathematics Department">Mathematics Department</option>
                      <option value="Physics Department">Physics Department</option>
                      <option value="Main Office">Main Office</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={placeOrder}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium"
                  >
                    Place Order
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
