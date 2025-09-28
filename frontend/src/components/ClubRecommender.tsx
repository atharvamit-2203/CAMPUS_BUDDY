import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RecommendationRequest {
  interests: string[];
  skills: string[];
  year_of_study: number;
  department: string;
  preferred_activities: string[];
  time_commitment: string;
  leadership_interest: boolean;
}

interface ClubRecommendation {
  club: {
    id: string;
    name: string;
    description: string;
    tags: string[];
    category: string;
    member_count: number;
    activities: string[];
    time_commitment: string;
    leadership_opportunities: boolean;
  };
  similarity_score: number;
  explanation: string;
  match_reasons: string[];
}

interface ClubRecommenderProps {
  onRecommendationsReceived?: (recommendations: ClubRecommendation[]) => void;
}

const ClubRecommender: React.FC<ClubRecommenderProps> = ({ onRecommendationsReceived }) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<ClubRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<RecommendationRequest>({
    interests: [],
    skills: [],
    year_of_study: 1,
    department: '',
    preferred_activities: [],
    time_commitment: 'medium',
    leadership_interest: false
  });

  const interestOptions = [
    'Technology', 'Programming', 'AI/ML', 'Data Science', 'Web Development',
    'Business', 'Entrepreneurship', 'Leadership', 'Marketing', 'Finance',
    'Design', 'UI/UX', 'Creative Arts', 'Graphics', 'Photography',
    'Sports', 'Fitness', 'Health', 'Environment', 'Sustainability',
    'Music', 'Dance', 'Drama', 'Cultural Events', 'Literature'
  ];

  const skillOptions = [
    'Python', 'JavaScript', 'React', 'Node.js', 'Java', 'C++',
    'Project Management', 'Public Speaking', 'Writing', 'Research',
    'Photoshop', 'Figma', 'Video Editing', 'Animation',
    'Event Planning', 'Social Media', 'Marketing', 'Sales'
  ];

  const activityOptions = [
    'Workshops', 'Competitions', 'Projects', 'Networking Events',
    'Research', 'Hackathons', 'Conferences', 'Cultural Events',
    'Sports Tournaments', 'Community Service', 'Mentoring'
  ];

  const departments = [
    'Computer Science', 'Electronics', 'Mechanical', 'Civil',
    'Business Administration', 'Design', 'Arts', 'Science'
  ];

  const handleInputChange = (field: keyof RecommendationRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (field: 'interests' | 'skills' | 'preferred_activities', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const getRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/recommend-clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      onRecommendationsReceived?.(data.recommendations || []);
      setShowForm(false);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Get Recommendations Button */}
      {!showForm && recommendations.length === 0 && (
        <div className="text-center py-8">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-blue-100 dark:border-blue-800">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
              🎯
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Get AI-Powered Club Recommendations
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Let our AI analyze your interests and skills to recommend the perfect clubs for you!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
            >
              Get Personalized Recommendations
            </button>
          </div>
        </div>
      )}

      {/* Recommendation Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tell Us About Yourself</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year of Study
                </label>
                <select
                  value={formData.year_of_study}
                  onChange={(e) => handleInputChange('year_of_study', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Interests
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {interestOptions.map(interest => (
                  <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(interest)}
                      onChange={() => handleArrayInputChange('interests', interest)}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{interest}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Skills
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {skillOptions.map(skill => (
                  <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.skills.includes(skill)}
                      onChange={() => handleArrayInputChange('skills', skill)}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preferred Activities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred Activities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {activityOptions.map(activity => (
                  <label key={activity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preferred_activities.includes(activity)}
                      onChange={() => handleArrayInputChange('preferred_activities', activity)}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{activity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Commitment & Leadership */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Commitment
                </label>
                <select
                  value={formData.time_commitment}
                  onChange={(e) => handleInputChange('time_commitment', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="low">Low (1-3 hours/week)</option>
                  <option value="medium">Medium (4-8 hours/week)</option>
                  <option value="high">High (9+ hours/week)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="leadership"
                  checked={formData.leadership_interest}
                  onChange={(e) => handleInputChange('leadership_interest', e.target.checked)}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <label htmlFor="leadership" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Interested in leadership opportunities
                </label>
              </div>
            </div>

            <button
              onClick={getRecommendations}
              disabled={loading || formData.interests.length === 0}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing Your Profile...' : 'Get My Recommendations'}
            </button>
          </div>
        </div>
      )}

      {/* Recommendations Display */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Your Personalized Club Recommendations
            </h3>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Update Preferences
            </button>
          </div>

          {recommendations.map((rec, index) => (
            <div key={rec.club.id} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{rec.club.name}</h4>
                    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                      #{index + 1} Match
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">{rec.club.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {rec.club.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(rec.similarity_score * 100)}%
                  </div>
                  <div className="text-xs text-gray-500">Match Score</div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Why this club is perfect for you:</h5>
                <p className="text-sm text-gray-700 dark:text-gray-300">{rec.explanation}</p>
              </div>

              {rec.match_reasons.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Match Reasons:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {rec.match_reasons.map((reason, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="text-green-500">✓</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div>
                  <span className="font-medium">Members:</span> {rec.club.member_count}
                </div>
                <div>
                  <span className="font-medium">Time:</span> {rec.club.time_commitment}
                </div>
                <div>
                  <span className="font-medium">Leadership:</span> {rec.club.leadership_opportunities ? 'Yes' : 'No'}
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-2 rounded-lg font-medium transition-all duration-300">
                Join {rec.club.name}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClubRecommender;
