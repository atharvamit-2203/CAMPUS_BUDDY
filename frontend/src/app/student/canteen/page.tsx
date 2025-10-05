'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { facultyAPI } from '../../../services/roleBasedAPI';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Filter,
  Clock,
  Star,
  Heart,
  X,
  CreditCard,
  Utensils,
  Coffee,
  Cookie,
  ChefHat,
  Truck,
  Timer
} from 'lucide-react';

// Type definitions
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'beverages' | 'desserts';
  image: string;
  isVeg: boolean;
  rating: number;
  prepTime: string;
  availability: boolean;
  spiceLevel?: 'mild' | 'medium' | 'spicy';
  tags: string[];
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderTime: string;
  estimatedTime: string;
  paymentMethod: string;
  deliveryLocation?: string;
}

const CanteenPage = () => {
  const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'orders'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch menu data from API
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const data = await facultyAPI.getCanteenMenu();

        // Transform API data to match component interface
        const transformedItems: MenuItem[] = [];
        Object.entries(data).forEach(([category, items]: [string, any[]]) => {
          items.forEach((item: any) => {
            transformedItems.push({
              id: item.id,
              name: item.name,
              description: item.description || '',
              price: item.price,
              category: category.toLowerCase() as MenuItem['category'],
              image: item.image || '/api/placeholder/300/200',
              isVeg: item.category?.toLowerCase().includes('veg') || !item.category?.toLowerCase().includes('chicken') && !item.category?.toLowerCase().includes('fish'),
              rating: 4.0, // Default rating since API doesn't provide
              prepTime: '15 mins', // Default prep time
              availability: true, // Default availability
              tags: [category.toLowerCase()]
            });
          });
        });

        setMenuItems(transformedItems);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load menu');
        console.error('Error fetching menu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  const categories = [
    { id: 'all', name: 'All Items', icon: Utensils },
    { id: 'breakfast', name: 'Breakfast', icon: Coffee },
    { id: 'lunch', name: 'Lunch', icon: ChefHat },
    { id: 'snacks', name: 'Snacks', icon: Cookie },
    { id: 'beverages', name: 'Beverages', icon: Coffee },
    { id: 'desserts', name: 'Desserts', icon: Cookie }
  ];

  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find(item => item.menuItem.id === menuItem.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.menuItem.id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { menuItem, quantity: 1 }]);
    }
  };

  const removeFromCart = (menuItemId: string) => {
    const existingItem = cart.find(item => item.menuItem.id === menuItemId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item =>
        item.menuItem.id === menuItemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.menuItem.id !== menuItemId));
    }
  };

  const getCartItemCount = (menuItemId: string) => {
    const item = cart.find(item => item.menuItem.id === menuItemId);
    return item ? item.quantity : 0;
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const placeOrder = (paymentMethod: string, deliveryLocation?: string) => {
    const newOrder: Order = {
      id: Date.now().toString(),
      items: [...cart],
      total: getCartTotal(),
      status: 'pending',
      orderTime: new Date().toLocaleTimeString(),
      estimatedTime: '20-25 mins',
      paymentMethod,
      deliveryLocation
    };
    setOrders([newOrder, ...orders]);
    setCart([]);
    setShowCheckout(false);
    
    // Simulate order status updates
    setTimeout(() => {
      setOrders(prevOrders => prevOrders.map(order =>
        order.id === newOrder.id ? { ...order, status: 'confirmed' } : order
      ));
    }, 2000);
    
    setTimeout(() => {
      setOrders(prevOrders => prevOrders.map(order =>
        order.id === newOrder.id ? { ...order, status: 'preparing' } : order
      ));
    }, 5000);
    
    setTimeout(() => {
      setOrders(prevOrders => prevOrders.map(order =>
        order.id === newOrder.id ? { ...order, status: 'ready' } : order
      ));
    }, 20000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'preparing': return 'text-orange-600 bg-orange-100';
      case 'ready': return 'text-green-600 bg-green-100';
      case 'delivered': return 'text-purple-600 bg-purple-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSpiceLevelColor = (level?: string) => {
    switch (level) {
      case 'mild': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'spicy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Header component
  const Header = () => (
    <div className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campus Canteen</h1>
            <p className="text-gray-600 mt-1">Order fresh, delicious meals delivered to your location</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter size={20} />
            </button>
            <div className="relative">
              <button
                onClick={() => setActiveTab('cart')}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
              >
                <ShoppingCart size={16} />
                <span>Cart ({cart.length})</span>
              </button>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </div>
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
            { id: 'menu', label: 'Menu', icon: Utensils },
            { id: 'cart', label: `Cart (${cart.length})`, icon: ShoppingCart },
            { id: 'orders', label: 'My Orders', icon: Truck }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'menu' | 'cart' | 'orders')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-orange-500 text-orange-600'
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
                  ? 'bg-orange-100 border-orange-500 text-orange-700'
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

  // Menu item card
  const MenuItemCard = ({ item }: { item: MenuItem }) => {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
        <div className="relative">
          <Image
            src={item.image}
            alt={item.name}
            width={300}
            height={200}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 left-2 flex space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}
            </span>
            {item.spiceLevel && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gray-100 ${getSpiceLevelColor(item.spiceLevel)}`}>
                🌶️ {item.spiceLevel}
              </span>
            )}
          </div>
          <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
            <Heart size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
            <span className="text-lg font-bold text-orange-600">₹{item.price}</span>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

          <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Star size={14} className="text-yellow-400 fill-current" />
              <span>{item.rating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={14} />
              <span>{item.prepTime}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                #{tag}
              </span>
            ))}
          </div>

          {item.availability ? (
            <div className="flex items-center justify-between">
              {getCartItemCount(item.id) > 0 ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="bg-orange-100 text-orange-600 p-2 rounded-lg hover:bg-orange-200"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-semibold text-lg">{getCartItemCount(item.id)}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="bg-orange-100 text-orange-600 p-2 rounded-lg hover:bg-orange-200"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCart(item)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add to Cart</span>
                </button>
              )}
            </div>
          ) : (
            <button
              disabled
              className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg cursor-not-allowed"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    );
  };

  // Menu view
  const MenuView = () => {
    if (loading) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Loading size="lg" text="Loading menu..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorMessage
            message={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <CategoryFilter />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenuItems.map(item => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>

          {filteredMenuItems.length === 0 && (
            <div className="text-center py-12">
              <Utensils className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Cart view
  const CartView = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {cart.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Your Cart</h2>
            {cart.map(item => (
              <div key={item.menuItem.id} className="bg-white rounded-xl shadow-lg p-6 border">
                <div className="flex items-center space-x-4">
                  <Image
                    src={item.menuItem.image}
                    alt={item.menuItem.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.menuItem.name}</h3>
                    <p className="text-gray-600 text-sm">{item.menuItem.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-orange-600">₹{item.menuItem.price}</span>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => removeFromCart(item.menuItem.id)}
                          className="bg-gray-100 text-gray-600 p-1 rounded hover:bg-gray-200"
                          title="Decrease quantity"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item.menuItem)}
                          className="bg-gray-100 text-gray-600 p-1 rounded hover:bg-gray-200"
                          title="Increase quantity"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setCart(cart.filter(cartItem => cartItem.menuItem.id !== item.menuItem.id))}
                    className="text-red-600 hover:text-red-800"
                    title="Remove item"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {cart.map(item => (
                  <div key={item.menuItem.id} className="flex justify-between text-sm">
                    <span>{item.menuItem.name} x{item.quantity}</span>
                    <span>₹{item.menuItem.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-orange-600">₹{getCartTotal()}</span>
                </div>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 mt-4 flex items-center justify-center space-x-2"
              >
                <CreditCard size={16} />
                <span>Proceed to Checkout</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
          <p className="mt-1 text-sm text-gray-500">Add some delicious items to your cart to get started.</p>
          <button
            onClick={() => setActiveTab('menu')}
            className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Browse Menu
          </button>
        </div>
      )}
    </div>
  );

  // Orders view
  const OrdersView = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-lg p-6 border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
                  <p className="text-gray-600 text-sm">Placed at {order.orderTime}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                {order.items.map(item => (
                  <div key={item.menuItem.id} className="flex justify-between text-sm">
                    <span>{item.menuItem.name} x{item.quantity}</span>
                    <span>₹{item.menuItem.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Timer size={14} />
                    <span>Est. time: {order.estimatedTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CreditCard size={14} />
                    <span>{order.paymentMethod}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">₹{order.total}</div>
                  {order.status === 'ready' && (
                    <button className="text-green-600 text-sm font-medium hover:text-green-800">
                      Mark as Picked Up
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Truck className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
          <p className="mt-1 text-sm text-gray-500">Your order history will appear here once you place your first order.</p>
          <button
            onClick={() => setActiveTab('menu')}
            className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
          >
            Start Ordering
          </button>
        </div>
      )}
    </div>
  );

  // Checkout modal
  const CheckoutModal = () => {
    return showCheckout ? (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Checkout</h3>
            <button
              onClick={() => setShowCheckout(false)}
              className="text-gray-400 hover:text-gray-600"
              title="Close checkout"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg"
                title="Select delivery location"
              >
                <option>Cafeteria - Pick up</option>
                <option>Library - Ground Floor</option>
                <option>CS Department - 3rd Floor</option>
                <option>Main Building - Reception</option>
                <option>Hostel Block A</option>
                <option>Sports Complex</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <div className="space-y-2">
                <button
                  onClick={() => placeOrder('UPI')}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard size={16} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">UPI Payment</div>
                      <div className="text-sm text-gray-500">Pay with Google Pay, PhonePe, Paytm</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => placeOrder('Cash on Delivery')}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck size={16} className="text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">Cash on Delivery</div>
                      <div className="text-sm text-gray-500">Pay when you receive your order</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount</span>
                <span className="text-orange-600">₹{getCartTotal()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TabNavigation />
      
      {activeTab === 'menu' && <MenuView />}
      {activeTab === 'cart' && <CartView />}
      {activeTab === 'orders' && <OrdersView />}
      
      <CheckoutModal />
    </div>
  );
};

export default CanteenPage;
