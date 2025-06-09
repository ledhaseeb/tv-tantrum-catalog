import React from 'react';
import GoogleAd from './GoogleAd';

interface AdContainerProps {
  size: 'banner' | 'rectangle' | 'leaderboard' | 'mobile-banner' | 'large-rectangle' | 'skyscraper';
  className?: string;
  label?: string;
  slot?: string; // Allow custom slot override
}

const AdContainer: React.FC<AdContainerProps> = ({ size, className = '', label = 'Advertisement', slot }) => {
  // AdSense ad slot IDs - using auto ads format for now
  const adSlots = {
    banner: 'auto',
    rectangle: 'auto',
    leaderboard: 'auto',
    'mobile-banner': 'auto',
    'large-rectangle': 'auto',
    'skyscraper': 'auto'
  };

  const adDimensions = {
    banner: { width: 728, height: 90 },
    rectangle: { width: 300, height: 250 },
    leaderboard: { width: 728, height: 90 },
    'mobile-banner': { width: 320, height: 50 },
    'large-rectangle': { width: 336, height: 280 },
    'skyscraper': { width: 160, height: 600 }
  };

  // Check if AdSense is configured
  const adsenseId = import.meta.env.VITE_GOOGLE_ADSENSE_ID;
  
  if (!adsenseId) {
    // Fallback to placeholder when AdSense not configured
    const sizeClasses = {
      banner: 'w-full h-24 md:h-32',
      rectangle: 'w-full max-w-sm h-64',
      leaderboard: 'w-full h-24',
      'mobile-banner': 'w-full h-16',
      'large-rectangle': 'w-full max-w-sm h-72',
      'skyscraper': 'w-40 h-96'
    };

    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
          <div className="text-xs text-gray-300 mt-1">Ad Space Ready</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleAd
        slot={slot || adSlots[size]}
        width={adDimensions[size].width}
        height={adDimensions[size].height}
        format="auto"
        responsive={true}
      />
    </div>
  );
};

export default AdContainer;