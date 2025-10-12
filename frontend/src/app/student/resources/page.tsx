'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Book,
  Download,
  Search,
  Filter,
  FileText,
  Video,
  Link as LinkIcon,
  Calendar,
  User,
  Eye,
  Star,
  Clock,
  Tag,
  Plus,
  X,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Type definitions for learning resources
interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'presentation';
  subject: string;
  uploaded_by: string;
  upload_date: string;
  file_size?: number;
  download_count: number;
  rating: number;
  tags: string[];
  file_url?: string;
  thumbnail_url?: string;
}

const LearningResourcesPage = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-downloads'>('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadedResources, setDownloadedResources] = useState<string[]>([]);

  // Fetch learning resources from API
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        try {
          const response = await fetch('/api/resources');
          if (!response.ok) {
            throw new Error('Failed to fetch resources');
          }
          const data = await response.json();
          setResources(data.resources || []);
          setError(null);
        } catch (apiErr) {
          // Set empty resources if API fails
          console.warn('API call failed:', apiErr);
          setResources([]);
          setError('Failed to load resources. Please try again later.');
        }
      } catch (err) {
        setError('Failed to load learning resources');
        console.error('Error fetching resources:', err);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const categories = [
    { id: 'all', name: 'All Resources', icon: Book },
    { id: 'document', name: 'Documents', icon: FileText },
    { id: 'video', name: 'Videos', icon: Video },
    { id: 'presentation', name: 'Presentations', icon: FileText },
    { id: 'link', name: 'Links', icon: LinkIcon }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.type === selectedCategory;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleDownload = async (resource: LearningResource) => {
    try {
      // In production, this would call the download API
      // await fetch(`/api/resources/${resource.id}/download`, { method: 'POST' });

      // Simulate download
      if (resource.file_url) {
        window.open(resource.file_url, '_blank');
        setDownloadedResources(prev => [...prev, resource.id]);
      }
    } catch (err) {
      console.error('Error downloading resource:', err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'video': return Video;
      case 'presentation': return FileText;
      case 'link': return LinkIcon;
      default: return Book;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Header component
  const Header = () => (
    <div className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Resources</h1>
            <p className="text-gray-600 mt-1">Access study materials, documents, videos, and learning resources</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter size={20} />
            </button>
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
            { id: 'browse', label: 'Browse Resources', icon: Book },
            { id: 'my-downloads', label: 'My Downloads', icon: Download }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'browse' | 'my-downloads')}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
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
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
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

  // Resource card
  const ResourceCard = ({ resource }: { resource: LearningResource }) => {
    const TypeIcon = getTypeIcon(resource.type);
    const isDownloaded = downloadedResources.includes(resource.id);

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border hover:shadow-xl transition-shadow">
        <div className="relative">
          <Image
            src={resource.thumbnail_url || '/api/placeholder/400/250'}
            alt={resource.title}
            width={400}
            height={200}
            className="w-full h-40 object-cover"
          />
          <div className="absolute top-2 left-2 flex space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
              {resource.type}
            </span>
            {isDownloaded && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Downloaded
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{resource.title}</h3>
            <div className="flex items-center space-x-1 ml-2">
              <Star size={14} className="text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{resource.rating}</span>
            </div>
          </div>

          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{resource.description}</p>

          <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <User size={14} />
              <span className="truncate">{resource.uploaded_by}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar size={14} />
              <span>{new Date(resource.upload_date).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Subject: {resource.subject}</span>
              <span>{resource.download_count} downloads</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {resource.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {tag}
                </span>
              ))}
              {resource.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{resource.tags.length - 3} more
                </span>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedResource(resource)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm"
            >
              View Details
            </button>
            <button
              onClick={() => handleDownload(resource)}
              className={`flex items-center justify-center space-x-1 py-2 px-4 rounded-lg text-sm ${
                isDownloaded
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Download size={14} />
              <span>{isDownloaded ? 'Downloaded' : 'Download'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Browse resources view
  const BrowseResourcesView = () => (
    <div className="space-y-6">
      <CategoryFilter />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading learning resources...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading resources</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>

            {filteredResources.length === 0 && (
              <div className="text-center py-12">
                <Book className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // My downloads view
  const MyDownloadsView = () => (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Downloads</h2>

      {downloadedResources.length > 0 ? (
        <div className="space-y-4">
          {resources.filter(resource => downloadedResources.includes(resource.id)).map(resource => (
            <div key={resource.id} className="bg-white rounded-xl shadow-lg p-6 border">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{resource.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{resource.description}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-4">
                  Downloaded
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User size={14} className="text-gray-400" />
                  <span>{resource.uploaded_by}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar size={14} className="text-gray-400" />
                  <span>{new Date(resource.upload_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Tag size={14} className="text-gray-400" />
                  <span className="capitalize">{resource.type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Download size={14} className="text-gray-400" />
                  <span>{resource.download_count} total downloads</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Subject: {resource.subject}</span>
                  {resource.file_size && (
                    <>
                      <span>•</span>
                      <span>Size: {formatFileSize(resource.file_size)}</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(resource)}
                  className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Download size={14} />
                  <span>Download Again</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Download className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No downloads yet</h3>
          <p className="mt-1 text-sm text-gray-500">Your downloaded resources will appear here.</p>
          <button
            onClick={() => setActiveTab('browse')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Browse Resources
          </button>
        </div>
      )}
    </div>
  );

  // Resource details modal
  const ResourceDetailsModal = () => (
    selectedResource && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{selectedResource.title}</h2>
              <button
                onClick={() => setSelectedResource(null)}
                className="text-gray-400 hover:text-gray-600"
                title="Close details"
              >
                <X size={24} />
              </button>
            </div>

            <Image
              src={selectedResource.thumbnail_url || '/api/placeholder/400/250'}
              alt={selectedResource.title}
              width={600}
              height={300}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{selectedResource.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="capitalize">{selectedResource.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subject:</span>
                      <span>{selectedResource.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rating:</span>
                      <span>{selectedResource.rating}/5.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Downloads:</span>
                      <span>{selectedResource.download_count}</span>
                    </div>
                    {selectedResource.file_size && (
                      <div className="flex justify-between">
                        <span>File Size:</span>
                        <span>{formatFileSize(selectedResource.file_size)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Uploaded By</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">{selectedResource.uploaded_by}</p>
                    <p className="text-gray-500">Uploaded on {new Date(selectedResource.upload_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedResource.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleDownload(selectedResource)}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <Download size={16} />
                <span>Download Resource</span>
              </button>
              <button
                onClick={() => setSelectedResource(null)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <TabNavigation />

      {activeTab === 'browse' && <BrowseResourcesView />}
      {activeTab === 'my-downloads' && <MyDownloadsView />}

      <ResourceDetailsModal />
    </div>
  );
};

export default LearningResourcesPage;
