'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import SkillSelector from '../../../components/SkillSelector';
import { SKILLS } from '../../../constants';

export default function SkillsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async (selectedSkills: string[]) => {
    console.log("Selected skills:", selectedSkills);

    if (selectedSkills.length < 3) {
      setError("Please select at least 3 skills");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError("Please login first");
        router.push('/login/student');
        return;
      }

      // Save skills to backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // First, get skill IDs from the backend
      const skillsResponse = await fetch(`${API_URL}/skills/available`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!skillsResponse.ok) {
        throw new Error('Failed to fetch available skills');
      }

      const skillsData = await skillsResponse.json();
      const skillMap: { [key: string]: number } = {};

      // Create a map of skill names to IDs
      skillsData.skills.forEach((skill: any) => {
        skillMap[skill.name.toLowerCase()] = skill.id;
      });

      // Add selected skills
      for (const skillName of selectedSkills) {
        const skillId = skillMap[skillName.toLowerCase()];
        if (skillId) {
          await fetch(`${API_URL}/skills/add`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              skill_id: skillId,
              proficiency_level: 'beginner' // Default proficiency level
            })
          });
        }
      }

      // Navigate to the dashboard
      router.push('/student/dashboard');
    } catch (err) {
      console.error('Error saving skills:', err);
      setError('Failed to save skills. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EADFFD] p-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-105">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Showcase Your Skills</h1>
          <p className="text-gray-500 mt-2">Select at least 3 of your top skills. This helps us find the perfect project match for you.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <SkillSelector
          skills={SKILLS}
          onContinue={handleContinue}
          disabled={isLoading}
        />

        {isLoading && (
          <div className="mt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Saving your skills...</p>
          </div>
        )}
      </div>
    </div>
  );
}
