/**
 * Backup TV Shows Data Provider
 * 
 * This script checks if the database connection is working properly.
 * If not, it loads TV show data from local JSON files.
 */

const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../server/db');

// File paths for TV show data sources
const DATA_FILES = {
  showDetails: path.join(__dirname, 'custom-show-details.json'),
  imageMap: path.join(__dirname, 'custom-image-map.json'),
  tvShows: path.join(__dirname, 'tv-shows.json'),
  githubShows: path.join(__dirname, 'github-shows.json')
};

// Create empty JSON files if they don't exist
async function ensureDataFiles() {
  for (const [key, filePath] of Object.entries(DATA_FILES)) {
    try {
      await fs.access(filePath);
    } catch (error) {
      // File doesn't exist, create it with empty data
      const defaultContent = key === 'showDetails' || key === 'imageMap' ? '{}' : '[]';
      await fs.writeFile(filePath, defaultContent);
      console.log(`Created empty data file: ${filePath}`);
    }
  }
}

// Test database connection
async function testDatabaseConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT COUNT(*) FROM tv_shows');
    return {
      connected: true,
      count: parseInt(result.rows[0].count, 10)
    };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return {
      connected: false,
      error: error.message
    };
  } finally {
    if (client) client.release();
  }
}

// Load data from local files
async function loadLocalData() {
  await ensureDataFiles();
  
  try {
    // Load TV shows from JSON file
    const showsData = await fs.readFile(DATA_FILES.tvShows, 'utf8');
    const shows = JSON.parse(showsData);
    
    // Load custom details
    const detailsData = await fs.readFile(DATA_FILES.showDetails, 'utf8');
    const customDetails = JSON.parse(detailsData);
    
    // Load custom image map
    const imageData = await fs.readFile(DATA_FILES.imageMap, 'utf8');
    const customImages = JSON.parse(imageData);
    
    // Apply custom details and images to shows
    const enhancedShows = shows.map(show => {
      const showId = show.id.toString();
      const customDetail = customDetails[showId];
      const customImage = customImages[showId];
      
      // Apply custom details if available
      if (customDetail) {
        Object.assign(show, customDetail);
      }
      
      // Apply custom image if available
      if (customImage) {
        show.imageUrl = customImage;
      }
      
      return show;
    });
    
    return enhancedShows;
  } catch (error) {
    console.error('Error loading local TV show data:', error);
    return [];
  }
}

// Main function to get TV shows data
async function getTvShows() {
  // Check database connection
  const dbStatus = await testDatabaseConnection();
  
  if (dbStatus.connected && dbStatus.count > 0) {
    // Database is working and has data, use it
    console.log(`Using database for TV shows (${dbStatus.count} shows available)`);
    try {
      const client = await pool.connect();
      try {
        const result = await client.query('SELECT * FROM tv_shows ORDER BY name');
        return result.rows.map(row => ({
          id: row.id,
          name: row.name || '',
          description: row.description || '',
          ageRange: row.age_range || '',
          tantrumFactor: row.tantrum_factor || '',
          themes: row.themes || [],
          network: row.network || null,
          year: row.year || '',
          productionCompany: row.production_company || '',
          stimulationScore: row.stimulation_score || 0,
          imageUrl: row.image_url,
          interactionLevel: row.interaction_level || null,
          dialogueIntensity: row.dialogue_intensity || null,
          soundFrequency: row.sound_frequency || null,
          totalMusicLevel: row.total_music_level || null,
          musicTempo: row.music_tempo || null,
          soundEffectsLevel: row.sound_effects_level || null,
          animationStyle: row.animation_style || null,
          sceneFrequency: row.scene_frequency || null,
          episodeLength: row.episode_length || 0,
          creator: row.creator || null,
          releaseYear: row.release_year || null,
          endYear: row.end_year || null,
          isOngoing: row.is_ongoing || null,
          seasons: row.seasons || null,
          totalEpisodes: row.total_episodes || null,
          productionCountry: row.production_country || null,
          language: row.language || null,
          genre: row.genre || null,
          targetAudience: row.target_audience || null,
          viewerRating: row.viewer_rating || null
        }));
      } finally {
        client.release();
      }
    } catch (dbError) {
      console.error('Error fetching shows from database:', dbError);
      return await loadLocalData();
    }
  } else {
    // Database is not working or empty, use local data
    console.log('Database not available or empty, using local data files');
    return await loadLocalData();
  }
}

module.exports = {
  getTvShows,
  testDatabaseConnection,
  loadLocalData,
  ensureDataFiles
};

// If run directly, test the module
if (require.main === module) {
  (async () => {
    try {
      console.log('Testing backup TV shows data provider...');
      
      // Ensure data files exist
      await ensureDataFiles();
      
      // Test database connection
      const dbStatus = await testDatabaseConnection();
      console.log('Database status:', dbStatus);
      
      // Get TV shows
      const shows = await getTvShows();
      console.log(`Retrieved ${shows.length} TV shows`);
      
      // Print first show as sample
      if (shows.length > 0) {
        console.log('Sample show:', shows[0]);
      }
      
      console.log('Test completed successfully');
    } catch (error) {
      console.error('Test failed:', error);
    }
  })();
}