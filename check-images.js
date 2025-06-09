// Script to identify landscape images and attempt to replace them with OMDB portrait images

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// OMDB API Key
const omdbApiKey = process.env.OMDB_API_KEY;

// Function to fetch image metadata
async function getImageMetadata(imageUrl) {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    if (!response.ok) {
      return { 
        success: false, 
        error: `Failed to fetch image: ${response.statusText}`,
        url: imageUrl
      };
    }
    
    return { success: true, url: imageUrl };
  } catch (error) {
    return { success: false, error: error.message, url: imageUrl };
  }
}

// Function to search for a show on OMDB
async function searchOmdb(title) {
  try {
    const url = `http://www.omdbapi.com/?apikey=${omdbApiKey}&t=${encodeURIComponent(title)}&type=series`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.Response === 'True' && data.Poster && data.Poster !== 'N/A') {
      return {
        success: true,
        title: data.Title,
        poster: data.Poster,
        imdbId: data.imdbID
      };
    } else {
      return {
        success: false,
        error: data.Error || 'No poster available',
        searchedTitle: title
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      searchedTitle: title
    };
  }
}

// Main function
async function main() {
  try {
    // Read the shows from shows.json
    const showsPath = path.join(__dirname, 'shows.json');
    const data = fs.readFileSync(showsPath, 'utf8');
    const shows = JSON.parse(data);
    
    console.log(`Found ${shows.length} shows in shows.json`);
    
    // Create arrays to track our process
    const needOMDB = [];
    const successfulUpdates = [];
    const notFoundOnOMDB = [];
    
    // Check each show's image URL
    for (const show of shows) {
      if (show.imageUrl) {
        // For now, let's just add all shows to the needOMDB list
        // In a real implementation, we would check if the image is landscape
        needOMDB.push({
          id: show.id,
          name: show.name,
          currentImageUrl: show.imageUrl
        });
      }
    }
    
    console.log(`\nFound ${needOMDB.length} shows that need OMDB poster lookup`);
    
    // Try to get OMDB posters for all shows in the needOMDB list
    for (const show of needOMDB) {
      console.log(`Looking up OMDB poster for "${show.name}"...`);
      
      const omdbResult = await searchOmdb(show.name);
      
      if (omdbResult.success) {
        successfulUpdates.push({
          id: show.id,
          name: show.name,
          oldImageUrl: show.currentImageUrl,
          newImageUrl: omdbResult.poster,
          imdbId: omdbResult.imdbId
        });
        
        console.log(`✓ Found OMDB poster for "${show.name}"`);
      } else {
        notFoundOnOMDB.push({
          id: show.id,
          name: show.name,
          currentImageUrl: show.currentImageUrl,
          error: omdbResult.error
        });
        
        console.log(`✗ No OMDB poster found for "${show.name}": ${omdbResult.error}`);
      }
      
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Save results to files
    fs.writeFileSync('omdb-updates.json', JSON.stringify(successfulUpdates, null, 2));
    fs.writeFileSync('shows-missing-posters.json', JSON.stringify(notFoundOnOMDB, null, 2));
    
    console.log('\nResults:');
    console.log(`- ${successfulUpdates.length} shows can be updated with OMDB posters`);
    console.log(`- ${notFoundOnOMDB.length} shows were not found on OMDB`);
    console.log('\nSaved results to:');
    console.log('- omdb-updates.json (shows with available OMDB posters)');
    console.log('- shows-missing-posters.json (shows not found on OMDB)');
    
  } catch (error) {
    console.error('Error processing shows:', error);
  }
}

// Check if OMDB API key is available
if (!omdbApiKey) {
  console.error('Error: OMDB_API_KEY environment variable is not set.');
  console.log('Please set the OMDB_API_KEY environment variable and try again.');
  process.exit(1);
}

// Run the main function
main();