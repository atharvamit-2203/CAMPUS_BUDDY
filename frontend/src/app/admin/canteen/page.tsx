'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search, Upload, CheckCircle, AlertCircle, Coffee, Utensils, Moon, Cookie, Glass, Cake } from 'lucide-react';
import Image from 'next/image';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  is_vegetarian: boolean;
  is_available: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface MenuAsset {
  id: number;
  file_name: string;
  mime_type: string;
  created_at: string;
}

interface VerificationResult {
  total_items: number;
  categories: Array<{category: string, count: number}>;
  latest_asset: MenuAsset | null;
  visibility_status: string;
  timestamp: string;
}

const CategoryIcons = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Moon,
  snacks: Cookie,
  beverages: Glass,
  desserts: Cake
};

export default function AdminCanteenPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingMenu, setUploadingMenu] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [latestAsset, setLatestAsset] = useState<MenuAsset | null>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'snacks',
    is_vegetarian: true,
    is_available: true
  });

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    fetchLatestAsset();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/canteen/menu', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setMenuItems(data.items || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/canteen/menu/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLatestAsset = async () => {
    try {
      const response = await fetch('/api/canteen/menu/latest-asset', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setLatestAsset(data);
    } catch (error) {
      console.error('Error fetching latest asset:', error);
    }
  };

  const handleUploadMenu = async (file: File) => {
    setUploadingMenu(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/canteen/menu/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      await response.json();
      alert('Menu uploaded successfully!');
      fetchLatestAsset();
      
      // Auto-verify after upload
      setTimeout(() => {
        verifyMenuVisibility();
      }, 1000);
    } catch (error) {
      console.error('Error uploading menu:', error);
      alert('Error uploading menu');
    } finally {
      setUploadingMenu(false);
    }
  };

  const verifyMenuVisibility = async () => {
    try {
      const response = await fetch('/api/canteen/menu/verify-visibility', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setVerification(data);
      setShowVerification(true);
    } catch (error) {
      console.error('Error verifying menu visibility:', error);
    }
  };

  const addMenuItem = async () => {
    try {
      const response = await fetch('/api/canteen/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newItem)
      });
      
      if (!response.ok) {
        throw new Error('Failed to add menu item');
      }
      
      const result = await response.json();
      setMenuItems([...menuItems, result]);
      setShowAddModal(false);
      setNewItem({
        name: '',
        description: '',
        price: 0,
        category: 'snacks',
        is_vegetarian: true,
        is_available: true
      });
      alert('Menu item added successfully!');
    } catch (error) {
      console.error('Error adding menu item:', error);
      alert('Error adding menu item');
    }
  };

  const updateMenuItem = async (id: number, updates: Partial<MenuItem>) => {
    try {
      const response = await fetch(`/api/canteen/menu/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update menu item');
      }
      
      const result = await response.json();
      setMenuItems(menuItems.map(item => 
        item.id === id ? result.item : item
      ));
      setEditingItem(null);
      alert('Menu item updated successfully!');
    } catch (error) {
      console.error('Error updating menu item:', error);
      alert('Error updating menu item');
    }
  };

  const deleteMenuItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/canteen/menu/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete menu item');
      }
      
      setMenuItems(menuItems.filter(item => item.id !== id));
      alert('Menu item deleted successfully!');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Error deleting menu item');
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryStats = () => {
    const stats = categories.map(cat => ({
      ...cat,
      count: menuItems.filter(item => item.category === cat.id && item.is_available).length
    }));
    return stats;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Canteen Management</h1>
              <p className="text-gray-600 mt-2">Manage menu items, categories, and verify visibility</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={verifyMenuVisibility}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Verify Visibility</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Menu Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-purple-600" />
            Upload Menu (Image/PDF)
          </h2>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadMenu(file);
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={uploadingMenu}
              title="Upload menu file"
              aria-label="Upload menu file"
            />
            {uploadingMenu && (
              <div className="text-blue-600">Uploading...</div>
            )}
          </div>
          {latestAsset && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                Latest upload: {latestAsset.file_name} • {new Date(latestAsset.created_at).toLocaleString()}
              </div>
              {latestAsset.mime_type?.startsWith('image/') && (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={`/api/canteen/menu/assets/${latestAsset.id}/content`} 
                  alt={`Menu uploaded: ${latestAsset.file_name}`}
                  className="max-h-64 rounded border"
                />
              )}
            </div>
          )}
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {getCategoryStats().map((category) => {
            const IconComponent = CategoryIcons[category.id as keyof typeof CategoryIcons];
            return (
              <div key={category.id} className="bg-white rounded-lg shadow-md p-4 text-center">
                <div className="flex justify-center mb-2">
                  {IconComponent && <IconComponent className="w-8 h-8 text-blue-600" />}
                </div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-2xl font-bold text-blue-600">{category.count}</p>
                <p className="text-xs text-gray-500">items</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Select category filter"
                aria-label="Select category filter"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {filteredItems.length} of {menuItems.length} items
            </div>
          </div>
        </div>

        {/* Menu Items Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.is_vegetarian 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.is_vegetarian ? '🥬 Veg' : '🍖 Non-Veg'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.is_available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit item"
                          aria-label="Edit item"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMenuItem(item.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete item"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Add Menu Item</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Item name"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <input
                type="number"
                placeholder="Price"
                value={newItem.price}
                onChange={(e) => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                title="Select category"
                aria-label="Select category"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newItem.is_vegetarian}
                    onChange={(e) => setNewItem({...newItem, is_vegetarian: e.target.checked})}
                    className="mr-2"
                  />
                  Vegetarian
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newItem.is_available}
                    onChange={(e) => setNewItem({...newItem, is_available: e.target.checked})}
                    className="mr-2"
                  />
                  Available
                </label>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={addMenuItem}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Add Item
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewItem({
                    name: '',
                    description: '',
                    price: 0,
                    category: 'snacks',
                    is_vegetarian: true,
                    is_available: true
                  });
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Edit Menu Item</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Item name"
                value={editingItem.name}
                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <input
                type="number"
                placeholder="Price"
                value={editingItem.price}
                onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={editingItem.category}
                onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                title="Select category"
                aria-label="Select category"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingItem.is_vegetarian}
                    onChange={(e) => setEditingItem({...editingItem, is_vegetarian: e.target.checked})}
                    className="mr-2"
                  />
                  Vegetarian
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingItem.is_available}
                    onChange={(e) => setEditingItem({...editingItem, is_available: e.target.checked})}
                    className="mr-2"
                  />
                  Available
                </label>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => updateMenuItem(editingItem.id, editingItem)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Update Item
              </button>
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerification && verification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Menu Visibility Verification</h2>
              <button
                onClick={() => setShowVerification(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {verification.visibility_status === 'verified' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
                <span className={`font-semibold ${
                  verification.visibility_status === 'verified' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {verification.visibility_status === 'verified' ? 'Menu Visible' : 'No Menu Items'}
                </span>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Total Items: <span className="font-medium">{verification.total_items}</span>
                </p>
                
                <h4 className="font-medium mb-2">Items by Category:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {verification.categories.map((cat) => (
                    <div key={cat.category} className="flex justify-between text-sm">
                      <span className="capitalize">{cat.category}:</span>
                      <span className="font-medium">{cat.count}</span>
                    </div>
                  ))}
                </div>
                
                {verification.latest_asset && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      Latest Upload: <span className="font-medium">{verification.latest_asset.file_name}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(verification.latest_asset.created_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500">
                Verified at: {new Date(verification.timestamp).toLocaleString()}
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowVerification(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}