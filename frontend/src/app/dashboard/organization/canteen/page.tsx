'use client';

import { useState, useEffect } from 'react';
import RoleBasedNavigation from '@/components/RoleBasedNavigation';
import { 
  ShoppingCart, 
  Clock, 
  Star, 
  Plus, 
  Minus,
  CheckCircle,
  Truck,
  Filter,
  Search,
  CreditCard,
  MapPin,
  Phone,
  Calendar,
  Users,
  FileText
} from 'lucide-react';

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
  eventDetails?: string;
  isApproved?: boolean;
}

export default function OrganizationCanteenPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('Event Hall');
  const [eventDetails, setEventDetails] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [orderType, setOrderType] = useState<'regular' | 'event'>('regular');

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
          
          // Add bulk items for organizations
          const bulkItems: MenuItem[] = [
            {
              id: 1000 + mappedItems.length,
              name: 'Bulk Snack Platter (25 pcs)',
              description: 'Assorted snacks including samosas, pakoras, and sandwiches',
              price: 750,
              category: 'snacks',
              image: '/images/snack-platter.jpg',
              rating: 4.7,
              availability: true,
              preparationTime: 30,
              isVeg: true,
              calories: 2500
            },
            {
              id: 1001 + mappedItems.length,
              name: 'Bulk Biryani (10 servings)',
              description: 'Large portion of biryani suitable for events',
              price: 1800,
              category: 'lunch',
              image: '/images/bulk-biryani.jpg',
              rating: 4.8,
              availability: true,
              preparationTime: 60,
              isVeg: false,
              calories: 5000
            },
            {
              id: 1002 + mappedItems.length,
              name: 'Dessert Platter (20 pcs)',
              description: 'Assorted Indian sweets and desserts',
              price: 600,
              category: 'snacks',
              image: '/images/dessert-platter.jpg',
              rating: 4.6,
              availability: true,
              preparationTime: 20,
              isVeg: true,
              calories: 3000
            }
          ];
          
          setMenuItems([...mappedItems, ...bulkItems]);
          console.log('Loaded menu items from API:', mappedItems.length);
        } else {
          // If no items from API, check if there's a latest menu asset
          try {
            const assetResp = await fetch(`${API}/canteen/menu/latest-asset`, { 
              headers: { Authorization: `Bearer ${token}` }
            });
            const assetData = await assetResp.json();
            
            if (assetData && assetData.id) {
              console.log('Found menu asset, but no menu items. Asset ID:', assetData.id);
              // We have a menu asset but no menu items - this might be the issue
              // Try to verify menu visibility which might trigger menu item generation
              const verifyResp = await fetch(`${API}/canteen/menu/verify-visibility`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              await verifyResp.json();
              
              // Try fetching menu items again
              const retryResp = await fetch(`${API}/canteen/menu`, { 
                headers: { Authorization: `Bearer ${token}` }
              });
              const retryData = await retryResp.json();
              const retryItems: any[] = Array.isArray(retryData.items) ? retryData.items : [];
              
              if (retryItems.length > 0) {
                const mappedItems: MenuItem[] = retryItems.map((item: any) => ({
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
                
                // Add bulk items for organizations
                const bulkItems: MenuItem[] = [
                  {
                    id: 1000 + mappedItems.length,
                    name: 'Bulk Snack Platter (25 pcs)',
                    description: 'Assorted snacks including samosas, pakoras, and sandwiches',
                    price: 750,
                    category: 'snacks',
                    image: '/images/snack-platter.jpg',
                    rating: 4.7,
                    availability: true,
                    preparationTime: 30,
                    isVeg: true,
                    calories: 2500
                  },
                  {
                    id: 1001 + mappedItems.length,
                    name: 'Bulk Biryani (10 servings)',
                    description: 'Large portion of biryani suitable for events',
                    price: 1800,
                    category: 'lunch',
                    image: '/images/bulk-biryani.jpg',
                    rating: 4.8,
                    availability: true,
                    preparationTime: 60,
                    isVeg: false,
                    calories: 5000
                  },
                  {
                    id: 1002 + mappedItems.length,
                    name: 'Dessert Platter (20 pcs)',
                    description: 'Assorted Indian sweets and desserts',
                    price: 600,
                    category: 'snacks',
                    image: '/images/dessert-platter.jpg',
                    rating: 4.6,
                    availability: true,
                    preparationTime: 20,
                    isVeg: true,
                    calories: 3000
                  }
                ];
                
                setMenuItems([...mappedItems, ...bulkItems]);
                console.log('Loaded menu items after verification:', mappedItems.length);
              } else {
                // Still no items, use fallback data
                setMenuItems(getFallbackMenuItems());
              }
            } else {
              // No menu asset found, use fallback data
              setMenuItems(getFallbackMenuItems());
            }
          } catch (assetError) {
            console.error('Error checking menu asset:', assetError);
            setMenuItems(getFallbackMenuItems());
          }
        }
        
        // Mock orders for organization
        const mockOrders: Order[] = [
          {
            id: 1,
            items: [
              { ...getFallbackMenuItems()[7], quantity: 2 },
              { ...getFallbackMenuItems()[8], quantity: 1 }
            ],
            total: 4200,
            status: 'pending',
            orderTime: '10:30 AM',
            deliveryLocation: 'Auditorium',
            eventDetails: 'Annual Tech Symposium on Sept 30, 2025. Expected attendance: 100 students.',
            isApproved: false
          },
          {
            id: 2,
            items: [
              { ...getFallbackMenuItems()[6], quantity: 3 }
            ],
            total: 2250,
            status: 'approved',
            orderTime: '09:15 AM',
            deliveryTime: '12:00 PM',
            deliveryLocation: 'Conference Room B',
            eventDetails: 'Club Orientation Meeting on Sept 25, 2025. Expected attendance: 50 students.',
            isApproved: true
          }
        ];
        
        setOrders(mockOrders);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
        setMenuItems(getFallbackMenuItems());
      }
    };
    
    // Fallback menu items function
    function getFallbackMenuItems(): MenuItem[] {
      return [
        {
          id: 1,
          name: 'Masala Dosa',
          description: 'Crispy South Indian crepe with spiced potato filling',
          price: 120,
          category: 'breakfast',
          image: '/images/masala-dosa.jpg',
          rating: 4.5,
          availability: true,
          preparationTime: 15,
          isVeg: true,
          calories: 350
        },
        {
          id: 2,
          name: 'Veg Thali',
          description: 'Complete Indian meal with rice, dal, vegetables, roti',
          price: 180,
          category: 'lunch',
          image: '/images/veg-thali.jpg',
          rating: 4.8,
          availability: true,
          preparationTime: 10,
          isVeg: true,
          calories: 650
        },
        {
          id: 3,
          name: 'Chicken Biryani',
          description: 'Aromatic basmati rice with tender chicken pieces',
          price: 220,
          category: 'lunch',
          image: '/images/chicken-biryani.jpg',
          rating: 4.7,
          availability: true,
          preparationTime: 20,
          isVeg: false,
          calories: 580
        },
        {
          id: 4,
          name: 'Coffee',
          description: 'Hot filter coffee with milk',
          price: 25,
          category: 'beverages',
          image: '/images/coffee.jpg',
          rating: 4.2,
          availability: true,
          preparationTime: 5,
          isVeg: true,
          calories: 50
        },
        {
          id: 5,
          name: 'Samosa',
          description: 'Crispy fried pastry with spiced potato filling',
          price: 15,
          category: 'snacks',
          image: '/images/samosa.jpg',
          rating: 4.3,
          availability: true,
          preparationTime: 2,
          isVeg: true,
          calories: 150
        },
        {
          id: 6,
          name: 'Paneer Butter Masala',
          description: 'Cottage cheese in rich tomato gravy with rice/roti',
          price: 200,
          category: 'dinner',
          image: '/images/paneer-butter-masala.jpg',
          rating: 4.6,
          availability: false,
          preparationTime: 15,
          isVeg: true,
          calories: 480
        },
        {
          id: 7,
          name: 'Bulk Snack Platter (25 pcs)',
          description: 'Assorted snacks including samosas, pakoras, and sandwiches',
          price: 750,
          category: 'snacks',
          image: '/images/snack-platter.jpg',
          rating: 4.7,
          availability: true,
          preparationTime: 30,
          isVeg: true,
          calories: 2500
        },
        {
          id: 8,
          name: 'Bulk Biryani (10 servings)',
          description: 'Large portion of biryani suitable for events',
          price: 1800,
          category: 'lunch',
          image: '/images/bulk-biryani.jpg',
          rating: 4.8,
          availability: true,
          preparationTime: 60,
          isVeg: false,
          calories: 5000
        },
        {
          id: 9,
          name: 'Dessert Platter (20 pcs)',
          description: 'Assorted Indian sweets and desserts',
          price: 600,
          category: 'snacks',
          image: '/images/dessert-platter.jpg',
          rating: 4.6,
          availability: true,
          preparationTime: 20,
          isVeg: true,
          calories: 3000
        }
      ];
    }

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
      status: orderType === 'event' ? 'pending' : 'preparing',
      orderTime: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }),
      deliveryLocation,
      eventDetails: orderType === 'event' ? eventDetails : undefined,
      isApproved: orderType === 'event' ? false : true
    };
    
    setOrders([newOrder, ...orders]);
    setCart([]);
    setShowCart(false);
    setShowEventForm(false);
    setEventDetails('');
    setOrderType('regular');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="text-yellow-500" />;
      case 'approved': return <CheckCircle className="text-purple-500" />;
      case 'preparing': return <Truck className="text-blue-500" />;
      case 'ready': return <CheckCircle className="text-green-500" />;
      case 'delivered': return <CheckCircle className="text-gray-500" />;
      case 'cancelled': return <CheckCircle className="text-red-500" />;
      default: return <Clock className="text-gray-500" />;
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex">
      <RoleBasedNavigation currentPage="/dashboard/organization/canteen" />
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Organization Canteen</h1>
            <p className="text-gray-300">Order food for your events and meetings</p>
          </div>
          <button 
            onClick={() => setShowCart(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center relative"
          >
            <ShoppingCart className="mr-2" />
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
          <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
            <ShoppingCart className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{orders.length}</p>
            <p className="text-sm text-gray-400">Total Orders</p>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
            <Clock className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {orders.filter(order => order.status === 'pending' || order.status === 'preparing').length}
            </p>
            <p className="text-sm text-gray-400">Pending Orders</p>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {orders.filter(order => order.isApproved).length}
            </p>
            <p className="text-sm text-gray-400">Approved Orders</p>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-xl p-6 text-center">
            <CreditCard className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              ₹{orders.reduce((sum, order) => sum + order.total, 0)}
            </p>
            <p className="text-sm text-gray-400">Total Spent</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
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
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
            >
              <option value="Event Hall">Event Hall</option>
              <option value="Auditorium">Auditorium</option>
              <option value="Conference Room A">Conference Room A</option>
              <option value="Conference Room B">Conference Room B</option>
              <option value="Club Room">Club Room</option>
              <option value="Outdoor Lawn">Outdoor Lawn</option>
            </select>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2">
            <div className="bg-black/40 border border-white/10 rounded-xl">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Menu</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredItems.map((item) => (
                    <div key={item.id} className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-white flex items-center">
                            {item.name}
                            {item.isVeg && (
                              <span className="ml-2 inline-block w-4 h-4 bg-green-500 rounded-full"></span>
                            )}
                          </h3>
                          <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">₹{item.price}</div>
                          <div className="flex items-center text-gray-400 text-xs mt-1">
                            <Star className="w-3 h-3 text-yellow-400 mr-1" />
                            {item.rating}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-400">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {item.preparationTime} min
                        </div>
                        <button
                          onClick={() => addToCart(item)}
                          disabled={!item.availability}
                          className={`px-3 py-1 rounded-lg flex items-center ${
                            item.availability
                              ? 'bg-blue-500 hover:bg-blue-600 text-white'
                              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Orders */}
          <div>
            <div className="bg-black/40 border border-white/10 rounded-xl">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
              </div>
              <div className="p-6">
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-white/10 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-white">Order #{order.id}</h3>
                            <p className="text-gray-400 text-sm">{order.orderTime}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs flex items-center ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {order.deliveryLocation}
                        </div>
                        {order.eventDetails && (
                          <div className="bg-white/5 border border-white/10 rounded p-2 mb-3 text-sm text-gray-300">
                            <FileText className="w-3 h-3 inline mr-1" />
                            <span className="font-medium">Event Details:</span> {order.eventDetails}
                          </div>
                        )}
                        <div className="space-y-2 mb-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-300">
                                {item.quantity} x {item.name}
                              </span>
                              <span className="text-white">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-white/10 pt-2 flex justify-between font-medium">
                          <span className="text-gray-300">Total</span>
                          <span className="text-white">₹{order.total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">No orders yet</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cart Modal */}
        {showCart && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Your Cart</h2>
                <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-white">
                  <Minus className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                {cart.length > 0 ? (
                  <>
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between items-center border-b border-white/10 pb-4">
                          <div>
                            <h3 className="font-medium text-white">{item.name}</h3>
                            <p className="text-gray-400 text-sm">₹{item.price} each</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded-full flex items-center justify-center"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white w-8 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => addToCart(item)}
                              className="bg-blue-500 hover:bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between text-lg font-medium mb-4">
                        <span className="text-gray-300">Total</span>
                        <span className="text-white">₹{getCartTotal()}</span>
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4">
                        <h3 className="font-medium text-white mb-2">Delivery Location</h3>
                        <select
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white mb-4"
                          value={deliveryLocation}
                          onChange={(e) => setDeliveryLocation(e.target.value)}
                        >
                          <option value="Event Hall">Event Hall</option>
                          <option value="Auditorium">Auditorium</option>
                          <option value="Conference Room A">Conference Room A</option>
                          <option value="Conference Room B">Conference Room B</option>
                          <option value="Club Room">Club Room</option>
                          <option value="Outdoor Lawn">Outdoor Lawn</option>
                        </select>
                        
                        <div className="flex items-center mb-4">
                          <input
                            type="radio"
                            id="regular-order"
                            name="order-type"
                            checked={orderType === 'regular'}
                            onChange={() => {
                              setOrderType('regular');
                              setShowEventForm(false);
                            }}
                            className="mr-2"
                          />
                          <label htmlFor="regular-order" className="text-white">Regular Order</label>
                          
                          <input
                            type="radio"
                            id="event-order"
                            name="order-type"
                            checked={orderType === 'event'}
                            onChange={() => {
                              setOrderType('event');
                              setShowEventForm(true);
                            }}
                            className="ml-6 mr-2"
                          />
                          <label htmlFor="event-order" className="text-white">Event Order (Requires Approval)</label>
                        </div>
                        
                        {showEventForm && (
                          <div>
                            <h3 className="font-medium text-white mb-2">Event Details</h3>
                            <textarea
                              placeholder="Provide details about your event (date, time, expected attendance, purpose)"
                              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white h-24"
                              value={eventDetails}
                              onChange={(e) => setEventDetails(e.target.value)}
                            ></textarea>
                            <p className="text-yellow-400 text-sm mt-2">
                              <Clock className="w-4 h-4 inline mr-1" />
                              Event orders require admin approval and must be placed at least 24 hours in advance.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <button 
                        onClick={() => setShowCart(false)}
                        className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10"
                      >
                        Continue Shopping
                      </button>
                      <button 
                        onClick={placeOrder}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Place Order
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Your cart is empty</p>
                    <button 
                      onClick={() => setShowCart(false)}
                      className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                    >
                      Browse Menu
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}