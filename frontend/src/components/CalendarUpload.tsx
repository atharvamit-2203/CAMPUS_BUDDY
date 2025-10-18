'use client';

import React, { useState } from 'react';
import { Upload, FileText, Calendar, CheckCircle, AlertCircle, X, Download, Loader2 } from 'lucide-react';

interface CalendarUploadProps {
  clubId: number;
  onEventsExtracted?: (events: any[]) => void;
}

const CalendarUpload: React.FC<CalendarUploadProps> = ({ clubId, onEventsExtracted }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewEvents, setPreviewEvents] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const acceptedFormats = [
    '.pdf',
    '.csv',
    '.xlsx',
    '.xls',
    '.jpg',
    '.jpeg',
    '.png',
    '.txt'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError('');
    setSuccess('');
    setExtractedEvents([]);
    setShowPreview(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('club_id', clubId.toString());

      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const response = await fetch(`${API}/ai/extract-calendar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setExtractedEvents(data.events || []);
        setPreviewEvents(data.events || []);
        setShowPreview(true);
        setSuccess(`Successfully extracted ${data.events?.length || 0} events from ${file.name}`);
        
        if (onEventsExtracted) {
          onEventsExtracted(data.events || []);
        }
      } else {
        setError(data.detail || 'Failed to extract calendar events');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Error uploading file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmEvents = async () => {
    if (!previewEvents.length) return;

    setUploading(true);
    setError('');

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const response = await fetch(`${API}/clubs/${clubId}/calendar/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ events: previewEvents })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully imported ${data.imported_count || previewEvents.length} events!`);
        setShowPreview(false);
        setFile(null);
        setPreviewEvents([]);
      } else {
        setError(data.detail || 'Failed to import events');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError('Error importing events. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeEvent = (index: number) => {
    const updated = previewEvents.filter((_, i) => i !== index);
    setPreviewEvents(updated);
  };

  const downloadSampleCSV = () => {
    const csvContent = `title,description,event_date,start_time,end_time,venue,event_type
Tech Workshop,Introduction to AI and Machine Learning,2025-11-15,10:00,12:00,Room 301,workshop
Cultural Fest,Annual cultural celebration with performances,2025-12-20,18:00,22:00,Main Auditorium,cultural
Sports Day,Inter-department sports competition,2025-11-25,09:00,17:00,Sports Ground,sports`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_calendar.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Upload Event Calendar
            </h3>
            <p className="text-gray-600">
              Upload your event calendar in PDF, CSV, Excel, or image format
            </p>
          </div>
          <button
            onClick={downloadSampleCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Download size={16} />
            <span className="text-sm">Download Sample CSV</span>
          </button>
        </div>

        {/* Accepted Formats Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Accepted formats:</strong> PDF, CSV, Excel (.xlsx, .xls), Images (JPG, PNG), Text files
          </p>
          <p className="text-xs text-gray-600">
            For best results: Use CSV format or clear timetable images. AI will extract event details automatically.
          </p>
        </div>

        {/* File Upload Area */}
        <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center bg-purple-50/50 hover:bg-purple-50 transition-colors">
          <input
            type="file"
            id="calendar-upload"
            accept={acceptedFormats.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="calendar-upload"
            className="cursor-pointer flex flex-col items-center space-y-3"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Choose a file or drag it here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                PDF, CSV, Excel, Images supported
              </p>
            </div>
          </label>
        </div>

        {/* Selected File Display */}
        {file && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-600">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-red-600 hover:text-red-700"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Upload Button */}
        {file && !showPreview && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-4 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Extracting Events...</span>
              </>
            ) : (
              <>
                <Calendar size={20} />
                <span>Extract Events from Calendar</span>
              </>
            )}
          </button>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Preview Extracted Events */}
      {showPreview && previewEvents.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-gray-900">
              Review Extracted Events ({previewEvents.length})
            </h4>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {previewEvents.map((event, index) => (
              <div
                key={index}
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start justify-between hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h5 className="font-semibold text-gray-900 mb-1">
                    {event.title || 'Untitled Event'}
                  </h5>
                  <p className="text-sm text-gray-600 mb-2">
                    {event.description || 'No description'}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {event.event_date && (
                      <span className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{event.event_date}</span>
                      </span>
                    )}
                    {event.start_time && (
                      <span>{event.start_time}</span>
                    )}
                    {event.venue && (
                      <span>📍 {event.venue}</span>
                    )}
                    {event.event_type && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {event.event_type}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeEvent(index)}
                  className="ml-4 text-red-600 hover:text-red-700"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Confirm Import Button */}
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleConfirmEvents}
              disabled={uploading}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Import {previewEvents.length} Events</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowPreview(false);
                setPreviewEvents([]);
                setFile(null);
              }}
              className="px-6 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarUpload;
