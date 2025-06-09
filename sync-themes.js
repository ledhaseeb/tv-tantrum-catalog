/**
 * Theme Synchronization Utility
 * 
 * This script synchronizes themes between tv_shows.themes array and the themes/tv_show_themes tables
 * It ensures all themes from TV shows are available in the themes table and properly linked
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Get all unique themes from tv_shows.themes arrays
 */
async function getAllThemesFromShows() {
  try {
    const result = await pool.query('SELECT id, themes FROM tv_shows WHERE themes IS NOT NULL AND array_length(themes, 1) > 0');
    
    const allThemes = new Set();
    result.rows.forEach(row => {
      if (row.themes && Array.isArray(row.themes)) {
        row.themes.forEach(theme => {
          if (theme && theme.trim()) {
            allThemes.add(theme.trim());
          }
        });
      }
    });
    
    return Array.from(allThemes);
  } catch (error) {
    console.error('Error getting themes from shows:', error);
    return [];
  }
}

/**
 * Add missing themes to the themes table
 */
async function addMissingThemes(themes) {
  const addedThemes = [];
  
  for (const theme of themes) {
    try {
      const result = await pool.query(
        'INSERT INTO themes (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name',
        [theme]
      );
      
      if (result.rows.length > 0) {
        addedThemes.push(result.rows[0]);
        console.log(`Added new theme: ${theme}`);
      }
    } catch (error) {
      console.error(`Error adding theme "${theme}":`, error);
    }
  }
  
  return addedThemes;
}

/**
 * Get theme ID by name
 */
async function getThemeId(themeName) {
  try {
    const result = await pool.query('SELECT id FROM themes WHERE name = $1', [themeName]);
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error(`Error getting theme ID for "${themeName}":`, error);
    return null;
  }
}

/**
 * Sync tv_show_themes relationships
 */
async function syncShowThemeRelationships() {
  try {
    // Get all shows with themes
    const showsResult = await pool.query('SELECT id, themes FROM tv_shows WHERE themes IS NOT NULL AND array_length(themes, 1) > 0');
    
    let synced = 0;
    let errors = 0;
    
    for (const show of showsResult.rows) {
      try {
        // Clear existing relationships for this show
        await pool.query('DELETE FROM tv_show_themes WHERE tv_show_id = $1', [show.id]);
        
        // Add new relationships
        if (show.themes && Array.isArray(show.themes)) {
          for (const theme of show.themes) {
            if (theme && theme.trim()) {
              const themeId = await getThemeId(theme.trim());
              if (themeId) {
                await pool.query(
                  'INSERT INTO tv_show_themes (tv_show_id, theme_id) VALUES ($1, $2) ON CONFLICT (tv_show_id, theme_id) DO NOTHING',
                  [show.id, themeId]
                );
              }
            }
          }
        }
        synced++;
      } catch (error) {
        console.error(`Error syncing themes for show ID ${show.id}:`, error);
        errors++;
      }
    }
    
    console.log(`Synced themes for ${synced} shows (${errors} errors)`);
  } catch (error) {
    console.error('Error syncing show-theme relationships:', error);
  }
}

/**
 * Main synchronization function
 */
async function syncThemes() {
  console.log('Starting theme synchronization...');
  
  try {
    // Get all themes from TV shows
    const allThemes = await getAllThemesFromShows();
    console.log(`Found ${allThemes.length} unique themes in TV shows`);
    
    // Add missing themes to themes table
    const addedThemes = await addMissingThemes(allThemes);
    console.log(`Added ${addedThemes.length} new themes to themes table`);
    
    // Sync relationships
    await syncShowThemeRelationships();
    
    console.log('Theme synchronization completed successfully!');
  } catch (error) {
    console.error('Error during theme synchronization:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
  syncThemes();
}

export { syncThemes };