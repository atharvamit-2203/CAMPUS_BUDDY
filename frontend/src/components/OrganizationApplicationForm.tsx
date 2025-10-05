'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, User, BookOpen, Calendar, IdCard, Building, MessageSquare, Lightbulb, Clock } from 'lucide-react';

interface OrganizationApplicationFormProps {
  clubId: number;
  clubName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (applicationData: any) => Promise<void>;
}

interface ApplicationFormData {
  full_name: string;
  batch: string;
  year_of_study: string;
  sap_id: string;
  department_to_join: string;
  why_join: string;
  contribution: string;
  can_stay_longer: boolean;
}

const OrganizationApplicationForm: React.FC<OrganizationApplicationFormProps> = ({
  clubId,
  clubName,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<ApplicationFormData>({
    full_name: '',
    batch: '',
    year_of_study: '',
    sap_id: '',
    department_to_join: '',
    why_join: '',
    contribution: '',
    can_stay_longer: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load user data on mount
  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = async () => {
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setFormData(prev => ({
          ...prev,
          full_name: userData.full_name || '',
          batch: userData.batch || '',
          year_of_study: userData.academic_year || userData.semester || '',
          sap_id: userData.student_id || '',
          department_to_join: userData.department || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const handleInputChange = (field: keyof ApplicationFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit({
        club_id: clubId,
        ...formData
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Join {clubName}</h2>
              <p className="text-blue-100 mt-1">Fill out this application form to join the organization</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SAP ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sap_id}
                  onChange={(e) => handleInputChange('sap_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your SAP ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch *
                </label>
                <select
                  required
                  value={formData.batch}
                  onChange={(e) => handleInputChange('batch', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Select your program</option>
                  <option value="MBA TECH">MBA TECH</option>
                  <option value="B TECH CE">B TECH CE (Computer Engineering)</option>
                  <option value="B TECH AIDS">B TECH AIDS (Artificial Intelligence & Data Science)</option>
                  <option value="B TECH IT">B TECH IT (Information Technology)</option>
                  <option value="B TECH CSE">B TECH CSE (Computer Science & Engineering)</option>
                  <option value="B TECH ECE">B TECH ECE (Electronics & Communication)</option>
                  <option value="B TECH EE">B TECH EE (Electrical Engineering)</option>
                  <option value="B TECH ME">B TECH ME (Mechanical Engineering)</option>
                  <option value="BBA">BBA (Bachelor of Business Administration)</option>
                  <option value="BCA">BCA (Bachelor of Computer Applications)</option>
                  <option value="MBA">MBA (Master of Business Administration)</option>
                  <option value="MCA">MCA (Master of Computer Applications)</option>
                  <option value="M TECH">M TECH (Master of Technology)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year of Study *
                </label>
                <select
                  required
                  value={formData.year_of_study}
                  onChange={(e) => handleInputChange('year_of_study', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Select year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Final Year">Final Year</option>
                </select>
              </div>
            </div>
          </div>

          {/* Organization Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Building className="w-5 h-5 mr-2 text-green-600" />
              Organization Preferences
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department to Join
              </label>
              <input
                type="text"
                value={formData.department_to_join}
                onChange={(e) => handleInputChange('department_to_join', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Technical, Cultural, Sports"
              />
            </div>
          </div>

          {/* Application Questions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
              Application Questions
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want to join this organization? *
              </label>
              <textarea
                required
                rows={4}
                value={formData.why_join}
                onChange={(e) => handleInputChange('why_join', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-gray-900 bg-white"
                placeholder="Explain your motivation and interest in joining this organization..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What can you contribute to this organization? *
              </label>
              <textarea
                required
                rows={4}
                value={formData.contribution}
                onChange={(e) => handleInputChange('contribution', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-gray-900 bg-white"
                placeholder="Describe your skills, experience, and how you can contribute..."
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="can_stay_longer"
                checked={formData.can_stay_longer}
                onChange={(e) => handleInputChange('can_stay_longer', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="can_stay_longer" className="text-sm font-medium text-gray-700 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-orange-600" />
                Can you stay for longer hours when required?
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationApplicationForm;