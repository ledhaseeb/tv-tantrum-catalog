/**
 * Consolidated Data Management Utility
 * 
 * This script replaces multiple overlapping data management scripts:
 * - consolidate-tv-data.js
 * - update-sensory-details.js
 * - update-show-metrics.js
 * 
 * Features:
 * - Consolidates TV show data from multiple sources
 * - Updates sensory details from Google Sheets
 * - Manages show metrics and ratings
 * - Maintains data integrity with custom details
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { parse } = require('csv-parse/sync');
const dotenv = require('dotenv');

dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// File paths
const customShowDetailsPath = path.join(__dirname, 'data', 'custom-show-details.json');
const customImageMapPath = path.join(__dirname, 'data', 'custom-image-map.json');
const sheetsDataPath = path.join(__dirname, 'data', 'tv-shows.json');
const githubDataPath = path.join(__dirname, 'data', 'github-shows.json');
const sensoryDetailsPath = path.join(__dirname, 'data', 'sensory-details.csv');

/**
 * Load custom show details from file
 */
function loadCustomShowDetails() {
  try {
    if (fs.existsSync(customShowDetailsPath)) {
      const data = fs.readFileSync(customShowDetailsPath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error loading custom show details:', error);
    return {};
  }
}

/**
 * Save custom show details to file
 */
function saveCustomShowDetails(details) {
  try {
    fs.writeFileSync(customShowDetailsPath, JSON.stringify(details, null, 2));
    console.log('Custom show details saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving custom show details:', error);
    return false;
  }
}

/**
 * Load custom image mappings from file
 */
function loadCustomImageMap() {
  try {
    if (fs.existsSync(customImageMapPath)) {
      const data = fs.readFileSync(customImageMapPath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error loading custom image map:', error);
    return {};
  }
}

/**
 * Load TV show data from Google Sheets (JSON file)
 */
function loadGoogleSheetsData() {
  try {
    if (fs.existsSync(sheetsDataPath)) {
      const data = fs.readFileSync(sheetsDataPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading Google Sheets data:', error);
    return [];
  }
}

/**
 * Load TV show data from GitHub (JSON file)
 */
function loadGitHubData() {
  try {
    if (fs.existsSync(githubDataPath)) {
      const data = fs.readFileSync(githubDataPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading GitHub data:', error);
    return [];
  }
}

/**
 * Load sensory details from CSV file
 */
function loadSensoryDetails() {
  try {
    if (fs.existsSync(sensoryDetailsPath)) {
      const fileContent = fs.readFileSync(sensoryDetailsPath, 'utf8');
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });
      
      // Create a map of show name to sensory details
      const sensoryDetailsMap = {};
      records.forEach(record => {
        const showName = record.show_name || record.name;
        if (showName) {
          sensoryDetailsMap[showName.toLowerCase()] = record;
        }
      });
      
      return sensoryDetailsMap;
    }
    return {};
  } catch (error) {
    console.error('Error loading sensory details:', error);
    return {};
  }
}

/**
 * Normalize a field key from various sources
 */
function normalizeKey(key) {
  return key
    .replace(/([A-Z])/g, '_$1')  // Convert camelCase to snake_case
    .toLowerCase()
    .replace(/^_/, '');          // Remove leading underscore
}

/**
 * Normalize a value based on field type
 */
function normalizeValue(key, value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value;
  }
  
  // For numeric fields, ensure they're numbers
  if (key.includes('score') || key.includes('rating') || key.includes('count') || 
      key.includes('year') || key.includes('episode_length') || key.includes('seasons')) {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }
  
  // For boolean fields, convert to proper boolean
  if (key.includes('is_') || key.includes('has_')) {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return Boolean(value);
  }
  
  // Default: return as is
  return value;
}

/**
 * Process themes string or array into consistent array format
 */
function processThemes(themes) {
  if (!themes) return [];
  
  if (Array.isArray(themes)) {
    return themes.filter(Boolean);
  }
  
  if (typeof themes === 'string') {
    return themes
      .split(',')
      .map(theme => theme.trim())
      .filter(Boolean);
  }
  
  return [];
}

/**
 * Normalize show name for matching
 */
function normalizeShowName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
    .replace(/\s+/g, '');      // Remove whitespace
}

/**
 * Update a TV show's details in the database
 */
async function updateTvShow(id, details) {
  try {
    if (!id || Object.keys(details).length === 0) {
      return false;
    }
    
    // Build the SET clause for SQL update
    const setClause = Object.keys(details)
      .filter(key => details[key] !== undefined)
      .map(key => {
        const dbField = normalizeKey(key);
        return `${dbField} = $${setValues.length + 1}`;
      });
    
    if (setClause.length === 0) {
      return false;
    }
    
    // Get the values to update
    const setValues = Object.keys(details)
      .filter(key => details[key] !== undefined)
      .map(key => normalizeValue(normalizeKey(key), details[key]));
    
    // Add the ID parameter
    setValues.push(id);
    
    // Build and execute the query
    const query = `
      UPDATE tv_shows
      SET ${setClause.join(', ')}
      WHERE id = $${setValues.length}
      RETURNING id, name
    `;
    
    const result = await pool.query(query, setValues);
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error updating TV show ID ${id}:`, error);
    return false;
  }
}

/**
 * Consolidate TV show data from multiple sources
 */
async function consolidateTvData() {
  try {
    console.log('Starting TV data consolidation process...');
    
    // Load data from all sources
    const customDetails = loadCustomShowDetails();
    const customImages = loadCustomImageMap();
    const sheetsData = loadGoogleSheetsData();
    const githubData = loadGitHubData();
    const sensoryDetails = loadSensoryDetails();
    
    console.log(`Loaded data from sources:
      - Custom details: ${Object.keys(customDetails).length} shows
      - Custom images: ${Object.keys(customImages).length} shows
      - Google Sheets: ${sheetsData.length} shows
      - GitHub: ${githubData.length} shows
      - Sensory details: ${Object.keys(sensoryDetails).length} shows`);
    
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
        themes: processThemes(show.themes),
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
        episodeLength: show.episodeLength || 0,
        creator: show.creator || null,
        releaseYear: show.releaseYear || null,
        endYear: show.endYear || null,
        isOngoing: show.isOngoing || null,
        seasons: show.seasons || null,
      });
    }
    
    // Second, override with GitHub data (has more detailed sensory metrics)
    for (const githubShow of githubData) {
      // Try to find matching show in our existing map
      // Match by name if ID not available
      let matchId = null;
      
      if (githubShow.id) {
        // Direct ID match
        matchId = githubShow.id;
      } else {
        // Try to match by name
        const normalizedName = normalizeShowName(githubShow.title);
        
        for (const [id, show] of showsMap.entries()) {
          if (normalizeShowName(show.name) === normalizedName) {
            matchId = id;
            break;
          }
        }
      }
      
      if (matchId && showsMap.has(matchId)) {
        // Update the existing show with GitHub data
        const existingShow = showsMap.get(matchId);
        
        showsMap.set(matchId, {
          ...existingShow,
          // Override with GitHub data
          stimulationScore: githubShow.stimulation_score || existingShow.stimulationScore,
          interactivityLevel: githubShow.interactivity_level || existingShow.interactivityLevel,
          dialogueIntensity: githubShow.dialogue_intensity || existingShow.dialogueIntensity,
          soundEffectsLevel: githubShow.sound_effects_level || existingShow.soundEffectsLevel,
          musicTempo: githubShow.music_tempo || existingShow.musicTempo,
          totalMusicLevel: githubShow.total_music_level || existingShow.totalMusicLevel,
          totalSoundEffectTimeLevel: githubShow.total_sound_effect_time_level || existingShow.totalSoundEffectTimeLevel,
          sceneFrequency: githubShow.scene_frequency || existingShow.sceneFrequency,
          animationStyle: githubShow.animation_style || existingShow.animationStyle,
          themes: processThemes(githubShow.themes) || existingShow.themes,
          releaseYear: githubShow.release_year || existingShow.releaseYear,
          endYear: githubShow.end_year || existingShow.endYear,
          
          // Use an external image if no custom one exists
          imageUrl: existingShow.imageUrl
        });
      }
    }
    
    // Third, apply custom details (highest priority)
    for (const [showId, details] of Object.entries(customDetails)) {
      const id = parseInt(showId, 10);
      if (showsMap.has(id)) {
        const existingShow = showsMap.get(id);
        
        // Apply custom details, preserving existing data when no custom data exists
        showsMap.set(id, {
          ...existingShow,
          // Only override fields that exist in custom details
          ...Object.keys(details).reduce((acc, key) => {
            if (details[key] !== undefined && details[key] !== null) {
              acc[key] = details[key];
            }
            return acc;
          }, {})
        });
      }
    }
    
    // Fourth, apply sensory details from Google Sheets
    for (const [id, show] of showsMap.entries()) {
      const sensoryDetail = sensoryDetails[show.name.toLowerCase()];
      
      if (sensoryDetail) {
        const updatedShow = { ...show };
        
        // Apply sensory details from sheet
        if (sensoryDetail.dialogue_intensity) updatedShow.dialogueIntensity = sensoryDetail.dialogue_intensity;
        if (sensoryDetail.sound_frequency) updatedShow.soundFrequency = sensoryDetail.sound_frequency;
        if (sensoryDetail.total_music_level) updatedShow.totalMusicLevel = sensoryDetail.total_music_level;
        if (sensoryDetail.music_tempo) updatedShow.musicTempo = sensoryDetail.music_tempo;
        if (sensoryDetail.sound_effects_level) updatedShow.soundEffectsLevel = sensoryDetail.sound_effects_level;
        if (sensoryDetail.animation_style) updatedShow.animationStyle = sensoryDetail.animation_style;
        if (sensoryDetail.scene_frequency) updatedShow.sceneFrequency = sensoryDetail.scene_frequency;
        if (sensoryDetail.stimulation_score) updatedShow.stimulationScore = parseInt(sensoryDetail.stimulation_score, 10);
        if (sensoryDetail.interaction_level) updatedShow.interactionLevel = sensoryDetail.interaction_level;
        
        showsMap.set(id, updatedShow);
      }
    }
    
    // Finally, apply custom images
    for (const [showId, imageUrl] of Object.entries(customImages)) {
      const id = parseInt(showId, 10);
      if (showsMap.has(id) && imageUrl) {
        const show = showsMap.get(id);
        showsMap.set(id, {
          ...show,
          imageUrl
        });
      }
    }
    
    // Convert map to array for database update
    const shows = Array.from(showsMap.values());
    console.log(`Consolidated ${shows.length} TV shows`);
    
    // Update each show in the database
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const show of shows) {
      try {
        const success = await updateTvShow(show.id, show);
        if (success) {
          updatedCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error updating show "${show.name}":`, error);
        errorCount++;
      }
    }
    
    console.log('\nData consolidation complete:');
    console.log(`✅ Updated: ${updatedCount} shows`);
    console.log(`❌ Errors: ${errorCount} shows`);
    console.log(`📊 Total processed: ${shows.length} shows`);
    
  } catch (error) {
    console.error('Fatal error in data consolidation process:', error);
  } finally {
    await pool.end();
  }
}

/**
 * Update sensory details for all TV shows
 */
async function updateSensoryDetails() {
  try {
    console.log('Starting sensory details update process...');
    
    // Load sensory details from CSV
    const sensoryDetails = loadSensoryDetails();
    console.log(`Loaded sensory details for ${Object.keys(sensoryDetails).length} shows`);
    
    // Get all TV shows from database
    const result = await pool.query('SELECT id, name FROM tv_shows ORDER BY name');
    const shows = result.rows;
    
    console.log(`Found ${shows.length} shows in the database`);
    
    // Statistics
    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process each show
    for (const show of shows) {
      try {
        // Look for sensory details by show name
        const sensoryDetail = sensoryDetails[show.name.toLowerCase()];
        
        if (!sensoryDetail) {
          skippedCount++;
          continue;
        }
        
        // Create update object with sensory fields
        const updateFields = {};
        
        // Map columns from CSV to database fields
        if (sensoryDetail.dialogue_intensity) updateFields.dialogue_intensity = sensoryDetail.dialogue_intensity;
        if (sensoryDetail.sound_frequency) updateFields.sound_frequency = sensoryDetail.sound_frequency;
        if (sensoryDetail.total_music_level) updateFields.total_music_level = sensoryDetail.total_music_level;
        if (sensoryDetail.music_tempo) updateFields.music_tempo = sensoryDetail.music_tempo;
        if (sensoryDetail.sound_effects_level) updateFields.sound_effects_level = sensoryDetail.sound_effects_level;
        if (sensoryDetail.animation_style) updateFields.animation_style = sensoryDetail.animation_style;
        if (sensoryDetail.scene_frequency) updateFields.scene_frequency = sensoryDetail.scene_frequency;
        if (sensoryDetail.stimulation_score) updateFields.stimulation_score = parseInt(sensoryDetail.stimulation_score, 10);
        if (sensoryDetail.interaction_level) updateFields.interaction_level = sensoryDetail.interaction_level;
        
        // Only update if we have fields to update
        if (Object.keys(updateFields).length === 0) {
          skippedCount++;
          continue;
        }
        
        // Build SET clause for SQL
        const setClause = Object.keys(updateFields)
          .map((key, i) => `${key} = $${i + 1}`)
          .join(', ');
        
        // Build query with values
        const values = Object.values(updateFields);
        values.push(show.id);
        
        const query = `
          UPDATE tv_shows
          SET ${setClause}
          WHERE id = $${values.length}
          RETURNING id, name
        `;
        
        // Execute the update
        const updateResult = await pool.query(query, values);
        
        if (updateResult.rowCount > 0) {
          console.log(`✅ Updated sensory details for "${show.name}"`);
          updatedCount++;
        } else {
          console.error(`❌ Failed to update "${show.name}" in database`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error updating sensory details for "${show.name}":`, error);
        errorCount++;
      }
    }
    
    console.log('\nSensory details update complete:');
    console.log(`✅ Updated: ${updatedCount} shows`);
    console.log(`⏭️ Skipped: ${skippedCount} shows`);
    console.log(`❌ Errors: ${errorCount} shows`);
    console.log(`📊 Total processed: ${shows.length} shows`);
    
  } catch (error) {
    console.error('Fatal error in sensory details update process:', error);
  } finally {
    await pool.end();
  }
}

// Run the appropriate function based on command line argument
if (process.argv.includes('--consolidate')) {
  console.log('Running TV data consolidation process...');
  consolidateTvData().catch(console.error);
} else if (process.argv.includes('--sensory')) {
  console.log('Running sensory details update process...');
  updateSensoryDetails().catch(console.error);
} else {
  console.log('No command specified. Use one of:');
  console.log('  --consolidate  Consolidate TV show data from multiple sources');
  console.log('  --sensory      Update sensory details for TV shows');
}

// Export functions for use in other modules
module.exports = {
  consolidateTvData,
  updateSensoryDetails,
  loadCustomShowDetails,
  saveCustomShowDetails,
  loadGoogleSheetsData,
  loadGitHubData,
  loadSensoryDetails,
  updateTvShow
};