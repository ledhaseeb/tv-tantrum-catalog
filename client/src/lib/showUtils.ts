import { TvShow } from "@shared/schema";

/**
 * Returns a color class based on the tantrum factor value
 */
export function getTantrumFactorColor(value: number): string {
  if (value <= 3) return "green-rating";
  if (value <= 7) return "yellow-rating";
  return "red-rating";
}

/**
 * Returns a color class based on the educational value or parent enjoyment
 */
export function getPositiveRatingColor(value: number): string {
  if (value >= 8) return "purple-rating";
  if (value >= 5) return "yellow-rating";
  return "red-rating";
}

/**
 * Returns a text description for the tantrum factor
 */
export function getTantrumFactorDescription(value: number): string {
  if (value <= 3) {
    return "Children are unlikely to throw tantrums when this show ends.";
  } else if (value <= 7) {
    return "May cause some resistance when it's time to turn off the TV.";
  } else {
    return "High likelihood of meltdowns when the show is over.";
  }
}

/**
 * Returns a text description for the educational value
 */
export function getEducationalValueDescription(value: number): string {
  if (value >= 8) {
    return "Excellent educational content that teaches valuable skills and concepts.";
  } else if (value >= 5) {
    return "Contains some educational elements mixed with entertainment.";
  } else {
    return "Primarily entertainment with limited educational content.";
  }
}

/**
 * Returns a text description for the parent enjoyment
 */
export function getParentEnjoymentDescription(value: number): string {
  if (value >= 8) {
    return "Includes humor and themes that adults can enjoy along with their children.";
  } else if (value >= 5) {
    return "Moderately entertaining for adults, with some enjoyable elements.";
  } else {
    return "Parents may find this show difficult to watch repeatedly.";
  }
}

/**
 * Returns a text description for the repeat watchability
 */
export function getRepeatWatchabilityDescription(value: number): string {
  if (value >= 8) {
    return "Episodes remain entertaining even after multiple viewings.";
  } else if (value >= 5) {
    return "Can be watched multiple times without significant parent fatigue.";
  } else {
    return "May become tiresome for parents after repeated viewings.";
  }
}

/**
 * Generate a default placeholder image URL for a show
 */
export function getDefaultShowImage(showName: string): string {
  // This function would typically return a real image URL
  // But since we can't use images, returning empty string
  return "";
}

/**
 * Filter shows based on provided filters
 */
export function filterShows(
  shows: TvShow[],
  filters: {
    ageGroup?: string;
    tantrumFactor?: string;
    search?: string;
  }
): TvShow[] {
  return shows.filter(show => {
    // Filter by age group
    if (filters.ageGroup) {
      const [min, max] = filters.ageGroup.split('-').map(Number);
      const [showMin, showMax] = show.ageRange.split('-').map(Number);
      
      // Check if there's any overlap between the filter range and the show's range
      if (!(showMin <= max && showMax >= min)) {
        return false;
      }
    }
    
    // Filter by tantrum factor
    if (filters.tantrumFactor) {
      switch (filters.tantrumFactor) {
        case 'low':
          if (!(show.tantrumFactor >= 1 && show.tantrumFactor <= 3)) {
            return false;
          }
          break;
        case 'medium':
          if (!(show.tantrumFactor >= 4 && show.tantrumFactor <= 7)) {
            return false;
          }
          break;
        case 'high':
          if (!(show.tantrumFactor >= 8 && show.tantrumFactor <= 10)) {
            return false;
          }
          break;
      }
    }
    
    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      if (!(show.name.toLowerCase().includes(searchTerm) || 
            show.description.toLowerCase().includes(searchTerm))) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Sort shows based on provided sort option
 */
export function sortShows(
  shows: TvShow[],
  sortBy?: string
): TvShow[] {
  if (!sortBy) return shows;
  
  return [...shows].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'tantrum-factor':
        return a.tantrumFactor - b.tantrumFactor;
      case 'educational-value':
        return b.educationalValue - a.educationalValue;
      case 'parent-enjoyment':
        return b.parentEnjoyment - a.parentEnjoyment;
      case 'overall-rating':
        return b.overallRating - a.overallRating;
      default:
        return 0;
    }
  });
}
