import React from 'react';
import SkillSelector from '../components/SkillSelector';
import { SKILLS } from '../constants';

const SkillsPage: React.FC = () => {
  const handleContinue = (selectedSkills: string[]) => {
    console.log("Selected skills:", selectedSkills);
    alert("Profile setup complete! You would now be redirected to your dashboard.");
    // In a real app, you would save skills and navigate to the dashboard.
    // e.g., navigate('/student/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EADFFD] p-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-105">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Showcase Your Skills</h1>
          <p className="text-gray-500 mt-2">Select at least 3 of your top skills. This helps us find the perfect project match for you.</p>
        </div>
        <SkillSelector skills={SKILLS} onContinue={handleContinue} />
      </div>
    </div>
  );
};

export default SkillsPage;