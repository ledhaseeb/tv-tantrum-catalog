/**
 * This script updates the TV shows in the database with sensory details from the CSV file.
 * It focuses on updating fields like animation_style, dialogue_intensity, etc. from the Google Sheet.
 */

import pg from 'pg';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const { Pool } = pg;

// Create pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false },
  application_name: 'tv-tantrum-updater'
};

const pool = new Pool(poolConfig);

// Path to the CSV file
const CSV_FILE_PATH = 'tvshow_sensory_data.csv';

async function updateSensoryDetails() {
  console.log('Starting update of sensory details from CSV file...');
  
  // Read and parse the CSV file
  const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Parsed ${records.length} records from CSV file`);
  
  // Create a map of show names to their sensory details
  const showDetailsMap = new Map();
  for (const record of records) {
    // Use program name as key, storing the sensory details
    const programName = record['Programs'];
    if (programName) {
      // Process ratings - convert 'Very High' to 'High'
      const processRating = (rating) => {
        if (!rating) return null;
        return rating.replace(/Very High/i, 'High');
      };
      
      showDetailsMap.set(programName.toLowerCase(), {
        interactivityLevel: processRating(record['Interactivity Level'] || null), // Column I
        animationStyle: record['Animation Styles'] || null, // Column J
        dialogueIntensity: processRating(record['Dialougue Intensity'] || null), // Column K
        soundEffectsLevel: processRating(record['Sound Effects'] || null), // Column L
        totalSoundEffectTimeLevel: processRating(record['Total Sound Effect Time'] || null), // Column M
        sceneFrequency: processRating(record['Scene Frequency'] || null), // Column N
        musicTempo: processRating(record['Music Tempo'] || null), // Column O
        totalMusicLevel: processRating(record['Total Music'] || null), // Column P
        themes: record['Themes, Teachings, Guidance'] 
          ? record['Themes, Teachings, Guidance'].split(',').map(t => t.trim()) 
          : [],
        stimulationScore: parseInt(record['Stimulation Score']) || 0,
        targetAgeGroup: record['Target Age Group'] || null,
        seasons: record['Seasons'] || null,
        episodeLength: record['Avg. Epsiode'] 
          ? parseInt(record['Avg. Epsiode'].replace(/\D/g, '')) || 0 
          : 0
      });
    }
  }
  
  // Get all shows from the database
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, name FROM tv_shows');
    console.log(`Retrieved ${result.rows.length} shows from database`);
    
    let updatedCount = 0;
    let noMatchCount = 0;
    const noMatchList = [];
    
    // For each show, check if we have sensory details and update if needed
    for (const show of result.rows) {
      // Try to match by exact name first
      let csvDetails = showDetailsMap.get(show.name.toLowerCase());
      
      // If no exact match, try to match by name without year/periods
      if (!csvDetails) {
        // Remove years and other special characters for fuzzy matching
        const simpleName = show.name.toLowerCase()
          .replace(/\s*\(\d{4}(-\d{4})?\)/, '') // Remove year ranges like (2010-2018)
          .replace(/[:,\.]/g, '')               // Remove colons, periods, commas
          .trim();
        
        // Try to find a match in the CSV data
        for (const [csvName, details] of showDetailsMap.entries()) {
          const simpleCSVName = csvName.toLowerCase()
            .replace(/\s*\(\d{4}(-\d{4})?\)/, '')
            .replace(/[:,\.]/g, '')
            .trim();
          
          if (simpleCSVName === simpleName || 
              simpleCSVName.includes(simpleName) || 
              simpleName.includes(simpleCSVName)) {
            csvDetails = details;
            console.log(`Fuzzy matched "${show.name}" to CSV entry "${csvName}"`);
            break;
          }
        }
      }
      
      // If we found matching details, update the database
      if (csvDetails) {
        // Build the update query with only non-null values
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;
        
        // Add fields to update query only if they have values
        if (csvDetails.animationStyle) {
          updateFields.push(`animation_style = $${paramIndex++}`);
          updateValues.push(csvDetails.animationStyle);
        }
        
        if (csvDetails.dialogueIntensity) {
          updateFields.push(`dialogue_intensity = $${paramIndex++}`);
          updateValues.push(csvDetails.dialogueIntensity);
        }
        
        // We've removed the soundFrequency field as it's redundant with soundEffectsLevel
        
        if (csvDetails.totalMusicLevel) {
          updateFields.push(`total_music_level = $${paramIndex++}`);
          updateValues.push(csvDetails.totalMusicLevel);
        }
        
        if (csvDetails.musicTempo) {
          updateFields.push(`music_tempo = $${paramIndex++}`);
          updateValues.push(csvDetails.musicTempo);
        }
        
        if (csvDetails.soundEffectsLevel) {
          updateFields.push(`sound_effects_level = $${paramIndex++}`);
          updateValues.push(csvDetails.soundEffectsLevel);
        }
        
        if (csvDetails.sceneFrequency) {
          updateFields.push(`scene_frequency = $${paramIndex++}`);
          updateValues.push(csvDetails.sceneFrequency);
        }
        
        if (csvDetails.totalSoundEffectTimeLevel) {
          updateFields.push(`total_sound_effect_time_level = $${paramIndex++}`);
          updateValues.push(csvDetails.totalSoundEffectTimeLevel);
        }
        
        if (csvDetails.interactivityLevel) {
          updateFields.push(`interactivity_level = $${paramIndex++}`);
          updateValues.push(csvDetails.interactivityLevel);
        }
        
        if (csvDetails.themes && csvDetails.themes.length > 0) {
          updateFields.push(`themes = $${paramIndex++}`);
          updateValues.push(csvDetails.themes);
        }
        
        if (csvDetails.stimulationScore) {
          updateFields.push(`stimulation_score = $${paramIndex++}`);
          updateValues.push(csvDetails.stimulationScore);
        }
        
        if (csvDetails.targetAgeGroup) {
          updateFields.push(`age_range = $${paramIndex++}`);
          updateValues.push(csvDetails.targetAgeGroup);
        }
        
        if (csvDetails.episodeLength && csvDetails.episodeLength > 0) {
          updateFields.push(`episode_length = $${paramIndex++}`);
          updateValues.push(csvDetails.episodeLength);
        }
        
        if (csvDetails.seasons) {
          // Try to extract a number from seasons text
          const seasonsMatch = csvDetails.seasons.match(/(\d+)/);
          if (seasonsMatch) {
            const seasonsNum = parseInt(seasonsMatch[1], 10);
            updateFields.push(`seasons = $${paramIndex++}`);
            updateValues.push(seasonsNum);
          }
        }
        
        // Only run update if we have fields to update
        if (updateFields.length > 0) {
          const updateQuery = `
            UPDATE tv_shows 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
          `;
          
          updateValues.push(show.id);
          
          try {
            await client.query(updateQuery, updateValues);
            updatedCount++;
            
            // Log every 50 updates to show progress
            if (updatedCount % 50 === 0) {
              console.log(`Updated ${updatedCount} shows so far...`);
            }
          } catch (updateError) {
            console.error(`Error updating show "${show.name}" (ID: ${show.id}):`, updateError);
          }
        }
      } else {
        // No match found in CSV
        noMatchCount++;
        noMatchList.push(show.name);
      }
    }
    
    console.log(`Update completed. ${updatedCount} shows updated.`);
    console.log(`${noMatchCount} shows had no matching CSV data.`);
    
    if (noMatchList.length > 0) {
      console.log('First 10 shows with no matches:', noMatchList.slice(0, 10));
    }
    
  } catch (error) {
    console.error('Error updating sensory details:', error);
  } finally {
    client.release();
  }
}

// Run the update function
updateSensoryDetails().then(() => {
  console.log('Sensory details update script completed.');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});