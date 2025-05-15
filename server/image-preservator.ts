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
 * Uses batch processing for improved performance
 */
export async function applyCustomImages(getShowById: (id: number) => Promise<any>, updateShow: (id: number, data: any) => Promise<any>): Promise<void> {
  try {
    const customImageMap = loadCustomImageMap();
    console.log(`Applying ${Object.keys(customImageMap).length} custom images from customImageMap.json`);
    
    // Skip custom images application if in performance mode
    if (process.env.SKIP_CUSTOM_IMAGES === 'true') {
      console.log('Skipping custom images application (SKIP_CUSTOM_IMAGES=true)');
      return;
    }
    
    // Process in batches of 20 shows
    const BATCH_SIZE = 20;
    const showIds = Object.keys(customImageMap).map(id => parseInt(id)).filter(id => !isNaN(id));
    const totalBatches = Math.ceil(showIds.length / BATCH_SIZE);
    
    console.log(`Processing ${showIds.length} images in ${totalBatches} batches of ${BATCH_SIZE}`);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchStart = batchIndex * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, showIds.length);
      const currentBatch = showIds.slice(batchStart, batchEnd);
      
      console.log(`Processing image batch ${batchIndex + 1}/${totalBatches} (shows ${batchStart+1}-${batchEnd})`);
      
      // Process each batch in parallel
      const batchPromises = currentBatch.map(async (showId) => {
        try {
          const show = await getShowById(showId);
          if (show) {
            // Don't log every show to reduce console output
            // console.log(`Applying custom image to show ID ${showId}: ${show.name}`);
            return updateShow(showId, { imageUrl: customImageMap[showId.toString()] });
          }
        } catch (err) {
          console.error(`Error updating image for show ${showId}:`, err);
        }
      });
      
      // Wait for current batch to complete before processing next batch
      await Promise.all(batchPromises);
    }
    
    console.log('Custom images application completed');
  } catch (error) {
    console.error('Error applying custom images:', error);
  }
}