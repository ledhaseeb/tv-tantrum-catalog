import React from 'react';

interface AdContainerProps {
  size: 'banner' | 'rectangle' | 'leaderboard' | 'mobile-banner';
  className?: string;
  label?: string;
}

const AdContainer: React.FC<AdContainerProps> = ({ size, className = '', label = 'Advertisement' }) => {
  const sizeClasses = {
    banner: 'w-full h-24 md:h-32', // 728x90 leaderboard or mobile banner
    rectangle: 'w-full max-w-sm h-64', // 300x250 medium rectangle
    leaderboard: 'w-full h-24', // 728x90 leaderboard
    'mobile-banner': 'w-full h-16' // 320x50 mobile banner
  };

  return (
    <div className={`${sizeClasses[size]} ${className} bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center`}>
      <div className="text-center">
        <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
        <div className="text-xs text-gray-300 mt-1">Ad Space Ready</div>
      </div>
    </div>
  );
};

export default AdContainer;