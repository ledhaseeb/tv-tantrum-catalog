// Easy-to-edit card sizing configuration
// Modify these values to adjust card dimensions across the site

export const CARD_SIZING = {
  // Desktop home page cards
  desktop: {
    // Card container dimensions
    totalHeight: 'h-72',     // 288px - adjust this to make cards taller/shorter
    totalWidth: 'w-48',      // 192px - adjust this to make cards wider/narrower
    
    // Image area dimensions
    imageHeight: 'h-40',     // 160px - adjust this for image area size
    
    // Content area dimensions  
    contentHeight: 'h-32',   // 128px - adjust this for text area size
    contentPadding: 'p-3',   // 12px - adjust spacing inside content area
    
    // Typography
    titleSize: 'text-sm',    // Title font size
    badgeSize: 'text-xs',    // Age badge font size
    
    // Content limits
    maxThemes: 1,            // Number of theme badges to show
  },
  
  // Mobile cards
  mobile: {
    totalHeight: 'h-80',
    totalWidth: 'w-56', 
    imageHeight: 'h-44',
    contentHeight: 'h-36',
    contentPadding: 'p-3',
    titleSize: 'text-sm',
    badgeSize: 'text-xs',
    maxThemes: 1,
  },
  
  // Category page cards (smaller, more compact)
  category: {
    totalHeight: 'h-72',
    totalWidth: 'w-48',
    imageHeight: 'h-40', 
    contentHeight: 'h-32',
    contentPadding: 'p-3',
    titleSize: 'text-sm',
    badgeSize: 'text-xs',
    maxThemes: 1,
  }
};

// Common Tailwind size reference for easy editing:
// Heights: h-32=128px, h-36=144px, h-40=160px, h-44=176px, h-48=192px, h-52=208px, h-56=224px, h-60=240px, h-64=256px, h-72=288px, h-80=320px, h-96=384px
// Widths: w-32=128px, w-36=144px, w-40=160px, w-44=176px, w-48=192px, w-52=208px, w-56=224px, w-60=240px, w-64=256px, w-72=288px, w-80=320px, w-96=384px
// Padding: p-1=4px, p-2=8px, p-3=12px, p-4=16px, p-5=20px, p-6=24px
// Text: text-xs=12px, text-sm=14px, text-base=16px, text-lg=18px, text-xl=20px