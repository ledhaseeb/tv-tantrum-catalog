/**
 * Simplified TV Show Image Component for Better Performance at Scale
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface TvShowImageProps {
  showId: number;
  showName: string;
  originalUrl?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  quality?: number;
}

export const TvShowImage: React.FC<TvShowImageProps> = ({
  showId,
  showName,
  originalUrl,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  aspectRatio = 'portrait',
  quality = 75
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simplified image handling for better performance at scale
  const altText = `${showName} - TV Show Image`;

  // Handle image load error
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Handle image load success
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Use original URL or fallback to a generic placeholder
  const imageUrl = hasError ? '/api/placeholder/300x400' : (originalUrl || '/api/placeholder/300x400');

  // Aspect ratio classes
  const aspectRatioClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };

  return (
    <div className={cn('relative overflow-hidden', aspectRatioClasses[aspectRatio], className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={imageUrl}
        alt={altText}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
      />
    </div>
  );
};

export default TvShowImage;