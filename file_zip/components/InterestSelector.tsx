
import React, { useState, useCallback } from 'react';

interface InterestSelectorProps {
  interests: string[];
  onContinue: (selectedInterests: string[]) => void;
}

const InterestSelector: React.FC<InterestSelectorProps> = ({ interests, onContinue }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const minSelections = 5;

  const toggleInterest = useCallback((interest: string) => {
    setSelected(prev =>
      prev.includes(interest)
        ? prev.filter(item => item !== interest)
        : [...prev, interest]
    );
  }, []);

  const isContinueDisabled = selected.length < minSelections;

  const handleContinueClick = useCallback(() => {
    if (!isContinueDisabled) {
      onContinue(selected);
    }
  }, [isContinueDisabled, onContinue, selected]);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {interests.map(interest => {
          const isSelected = selected.includes(interest);
          return (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`px-4 py-2 text-sm font-medium rounded-full border-2 transition-all duration-200 transform hover:scale-110 ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {interest}
            </button>
          );
        })}
      </div>
      <div className="text-center">
        <p className={`mb-4 font-semibold ${selected.length >= minSelections ? 'text-green-600' : 'text-gray-500'}`}>
          {selected.length} / {minSelections} selected
        </p>
        <button
          onClick={handleContinueClick}
          disabled={isContinueDisabled}
          className={`w-full max-w-xs mx-auto bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none ${!isContinueDisabled ? 'hover:bg-indigo-700 transform hover:scale-105' : ''}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default InterestSelector;
