import React, { useEffect, useRef } from 'react';

// Assume lottie is loaded globally from CDN script in index.html
declare const lottie: any;

interface LottieAnimationProps {
  animationData: object;
}

const LottieAnimation: React.FC<LottieAnimationProps> = ({ animationData }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anim: any = null;
    if (containerRef.current) {
      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData,
      });
    }
    return () => {
      if (anim) {
        anim.destroy();
      }
    };
  }, [animationData]);

  return <div ref={containerRef} className="w-full h-auto max-w-md" />;
};

export default LottieAnimation;