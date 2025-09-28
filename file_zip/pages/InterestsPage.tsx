import React from 'react';
import { useNavigate } from 'react-router-dom';
import InterestSelector from '../components/InterestSelector';
import { INTERESTS } from '../constants';

const InterestsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleContinue = (selectedInterests: string[]) => {
    console.log("Selected interests:", selectedInterests);
    // In a real app, you would save this data before navigating.
    navigate('/skills');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EADFFD] p-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-105">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Choose Your Interests</h1>
          <p className="text-gray-500 mt-2">Select at least 5 areas that excite you. This helps us recommend the best opportunities.</p>
        </div>
        <InterestSelector interests={INTERESTS} onContinue={handleContinue} />
      </div>
    </div>
  );
};

export default InterestsPage;