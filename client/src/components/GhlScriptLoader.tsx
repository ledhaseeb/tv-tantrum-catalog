import { useEffect, useRef } from 'react';

export default function GhlScriptLoader() {
  const scriptLoaded = useRef(false);
  
  useEffect(() => {
    if (scriptLoaded.current) return;
    
    const script = document.createElement('script');
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded.current = true;
      
      // Re-initialize the form if needed
      if (window.ghl && window.ghl.loadEmbed) {
        window.ghl.loadEmbed();
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  return null;
}

// Add this to global.d.ts or a similar file
declare global {
  interface Window {
    ghl?: {
      loadEmbed: () => void;
      [key: string]: any;
    };
  }
}