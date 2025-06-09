import { ReactNode } from 'react';

// Standardized grid configurations for different page types
export const GRID_CONFIGS = {
  // Main catalog page - responsive grid
  catalogPage: {
    mobile: "grid grid-cols-2 gap-3 p-4",
    tablet: "grid grid-cols-3 gap-4 p-6", 
    desktop: "grid grid-cols-4 gap-6 p-8"
  },
  
  // Category pages - tighter grid for more content
  categoryPage: {
    mobile: "grid grid-cols-2 gap-2 p-3",
    tablet: "grid grid-cols-4 gap-3 p-4",
    desktop: "grid grid-cols-5 gap-4 p-6"
  },
  
  // Search results - flexible grid
  searchResults: {
    mobile: "grid grid-cols-1 gap-3 p-4",
    tablet: "grid grid-cols-2 gap-4 p-6",
    desktop: "grid grid-cols-3 gap-6 p-8"
  },
  
  // Homepage featured - showcase grid
  featured: {
    mobile: "flex gap-3 overflow-x-auto pb-4 px-4",
    tablet: "grid grid-cols-3 gap-4 p-6",
    desktop: "grid grid-cols-4 gap-6 p-8"
  }
};

interface ResponsiveGridProps {
  children: ReactNode;
  type: keyof typeof GRID_CONFIGS;
  className?: string;
}

export function ResponsiveGrid({ children, type, className = "" }: ResponsiveGridProps) {
  const config = GRID_CONFIGS[type];
  
  return (
    <div className={`
      ${config.mobile}
      md:${config.tablet.replace('grid ', '').replace('p-', 'md:p-')}
      lg:${config.desktop.replace('grid ', '').replace('p-', 'lg:p-')}
      ${className}
    `}>
      {children}
    </div>
  );
}

// Container components for specific use cases
export function CatalogPageGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`
      grid grid-cols-2 gap-3 p-4
      md:grid-cols-3 md:gap-4 md:p-6
      lg:grid-cols-4 lg:gap-6 lg:p-8
      ${className}
    `}>
      {children}
    </div>
  );
}

export function CategoryPageGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`
      grid grid-cols-2 gap-2 p-3
      md:grid-cols-4 md:gap-3 md:p-4
      lg:grid-cols-5 lg:gap-4 lg:p-6
      ${className}
    `}>
      {children}
    </div>
  );
}

export function SearchResultsGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`
      grid grid-cols-1 gap-3 p-4
      md:grid-cols-2 md:gap-4 md:p-6
      lg:grid-cols-3 lg:gap-6 lg:p-8
      ${className}
    `}>
      {children}
    </div>
  );
}

export function FeaturedShowsGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`
      flex gap-3 overflow-x-auto pb-4 px-4
      md:grid md:grid-cols-3 md:gap-4 md:p-6 md:overflow-visible
      lg:grid-cols-4 lg:gap-6 lg:p-8
      ${className}
    `}>
      {children}
    </div>
  );
}