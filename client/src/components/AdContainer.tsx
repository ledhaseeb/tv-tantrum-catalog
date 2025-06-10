import React from 'react';

interface AdContainerProps {
  size: 'banner' | 'rectangle' | 'leaderboard' | 'mobile-banner' | 'large-rectangle' | 'skyscraper';
  className?: string;
  label?: string;
}

const AdContainer: React.FC<AdContainerProps> = ({ size, className = '', label = 'Advertisement' }) => {
  console.log('🎯 AdContainer rendering:', { size, className, label });
  
  const sizeClasses = {
    banner: 'w-full h-24 md:h-32',
    rectangle: 'w-full max-w-sm h-64',
    leaderboard: 'w-full h-24',
    'mobile-banner': 'w-full h-16',
    'large-rectangle': 'w-full max-w-sm h-72',
    'skyscraper': 'w-40 h-96'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} bg-blue-50 border-2 border-blue-300 rounded-lg flex items-center justify-center shadow-sm`}>
      <div className="text-center p-4">
        <div className="text-sm text-blue-600 font-semibold uppercase tracking-wide">{label}</div>
        <div className="text-sm text-blue-500 mt-1 font-medium">Ad Space Ready</div>
        <div className="text-xs text-blue-400 mt-1">Size: {size}</div>
      </div>
    </div>
  );
};

export default AdContainer;