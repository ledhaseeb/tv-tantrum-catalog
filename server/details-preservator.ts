import fs from 'fs';
import path from 'path';

// Define the structure for storing custom show details
interface CustomShowDetails {
  // Stimulation metrics
  stimulationScore?: number;
  musicTempo?: string;
  totalMusicLevel?: string;
  totalSoundEffectTimeLevel?: string;
  sceneFrequency?: string;
  interactivityLevel?: string;
  dialogueIntensity?: string;
  soundEffectsLevel?: string;
  animationStyle?: string;
  
  // Other important fields
  ageRange?: string;
  themes?: string[];
  description?: string;
  
  // Fields to be preserved during updates
  [key: string]: any;
}

// Custom show details mapping type
interface CustomShowDetailsMap {
  [showId: string]: CustomShowDetails;
}

/**
 * Load custom show details mapping from the JSON file
 */
export function loadCustomShowDetailsMap(): CustomShowDetailsMap {
  try {
    const filePath = path.join(process.cwd(), 'customShowDetailsMap.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading custom show details map:', error);
  }
  return {};
}

/**
 * Save custom show details mapping to the JSON file
 */
export function saveCustomShowDetailsMap(customDetailsMap: CustomShowDetailsMap): void {
  try {
    const filePath = path.join(process.cwd(), 'customShowDetailsMap.json');
    fs.writeFileSync(filePath, JSON.stringify(customDetailsMap, null, 2));
  } catch (error) {
    console.error('Error saving custom show details map:', error);
  }
}

/**
 * Update custom show details in the mapping
 */
export function updateCustomShowDetails(showId: number, updatedFields: Partial<CustomShowDetails>): void {
  const customDetailsMap = loadCustomShowDetailsMap();
  const showIdStr = showId.toString();
  
  // Merge with existing details or create new entry
  customDetailsMap[showIdStr] = {
    ...(customDetailsMap[showIdStr] || {}),
    ...updatedFields
  };
  
  saveCustomShowDetailsMap(customDetailsMap);
}

/**
 * Get custom show details for a specific show
 */
export function getCustomShowDetails(showId: number): CustomShowDetails | undefined {
  const customDetailsMap = loadCustomShowDetailsMap();
  return customDetailsMap[showId.toString()];
}

/**
 * Preserve custom show details when updating shows from external sources
 * This merges custom fields with new data, prioritizing custom fields
 */
export function preserveCustomShowDetails<T>(showId: number, currentDetails: T, newData: Partial<T>): T {
  const customDetails = getCustomShowDetails(showId);
  
  if (!customDetails) {
    return { ...currentDetails, ...newData };
  }
  
  // Start with current details
  const mergedData = { ...currentDetails };
  
  // Add new data fields that aren't in custom details
  for (const [key, value] of Object.entries(newData)) {
    if (!(key in customDetails)) {
      (mergedData as any)[key] = value;
    }
  }
  
  // Override with custom details (highest priority)
  for (const [key, value] of Object.entries(customDetails)) {
    (mergedData as any)[key] = value;
  }
  
  return mergedData;
}

/**
 * Apply custom show details to all shows in storage at server startup
 */
export async function applyCustomShowDetails(getShowById: (id: number) => Promise<any>, updateShow: (id: number, data: any) => Promise<any>): Promise<void> {
  try {
    const customDetailsMap = loadCustomShowDetailsMap();
    console.log(`Applying custom details for ${Object.keys(customDetailsMap).length} shows from customShowDetailsMap.json`);
    
    for (const [showIdStr, details] of Object.entries(customDetailsMap)) {
      const showId = parseInt(showIdStr);
      if (isNaN(showId)) continue;
      
      const show = await getShowById(showId);
      if (show) {
        console.log(`Applying custom details to show ID ${showId}: ${show.name}`);
        await updateShow(showId, details);
      }
    }
  } catch (error) {
    console.error('Error applying custom show details:', error);
  }
}