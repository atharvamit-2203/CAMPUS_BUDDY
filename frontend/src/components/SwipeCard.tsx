import React from 'react';

interface SwipeCardProps {
  title: string;
  description: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ title, description, onSwipeLeft, onSwipeRight }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-auto">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="flex justify-between">
        <button 
          onClick={onSwipeLeft}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
        >
          Pass
        </button>
        <button 
          onClick={onSwipeRight}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          Match
        </button>
      </div>
    </div>
  );
};

export default SwipeCard;
