import { useEffect } from 'react';

interface GoogleAdProps {
  slot: string;
  format?: string;
  width?: number;
  height?: number;
  className?: string;
  responsive?: boolean;
}

const GoogleAd = ({ 
  slot, 
  format = 'auto', 
  width, 
  height, 
  className = '',
  responsive = true 
}: GoogleAdProps) => {
  const adsenseId = import.meta.env.VITE_GOOGLE_ADSENSE_ID;

  useEffect(() => {
    try {
      // Initialize AdSense ads
      (window as any).adsbygoogle = (window as any).adsbygoogle || [];
      (window as any).adsbygoogle.push({});
    } catch (error) {
      console.error('Error initializing ad:', error);
    }
  }, []);

  if (!adsenseId) {
    return null;
  }

  const adStyle: React.CSSProperties = {};
  if (width) adStyle.width = width;
  if (height) adStyle.height = height;

  return (
    <div className={`ad-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...adStyle
        }}
        data-ad-client={adsenseId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default GoogleAd;