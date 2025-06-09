import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface AdContainerProps {
  placement: 'show-details' | 'research-summary' | 'research-details';
  className?: string;
}

interface AdData {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  targetUrl: string;
  placement: string;
  isActive: boolean;
}

export function AdContainer({ placement, className = '' }: AdContainerProps) {
  const [adData, setAdData] = useState<AdData | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdData();
  }, [placement]);

  const fetchAdData = async () => {
    try {
      const response = await fetch(`/api/ads?placement=${placement}`);
      if (response.ok) {
        const data = await response.json();
        setAdData(data);
      }
    } catch (error) {
      console.error('Failed to load ad:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdClick = () => {
    if (adData) {
      // Track ad click
      fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adId: adData.id, 
          action: 'click',
          placement 
        })
      }).catch(console.error);

      // Open ad URL
      window.open(adData.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (adData) {
      // Track ad dismissal
      fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adId: adData.id, 
          action: 'dismiss',
          placement 
        })
      }).catch(console.error);
    }
  };

  // Track ad impression
  useEffect(() => {
    if (adData && isVisible) {
      fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adId: adData.id, 
          action: 'impression',
          placement 
        })
      }).catch(console.error);
    }
  }, [adData, isVisible, placement]);

  if (isLoading) {
    return (
      <Card className={`p-4 bg-gradient-to-r from-gray-50 to-gray-100 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!adData || !adData.isActive || !isVisible) {
    return null;
  }

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/80 hover:bg-white transition-colors"
        aria-label="Close ad"
      >
        <X className="h-3 w-3 text-gray-500" />
      </button>

      {/* Ad content */}
      <div 
        className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 transition-colors"
        onClick={handleAdClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAdClick();
          }
        }}
      >
        <div className="flex items-start gap-3">
          {adData.imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={adData.imageUrl}
                alt={adData.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm mb-1">
              {adData.title}
            </h3>
            <p className="text-gray-600 text-xs mb-2 line-clamp-2">
              {adData.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {adData.ctaText}
              </span>
              <span className="text-xs text-gray-400">Sponsored</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Specialized ad containers for different placements
export function ShowDetailsAd({ className }: { className?: string }) {
  return <AdContainer placement="show-details" className={className} />;
}

export function ResearchSummaryAd({ className }: { className?: string }) {
  return <AdContainer placement="research-summary" className={className} />;
}

export function ResearchDetailsAd({ className }: { className?: string }) {
  return <AdContainer placement="research-details" className={className} />;
}