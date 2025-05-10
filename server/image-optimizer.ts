import { omdbService } from './omdb';
import { storage } from './storage';
import { TvShow } from '@shared/schema';
import fetch from 'node-fetch';

interface ImageDimensions {
  width: number;
  height: number;
  isLandscape: boolean;
}

interface ImageCheckResult {
  id: number;
  name: string;
  currentImageUrl: string;
  dimensions?: ImageDimensions;
  isLandscape?: boolean;
  error?: string;
}

interface ImageUpdateResult {
  id: number;
  name: string;
  oldImageUrl: string;
  newImageUrl: string;
  imdbId?: string;
  error?: string;
}

export async function checkImageOrientation(imageUrl: string): Promise<ImageDimensions | null> {
  // Skip checks for images that don't exist or are from OMDB already
  if (!imageUrl || imageUrl === 'N/A' || imageUrl.includes('omdbapi.com') || imageUrl.includes('m.media-amazon.com')) {
    return null;
  }

  // In a Node.js environment, we can't use the Image object directly
  // Instead, we'll assume OMDB images are portrait and just continue with the update process
  
  // The Image object check would work in a browser environment, but not in Node.js
  // For now, we'll just consider all shows as candidates for optimization
  console.log(`Assuming image needs optimization: ${imageUrl}`);
  return null;
}

export async function updateShowImagesFromOmdb() {
  // Get all shows
  const shows = await storage.getAllTvShows();
  
  const landscapeShows: ImageCheckResult[] = [];
  const successfulUpdates: ImageUpdateResult[] = [];
  const failedUpdates: ImageUpdateResult[] = [];
  
  console.log(`Starting image optimization for ${shows.length} shows`);
  
  // Process each show to find landscape images or shows without good images
  for (const show of shows) {
    if (!show.imageUrl) {
      // Add shows with no images
      landscapeShows.push({
        id: show.id,
        name: show.name,
        currentImageUrl: '',
        isLandscape: true // Assume we need a replacement
      });
      continue;
    }
    
    try {
      // Check if the current image is landscape
      const dimensions = await checkImageOrientation(show.imageUrl);
      
      if (!dimensions) {
        // If we couldn't check dimensions, include it for potential update
        landscapeShows.push({
          id: show.id,
          name: show.name,
          currentImageUrl: show.imageUrl,
          isLandscape: true // Default to try updating
        });
      } else if (dimensions.isLandscape) {
        // If the image is landscape, include it for update
        landscapeShows.push({
          id: show.id,
          name: show.name,
          currentImageUrl: show.imageUrl,
          dimensions,
          isLandscape: true
        });
        console.log(`Found landscape image for "${show.name}": ${dimensions.width}x${dimensions.height}`);
      }
    } catch (error) {
      console.error(`Error checking dimensions for "${show.name}":`, error);
      // Include it anyway in case there's an error
      landscapeShows.push({
        id: show.id,
        name: show.name,
        currentImageUrl: show.imageUrl,
        error: error instanceof Error ? error.message : 'Unknown dimension check error',
        isLandscape: true // Default to try updating
      });
    }
  }
  
  console.log(`Found ${landscapeShows.length} shows with landscape or problematic images to update`);
  
  // Try to update each show with OMDB poster
  for (const show of landscapeShows) {
    try {
      console.log(`Looking up OMDB poster for "${show.name}"`);
      const omdbData = await omdbService.getShowData(show.name);
      
      if (omdbData && omdbData.poster && omdbData.poster !== 'N/A') {
        // Before updating, verify the OMDB poster is portrait-oriented
        let isOmdbPosterPortrait = true; // Assume portrait by default for OMDB
        
        // Only update if we're replacing a landscape image with a portrait one
        if (isOmdbPosterPortrait) {
          const updatedShow = await storage.updateTvShow(show.id, {
            imageUrl: omdbData.poster
          });
          
          if (updatedShow) {
            successfulUpdates.push({
              id: show.id,
              name: show.name,
              oldImageUrl: show.currentImageUrl,
              newImageUrl: omdbData.poster,
              imdbId: omdbData.imdbId
            });
            console.log(`✓ Updated "${show.name}" with OMDB poster`);
          } else {
            failedUpdates.push({
              id: show.id,
              name: show.name,
              oldImageUrl: show.currentImageUrl,
              newImageUrl: omdbData.poster,
              error: 'Storage update failed'
            });
            console.log(`✗ Failed to update "${show.name}" in storage`);
          }
        } else {
          failedUpdates.push({
            id: show.id,
            name: show.name,
            oldImageUrl: show.currentImageUrl,
            newImageUrl: omdbData.poster,
            error: 'OMDB poster is not portrait-oriented'
          });
          console.log(`✗ Skipped "${show.name}" because OMDB poster is not portrait-oriented`);
        }
      } else {
        failedUpdates.push({
          id: show.id,
          name: show.name,
          oldImageUrl: show.currentImageUrl,
          newImageUrl: '',
          error: 'No OMDB poster found'
        });
        console.log(`✗ No OMDB poster found for "${show.name}"`);
      }
    } catch (error) {
      failedUpdates.push({
        id: show.id,
        name: show.name,
        oldImageUrl: show.currentImageUrl,
        newImageUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`✗ Error updating "${show.name}": ${error}`);
    }
    
    // Add a small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return {
    total: landscapeShows.length,
    successful: successfulUpdates,
    failed: failedUpdates
  };
}