'use client';

import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface MenuItem {
  name: string;
  price: number;
  category: string;
  is_vegetarian: boolean;
}

interface MenuUploaderProps {
  onUploadComplete?: () => void;
}

const MenuUploader: React.FC<MenuUploaderProps> = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewItems, setPreviewItems] = useState<MenuItem[]>([]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload an image (JPG, PNG) or PDF file');
      return;
    }

    try {
      setUploading(true);
      setProcessing(true);
      setError('');
      setSuccess('');
      setPreviewItems([]);

      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('authToken');

      // Upload and process with Gemini OCR
      const formData = new FormData();
      formData.append('file', file);
      formData.append('replace', 'true'); // Replace existing menu items

      const response = await fetch(`${API}/ai/canteen/menu-ocr`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process menu');
      }

      const result = await response.json();
      
      if (result.items_inserted > 0) {
        setSuccess(`Successfully processed menu! Added ${result.items_inserted} items.`);
        setPreviewItems(result.preview || []);
        onUploadComplete?.();
      } else {
        setError('No menu items were found in the uploaded file. Please check the image quality.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload menu');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-blue-500" />
        Upload Canteen Menu
      </h3>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          uploading 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-blue-600 font-medium">
              {processing ? 'Processing menu with AI...' : 'Uploading...'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              This may take a few moments while we extract menu items
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600 mb-2">
              Drag and drop your menu file here, or{' '}
              <label className="text-blue-500 hover:text-blue-600 cursor-pointer underline">
                browse
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            </p>
            <p className="text-gray-400 text-sm">
              Supports JPG, PNG, and PDF files
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Preview Items */}
      {previewItems.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            Extracted Menu Items ({previewItems.length})
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {previewItems.map((item, index) => (
                <div key={index} className="bg-white p-3 rounded border text-sm">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-green-600 font-bold">₹{item.price}</div>
                  <div className="text-gray-500 capitalize">{item.category}</div>
                  {item.is_vegetarian && (
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mt-1">
                      Veg
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p className="mb-1">💡 <strong>Tips for better results:</strong></p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Use high-quality, clear images of the menu</li>
          <li>Ensure good lighting and minimal shadows</li>
          <li>Menu text should be clearly readable</li>
          <li>PDF files with text content work best</li>
        </ul>
      </div>
    </div>
  );
};

export default MenuUploader;