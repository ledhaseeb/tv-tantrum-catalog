import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cookieConsent');
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
  };

  const acceptNecessary = () => {
    localStorage.setItem('cookieConsent', 'necessary');
    setIsVisible(false);
  };

  const dismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie Preferences</h3>
            <p className="text-gray-600 text-sm">
              We use cookies to enhance your experience, analyze site usage, and provide personalized content. 
              You can manage your preferences or accept all cookies.
            </p>
            <div className="mt-2">
              <button
                className="text-primary hover:text-primary/80 text-sm font-medium"
                onClick={() => window.open('/privacy-policy', '_blank')}
              >
                Learn more in our Privacy Policy
              </button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={acceptNecessary}
              className="w-full sm:w-auto"
            >
              Necessary Only
            </Button>
            <Button
              onClick={acceptAll}
              size="sm"
              className="w-full sm:w-auto"
            >
              Accept All
            </Button>
            <button
              onClick={dismiss}
              className="sm:ml-2 p-1 text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}