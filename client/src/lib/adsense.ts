// Google AdSense integration utilities
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// Initialize Google AdSense
export const initAdSense = () => {
  const adsenseId = import.meta.env.VITE_GOOGLE_ADSENSE_ID;

  if (!adsenseId) {
    console.warn('Missing required Google AdSense key: VITE_GOOGLE_ADSENSE_ID');
    return;
  }

  // Add Google AdSense script to the head if not already present
  if (!document.querySelector(`script[src*="pagead2.googlesyndication.com"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }

  // Initialize adsbygoogle array if not present
  if (!window.adsbygoogle) {
    window.adsbygoogle = [];
  }
};

// Push ad to be displayed
export const pushAd = () => {
  try {
    if (window.adsbygoogle) {
      window.adsbygoogle.push({});
    }
  } catch (error) {
    console.error('AdSense error:', error);
  }
};