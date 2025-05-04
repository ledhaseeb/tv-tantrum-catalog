import { TvShow } from "@shared/schema";

/**
 * Returns a color class based on the stimulation score value
 * Lower stimulation score is better for calmness
 */
export function getStimulationScoreColor(value: number): string {
  if (value <= 2) return "green-rating";
  if (value <= 4) return "yellow-rating";
  return "red-rating";
}

/**
 * Returns a color class based on overall rating
 */
export function getPositiveRatingColor(value: number): string {
  if (value >= 4) return "purple-rating";
  if (value >= 3) return "yellow-rating";
  return "red-rating";
}

/**
 * Returns a text description for the stimulation score
 */
export function getStimulationScoreDescription(value: number): string {
  if (value <= 2) {
    return "Low stimulation - calming content with gentle pacing.";
  } else if (value <= 4) {
    return "Medium stimulation - balanced content with moderate energy.";
  } else {
    return "High stimulation - energetic content that may be overstimulating for some children.";
  }
}

/**
 * Returns a description for interactivity level
 */
export function getInteractivityLevelDescription(value: string): string {
  switch (value) {
    case "Low":
      return "Minimal audience interaction, children mostly observe passively.";
    case "Moderate-Low":
      return "Some audience engagement, primarily through questions or simple responses.";
    case "Moderate":
      return "Balanced audience engagement with regular interaction throughout the show.";
    case "Moderate-High":
      return "Frequent audience engagement with multiple interactive elements.";
    case "High":
      return "Very interactive format that encourages active participation throughout.";
    default:
      return "Moderate level of interactivity.";
  }
}

/**
 * Returns a description for dialogue intensity
 */
export function getDialogueIntensityDescription(value: string): string {
  switch (value) {
    case "Low":
      return "Minimal dialogue, relies more on visuals and music.";
    case "Moderate-Low":
      return "Simple dialogue with plenty of pauses and visual storytelling.";
    case "Moderate":
      return "Balanced dialogue that's appropriate for the target age group.";
    case "Moderate-High":
      return "Conversation-heavy with more complex language patterns.";
    case "High":
      return "Very dialogue-rich content with complex vocabulary or frequent conversations.";
    default:
      return "Moderate level of dialogue.";
  }
}

/**
 * Returns a description for sound effects level
 */
export function getSoundEffectsLevelDescription(value: string): string {
  switch (value) {
    case "Low":
      return "Minimal sound effects, creating a calm viewing experience.";
    case "Moderate-Low":
      return "Gentle sound effects that enhance the content without overwhelming.";
    case "Moderate":
      return "Balanced use of sound effects to support the storytelling.";
    case "Moderate-High":
      return "Frequent sound effects that play a significant role in the experience.";
    case "High":
      return "Sound effect-heavy show with prominent audio elements throughout.";
    default:
      return "Moderate level of sound effects.";
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
    
    // Filter by stimulation score (using the existing tantrumFactor filter name for compatibility)
    if (filters.tantrumFactor) {
      switch (filters.tantrumFactor) {
        case 'low':
          if (!(show.stimulationScore <= 2)) {
            return false;
          }
          break;
        case 'medium':
          if (!(show.stimulationScore > 2 && show.stimulationScore <= 4)) {
            return false;
          }
          break;
        case 'high':
          if (!(show.stimulationScore > 4)) {
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
      case 'stimulation-score':
        return a.stimulationScore - b.stimulationScore; // Lower is better
      case 'interactivity-level':
        // Sort by interactivity level - Low, Moderate, High
        const levelMap: {[key: string]: number} = {
          'Low': 1,
          'Moderate-Low': 2,
          'Moderate': 3,
          'Moderate-High': 4,
          'High': 5
        };
        const aLevel = levelMap[a.interactivityLevel || 'Moderate'] || 3;
        const bLevel = levelMap[b.interactivityLevel || 'Moderate'] || 3;
        return aLevel - bLevel;
      case 'dialogue-intensity':
        // Sort by dialogue intensity using the same level map
        const dlevelMap: {[key: string]: number} = {
          'Low': 1,
          'Moderate-Low': 2,
          'Moderate': 3,
          'Moderate-High': 4,
          'High': 5
        };
        const adLevel = dlevelMap[a.dialogueIntensity || 'Moderate'] || 3;
        const bdLevel = dlevelMap[b.dialogueIntensity || 'Moderate'] || 3;
        return adLevel - bdLevel;
      case 'overall-rating':
        return b.overallRating - a.overallRating;
      default:
        return 0;
    }
  });
}
