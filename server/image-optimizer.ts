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
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.statusText}`);
      return null;
    }
    
    // We can't actually check dimensions without loading into an image
    // For now, return null as we'll just try to get OMDB images for all
    return null;
  } catch (error) {
    console.error('Error checking image orientation:', error);
    return null;
  }
}

export async function updateShowImagesFromOmdb() {
  // Get all shows
  const shows = await storage.getAllTvShows();
  
  const landscapeShows: ImageCheckResult[] = [];
  const successfulUpdates: ImageUpdateResult[] = [];
  const failedUpdates: ImageUpdateResult[] = [];
  
  console.log(`Starting image optimization for ${shows.length} shows`);
  
  // Process each show
  for (const show of shows) {
    if (!show.imageUrl) continue;
    
    // For now, assume all images need to be checked with OMDB 
    // as we don't have a reliable way to check dimensions server-side
    landscapeShows.push({
      id: show.id,
      name: show.name,
      currentImageUrl: show.imageUrl,
    });
  }
  
  console.log(`Found ${landscapeShows.length} shows to check for OMDB posters`);
  
  // Try to update each show with OMDB poster
  for (const show of landscapeShows) {
    try {
      console.log(`Looking up OMDB poster for "${show.name}"`);
      const omdbData = await omdbService.getShowData(show.name);
      
      if (omdbData && omdbData.poster && omdbData.poster !== 'N/A') {
        // Update the show with the OMDB poster
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