'use client';

import React, { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

interface LottieAnimationProps {
  src: string;
  className?: string;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({ src, className = "w-full h-auto max-w-md" }) => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch(src)
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Error loading animation:', error));
  }, [src]);

  if (!animationData) {
    // Fallback animation when Lottie data is not available
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
      </div>
    );
  }

  return <Lottie animationData={animationData} className={className} />;
};

export default LottieAnimation;
