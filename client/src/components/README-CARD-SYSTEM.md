# Standardized Card System

## Problem Solved
Previously, the `ShowCard` component was used across multiple pages with different styling requirements. When you adjusted card sizes for one page, it would affect all other pages globally, creating conflicts.

## Solution
Created a standardized card system with specific variants for different use cases that don't interfere with each other.

## Available Card Variants

### 1. MobileGridShowCard
- **Use case**: Mobile portrait cards
- **Dimensions**: h-80 w-56 (fixed)
- **Image ratio**: ~55% of total height
- **Features**: Compact layout, 1 theme max, compact stimulation indicator

### 2. DesktopGridShowCard  
- **Use case**: Desktop grid cards
- **Dimensions**: h-96 w-64 (fixed)
- **Image ratio**: ~58% of total height
- **Features**: Larger layout, 2 themes max, full stimulation indicator

### 3. CategoryGridShowCard
- **Use case**: Category pages with more content
- **Dimensions**: h-72 w-48 (fixed)
- **Image ratio**: ~55% of total height
- **Features**: Compact layout, 1 theme max, compact stimulation indicator

### 4. ListViewShowCard
- **Use case**: Horizontal list layouts
- **Dimensions**: Flexible height, fixed image size
- **Features**: Horizontal layout, 4 themes max, full stimulation indicator

## Grid Layout Components

### CatalogPageGrid
- Mobile: 2 columns, gap-3, p-4
- Tablet: 3 columns, gap-4, p-6  
- Desktop: 4 columns, gap-6, p-8

### CategoryPageGrid
- Mobile: 2 columns, gap-2, p-3
- Tablet: 4 columns, gap-3, p-4
- Desktop: 5 columns, gap-4, p-6

### SearchResultsGrid
- Mobile: 1 column, gap-3, p-4
- Tablet: 2 columns, gap-4, p-6
- Desktop: 3 columns, gap-6, p-8

### FeaturedShowsGrid
- Mobile: Horizontal scroll, gap-3, p-4
- Tablet: 3 columns, gap-4, p-6
- Desktop: 4 columns, gap-6, p-8

## Usage Examples

```tsx
// For browse/catalog pages
import { MobileGridShowCard, DesktopGridShowCard } from "@/components/StandardShowCards";
import { CatalogPageGrid } from "@/components/GridLayouts";

// Use mobile-specific cards
{isMobile ? (
  <CatalogPageGrid>
    {shows.map(show => (
      <MobileGridShowCard key={show.id} show={show} onClick={() => {}} />
    ))}
  </CatalogPageGrid>
) : (
  <CatalogPageGrid>
    {shows.map(show => (
      <DesktopGridShowCard key={show.id} show={show} onClick={() => {}} />
    ))}
  </CatalogPageGrid>
)}

// For category pages with more content
import { CategoryGridShowCard } from "@/components/StandardShowCards";
import { CategoryPageGrid } from "@/components/GridLayouts";

<CategoryPageGrid>
  {shows.map(show => (
    <CategoryGridShowCard key={show.id} show={show} onClick={() => {}} />
  ))}
</CategoryPageGrid>

// For carousels/featured sections
import { DesktopGridShowCard } from "@/components/StandardShowCards";

<CarouselItem className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
  <DesktopGridShowCard show={show} onClick={() => {}} />
</CarouselItem>
```

## Migration Status

### ✅ Completed
- `client/src/pages/browse.tsx` - Updated to use MobileGridShowCard/DesktopGridShowCard with CatalogPageGrid
- `client/src/pages/catalog-home.tsx` - Updated all carousel sections to use DesktopGridShowCard
- `client/src/components/StandardShowCards.tsx` - Created with all variants
- `client/src/components/GridLayouts.tsx` - Created with responsive grid systems

### 🔄 Still using legacy ShowCard (need updates)
- `client/src/pages/catalog-home-responsive.tsx`
- `client/src/pages/user-dashboard.tsx` 
- `client/src/pages/detail.tsx`
- `client/src/pages/catalog-show-detail-page-fixed.tsx`

## Benefits

1. **No more card sizing conflicts** - Each variant has fixed dimensions
2. **Consistent design** - Standardized spacing, typography, and layouts
3. **Responsive by design** - Mobile and desktop variants optimized for their use cases
4. **Easy maintenance** - Clear separation of concerns between card types
5. **Performance** - Fixed dimensions prevent layout shifts

## Best Practices

1. **Choose the right variant** for your use case
2. **Use the matching grid component** for consistent spacing
3. **Don't modify StandardShowCards.tsx** - create new variants if needed
4. **Test on both mobile and desktop** when implementing
5. **Use isMobile detection** to switch between mobile/desktop variants appropriately