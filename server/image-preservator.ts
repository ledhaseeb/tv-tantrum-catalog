import fs from 'fs';
import path from 'path';

// Custom image mapping type
interface CustomImageMap {
  [showId: string]: string;
}

/**
 * Load custom image mapping from the JSON file
 */
export function loadCustomImageMap(): CustomImageMap {
  try {
    const filePath = path.join(process.cwd(), 'customImageMap.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading custom image map:', error);
  }
  return {};
}

/**
 * Save custom image mapping to the JSON file
 */
export function saveCustomImageMap(customImageMap: CustomImageMap): void {
  try {
    const filePath = path.join(process.cwd(), 'customImageMap.json');
    fs.writeFileSync(filePath, JSON.stringify(customImageMap, null, 2));
  } catch (error) {
    console.error('Error saving custom image map:', error);
  }
}

/**
 * Add or update a custom image mapping
 */
export function updateCustomImageMap(showId: number, imageUrl: string): void {
  const customImageMap = loadCustomImageMap();
  customImageMap[showId.toString()] = imageUrl;
  saveCustomImageMap(customImageMap);
}

/**
 * Get custom image URL for a show if it exists
 */
export function getCustomImageUrl(showId: number): string | undefined {
  const customImageMap = loadCustomImageMap();
  return customImageMap[showId.toString()];
}

/**
 * Preserve custom image URLs when updating shows from external sources
 */
export function preserveCustomImageUrl(showId: number, currentImageUrl: string | null): string | null {
  const customImageUrl = getCustomImageUrl(showId);
  return customImageUrl || currentImageUrl;
}

/**
 * Apply custom images to all shows in storage at server startup
 */
export async function applyCustomImages(getShowById: (id: number) => Promise<any>, updateShow: (id: number, data: any) => Promise<any>): Promise<void> {
  try {
    const customImageMap = loadCustomImageMap();
    console.log(`Applying ${Object.keys(customImageMap).length} custom images from customImageMap.json`);
    
    for (const [showIdStr, imageUrl] of Object.entries(customImageMap)) {
      const showId = parseInt(showIdStr);
      if (isNaN(showId)) continue;
      
      const show = await getShowById(showId);
      if (show) {
        console.log(`Applying custom image to show ID ${showId}: ${show.name}`);
        await updateShow(showId, { imageUrl });
      }
    }
  } catch (error) {
    console.error('Error applying custom images:', error);
  }
}