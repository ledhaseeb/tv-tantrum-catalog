/**
 * TV Show Data Consolidation Script
 * 
 * This script consolidates TV show data from three sources:
 * 1. Preservator route (highest priority for custom details and images)
 * 2. Google Sheets data (secondary source for show details)
 * 3. GitHub repository (source for images if not in preservator)
 * 
 * The script creates a single source of truth for TV show information
 * and writes it to the database.
 */

const { pool } = require('./server/db');
const fs = require('fs').promises;
const path = require('path');

// Load custom show details from preservator
async function loadCustomShowDetails() {
  try {
    console.log('Loading custom show details from preservator...');
    const customDetailsPath = path.join(__dirname, 'data', 'custom-show-details.json');
    const data = await fs.readFile(customDetailsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading custom show details:', error);
    return {};
  }
}

// Load custom image mappings from preservator
async function loadCustomImageMappings() {
  try {
    console.log('Loading custom image mappings from preservator...');
    const customImagesPath = path.join(__dirname, 'data', 'custom-image-map.json');
    const data = await fs.readFile(customImagesPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading custom image mappings:', error);
    return {};
  }
}

// Load TV show data from Google Sheets (via existing JSON file)
async function loadGoogleSheetsData() {
  try {
    console.log('Loading Google Sheets data...');
    const sheetsDataPath = path.join(__dirname, 'data', 'tv-shows.json');
    const data = await fs.readFile(sheetsDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading Google Sheets data:', error);
    return [];
  }
}

// Load GitHub repository data for images
async function loadGitHubData() {
  try {
    console.log('Loading GitHub repository data...');
    const githubDataPath = path.join(__dirname, 'data', 'github-shows.json');
    const data = await fs.readFile(githubDataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading GitHub data:', error);
    return [];
  }
}

// Merge show data by prioritizing sources
async function mergeShowData() {
  // Load data from all sources
  const customDetails = await loadCustomShowDetails();
  const customImages = await loadCustomImageMappings();
  const sheetsData = await loadGoogleSheetsData();
  const githubData = await loadGitHubData();
  
  console.log(`Loaded data from sources:
    - Custom details: ${Object.keys(customDetails).length} shows
    - Custom images: ${Object.keys(customImages).length} shows
    - Google Sheets: ${sheetsData.length} shows
    - GitHub: ${githubData.length} shows`);
  
  // Create a map to track shows by ID
  const showsMap = new Map();
  
  // First, process Google Sheets data (base data)
  for (const show of sheetsData) {
    showsMap.set(show.id, {
      id: show.id,
      name: show.name,
      description: show.description || '',
      ageRange: show.ageRange || '',
      tantrumFactor: show.tantrumFactor || '',
      themes: show.themes || [],
      network: show.network || '',
      year: show.year || '',
      productionCompany: show.productionCompany || '',
      stimulationScore: show.stimulationScore || 0,
      imageUrl: null, // Will be filled in later
      
      // Additional fields that may come from Google Sheets
      interactionLevel: show.interactionLevel || null,
      dialogueIntensity: show.dialogueIntensity || null,
      soundFrequency: show.soundFrequency || null,
      totalMusicLevel: show.totalMusicLevel || null,
      musicTempo: show.musicTempo || null,
      soundEffectsLevel: show.soundEffectsLevel || null,
      animationStyle: show.animationStyle || null,
      sceneFrequency: show.sceneFrequency || null,
      
      // Fields that need to be present in the schema
      episodeLength: show.episodeLength || 0,
      creator: show.creator || null,
      releaseYear: show.releaseYear || null,
      endYear: show.endYear || null,
      isOngoing: show.isOngoing || null,
      seasons: show.seasons || null,
      totalEpisodes: show.totalEpisodes || null,
      productionCountry: show.productionCountry || null,
      language: show.language || null,
      genre: show.genre || null,
      targetAudience: show.targetAudience || null,
      viewerRating: show.viewerRating || null,
      
      // Data source tracking
      dataSource: {
        details: 'google-sheets',
        images: null
      }
    });
  }
  
  // Add GitHub data, focusing mainly on images
  for (const githubShow of githubData) {
    const showId = githubShow.id;
    if (showsMap.has(showId)) {
      // Update existing show with GitHub image
      const show = showsMap.get(showId);
      if (!show.imageUrl && githubShow.imageUrl) {
        show.imageUrl = githubShow.imageUrl;
        show.dataSource.images = 'github';
      }
      showsMap.set(showId, show);
    } else {
      // Create a new show entry if it doesn't exist
      console.log(`Found GitHub show not in Google Sheets: ${githubShow.name} (ID: ${showId})`);
      showsMap.set(showId, {
        id: showId,
        name: githubShow.name || '',
        description: githubShow.description || '',
        ageRange: githubShow.ageRange || '',
        tantrumFactor: githubShow.tantrumFactor || '',
        themes: githubShow.themes || [],
        network: githubShow.network || '',
        year: githubShow.year || '',
        productionCompany: githubShow.productionCompany || '',
        stimulationScore: githubShow.stimulationScore || 0,
        imageUrl: githubShow.imageUrl || null,
        
        // Additional fields
        interactionLevel: githubShow.interactionLevel || null,
        dialogueIntensity: githubShow.dialogueIntensity || null,
        soundFrequency: githubShow.soundFrequency || null,
        totalMusicLevel: githubShow.totalMusicLevel || null,
        musicTempo: githubShow.musicTempo || null,
        soundEffectsLevel: githubShow.soundEffectsLevel || null,
        animationStyle: githubShow.animationStyle || null,
        sceneFrequency: githubShow.sceneFrequency || null,
        
        // Required fields
        episodeLength: githubShow.episodeLength || 0,
        creator: githubShow.creator || null,
        releaseYear: githubShow.releaseYear || null,
        endYear: githubShow.endYear || null,
        isOngoing: githubShow.isOngoing || null,
        seasons: githubShow.seasons || null,
        totalEpisodes: githubShow.totalEpisodes || null,
        productionCountry: githubShow.productionCountry || null,
        language: githubShow.language || null,
        genre: githubShow.genre || null,
        targetAudience: githubShow.targetAudience || null,
        viewerRating: githubShow.viewerRating || null,
        
        // Data source tracking
        dataSource: {
          details: 'github',
          images: 'github'
        }
      });
    }
  }
  
  // Apply custom details (highest priority)
  for (const [showIdStr, customDetail] of Object.entries(customDetails)) {
    const showId = parseInt(showIdStr, 10);
    if (showsMap.has(showId)) {
      // Update existing show with custom details
      const show = showsMap.get(showId);
      
      // Apply each custom detail, overriding existing values
      for (const [key, value] of Object.entries(customDetail)) {
        if (value !== undefined && value !== null) {
          show[key] = value;
        }
      }
      
      // Mark as having custom details
      show.dataSource.details = 'custom';
      showsMap.set(showId, show);
    } else {
      console.log(`Warning: Custom details for show ID ${showId} but show not found in other sources`);
    }
  }
  
  // Apply custom images (highest priority)
  for (const [showIdStr, imageUrl] of Object.entries(customImages)) {
    const showId = parseInt(showIdStr, 10);
    if (showsMap.has(showId) && imageUrl) {
      const show = showsMap.get(showId);
      show.imageUrl = imageUrl;
      show.dataSource.images = 'custom';
      showsMap.set(showId, show);
    }
  }
  
  // Convert map to array for final output
  return Array.from(showsMap.values());
}

// Save the consolidated data to the database
async function saveToDatabase(shows) {
  const client = await pool.connect();
  let successCount = 0;
  let errorCount = 0;
  
  try {
    await client.query('BEGIN');
    
    // First, create a temporary table to store all the consolidated data
    await client.query(`
      CREATE TEMP TABLE temp_tv_shows (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        age_range TEXT,
        tantrum_factor TEXT,
        themes TEXT[],
        network TEXT,
        year TEXT,
        production_company TEXT,
        stimulation_score INTEGER,
        image_url TEXT,
        interaction_level TEXT,
        dialogue_intensity TEXT,
        sound_frequency TEXT,
        total_music_level TEXT,
        music_tempo TEXT,
        sound_effects_level TEXT,
        animation_style TEXT,
        scene_frequency TEXT,
        episode_length INTEGER,
        creator TEXT,
        release_year INTEGER,
        end_year INTEGER,
        is_ongoing BOOLEAN,
        seasons INTEGER,
        total_episodes INTEGER,
        production_country TEXT,
        language TEXT,
        genre TEXT,
        target_audience TEXT,
        viewer_rating TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert each show into the temporary table
    for (const show of shows) {
      try {
        await client.query(`
          INSERT INTO temp_tv_shows (
            id, name, description, age_range, tantrum_factor, themes, network, year,
            production_company, stimulation_score, image_url, interaction_level, 
            dialogue_intensity, sound_frequency, total_music_level, music_tempo,
            sound_effects_level, animation_style, scene_frequency, episode_length,
            creator, release_year, end_year, is_ongoing, seasons, total_episodes,
            production_country, language, genre, target_audience, viewer_rating
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
            $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
          )
        `, [
          show.id,
          show.name,
          show.description,
          show.ageRange,
          show.tantrumFactor,
          show.themes,
          show.network,
          show.year,
          show.productionCompany,
          show.stimulationScore,
          show.imageUrl,
          show.interactionLevel,
          show.dialogueIntensity,
          show.soundFrequency,
          show.totalMusicLevel,
          show.musicTempo,
          show.soundEffectsLevel,
          show.animationStyle,
          show.sceneFrequency,
          show.episodeLength,
          show.creator,
          show.releaseYear,
          show.endYear,
          show.isOngoing,
          show.seasons,
          show.totalEpisodes,
          show.productionCountry,
          show.language,
          show.genre,
          show.targetAudience,
          show.viewerRating
        ]);
        successCount++;
      } catch (insertError) {
        console.error(`Error inserting show ID ${show.id} (${show.name}):`, insertError);
        errorCount++;
      }
    }
    
    // Update existing tv_shows table with data from temp table
    await client.query(`
      INSERT INTO tv_shows AS t (
        id, name, description, age_range, tantrum_factor, themes, network, year,
        production_company, stimulation_score, image_url, interaction_level, 
        dialogue_intensity, sound_frequency, total_music_level, music_tempo,
        sound_effects_level, animation_style, scene_frequency, episode_length,
        creator, release_year, end_year, is_ongoing, seasons, total_episodes,
        production_country, language, genre, target_audience, viewer_rating,
        created_at, updated_at
      )
      SELECT 
        tt.id, tt.name, tt.description, tt.age_range, tt.tantrum_factor, tt.themes, tt.network, tt.year,
        tt.production_company, tt.stimulation_score, tt.image_url, tt.interaction_level,
        tt.dialogue_intensity, tt.sound_frequency, tt.total_music_level, tt.music_tempo,
        tt.sound_effects_level, tt.animation_style, tt.scene_frequency, tt.episode_length,
        tt.creator, tt.release_year, tt.end_year, tt.is_ongoing, tt.seasons, tt.total_episodes,
        tt.production_country, tt.language, tt.genre, tt.target_audience, tt.viewer_rating,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM temp_tv_shows tt
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        age_range = EXCLUDED.age_range,
        tantrum_factor = EXCLUDED.tantrum_factor,
        themes = EXCLUDED.themes,
        network = EXCLUDED.network,
        year = EXCLUDED.year,
        production_company = EXCLUDED.production_company,
        stimulation_score = EXCLUDED.stimulation_score,
        image_url = EXCLUDED.image_url,
        interaction_level = EXCLUDED.interaction_level,
        dialogue_intensity = EXCLUDED.dialogue_intensity,
        sound_frequency = EXCLUDED.sound_frequency,
        total_music_level = EXCLUDED.total_music_level,
        music_tempo = EXCLUDED.music_tempo,
        sound_effects_level = EXCLUDED.sound_effects_level,
        animation_style = EXCLUDED.animation_style,
        scene_frequency = EXCLUDED.scene_frequency,
        episode_length = EXCLUDED.episode_length,
        creator = EXCLUDED.creator,
        release_year = EXCLUDED.release_year,
        end_year = EXCLUDED.end_year,
        is_ongoing = EXCLUDED.is_ongoing,
        seasons = EXCLUDED.seasons,
        total_episodes = EXCLUDED.total_episodes,
        production_country = EXCLUDED.production_country,
        language = EXCLUDED.language,
        genre = EXCLUDED.genre,
        target_audience = EXCLUDED.target_audience,
        viewer_rating = EXCLUDED.viewer_rating,
        updated_at = CURRENT_TIMESTAMP
    `);
    
    await client.query('COMMIT');
    console.log(`Successfully saved ${successCount} shows to database (${errorCount} errors)`);
    return { success: true, successCount, errorCount };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving consolidated show data to database:', error);
    return { success: false, error: error.message };
  } finally {
    client.release();
  }
}

// Main function to run the consolidation
async function consolidateTvData() {
  console.log('Starting TV show data consolidation...');
  
  try {
    // Merge data from all sources
    const consolidatedShows = await mergeShowData();
    console.log(`Consolidated ${consolidatedShows.length} TV shows from all sources`);
    
    // Save to database
    const result = await saveToDatabase(consolidatedShows);
    if (result.success) {
      console.log('TV show data consolidation completed successfully!');
      console.log(`${result.successCount} shows saved (${result.errorCount} errors)`);
    } else {
      console.error('TV show data consolidation failed:', result.error);
    }
  } catch (error) {
    console.error('Unexpected error during TV show data consolidation:', error);
  }
}

// Run the consolidation
consolidateTvData().catch(console.error);