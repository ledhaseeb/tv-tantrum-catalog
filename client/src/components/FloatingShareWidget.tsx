import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ShareButton';
import { Heart, X } from 'lucide-react';

interface FloatingShareWidgetProps {
  show?: boolean;
}

export function FloatingShareWidget({ show = true }: FloatingShareWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300 && !hasScrolled) {
        setHasScrolled(true);
        setTimeout(() => {
          if (!isDismissed) {
            setIsVisible(true);
          }
        }, 2000);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasScrolled, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('tv-tantrum-share-dismissed', 'true');
  };

  useEffect(() => {
    const dismissed = localStorage.getItem('tv-tantrum-share-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  if (!show || !isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border p-4 relative animate-in slide-in-from-bottom-5 duration-500">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="pr-6">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">Love TV Tantrum?</h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Help other parents discover our stimulation rating system and find perfect shows for their kids!
          </p>
          
          <div className="flex flex-col gap-2">
            <ShareButton 
              title="TV Tantrum - Smart Children's Content Discovery"
              description="Discover children's TV shows with detailed stimulation ratings and sensory information. Perfect for parents seeking appropriate content for their kids."
              type="site"
            />
            <button
              onClick={handleDismiss}
              className="text-xs text-gray-500 hover:text-gray-700 text-center"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}