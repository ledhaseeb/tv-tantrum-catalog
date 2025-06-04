/**
 * Migration Script for TV Tantrum Catalog Version
 * 
 * This script migrates existing data to the simplified catalog schema
 * while preserving all essential TV show data and filtering capabilities.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Create the simplified catalog tables
 */
async function createCatalogTables() {
  console.log('Creating catalog schema tables...');
  
  const client = await pool.connect();
  try {
    // Create catalog tables with same structure but simplified
    await client.query(`
      -- Sessions table for admin auth only
      CREATE TABLE IF NOT EXISTS catalog_sessions (
        sid TEXT PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      );
      
      -- Simplified users table (admin only)
      CREATE TABLE IF NOT EXISTS catalog_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        first_name TEXT,
        username TEXT,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- TV Shows table (preserving all data)
      CREATE TABLE IF NOT EXISTS catalog_tv_shows (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        age_range TEXT NOT NULL,
        episode_length INTEGER NOT NULL,
        creator TEXT,
        release_year INTEGER,
        end_year INTEGER,
        is_ongoing BOOLEAN DEFAULT true,
        seasons INTEGER,
        stimulation_score INTEGER NOT NULL,
        interactivity_level TEXT,
        dialogue_intensity TEXT,
        sound_effects_level TEXT,
        music_tempo TEXT,
        total_music_level TEXT,
        total_sound_effect_time_level TEXT,
        scene_frequency TEXT,
        creativity_rating INTEGER,
        available_on TEXT[],
        themes TEXT[],
        animation_style TEXT,
        image_url TEXT,
        is_featured BOOLEAN DEFAULT false,
        subscriber_count TEXT,
        video_count TEXT,
        channel_id TEXT,
        is_youtube_channel BOOLEAN DEFAULT false,
        published_at TEXT,
        has_omdb_data BOOLEAN DEFAULT false,
        has_youtube_data BOOLEAN DEFAULT false
      );
      
      -- Themes table
      CREATE TABLE IF NOT EXISTS catalog_themes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );
      
      -- Platforms table
      CREATE TABLE IF NOT EXISTS catalog_platforms (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        url TEXT,
        icon_url TEXT
      );
      
      -- Junction tables
      CREATE TABLE IF NOT EXISTS catalog_tv_show_themes (
        id SERIAL PRIMARY KEY,
        tv_show_id INTEGER NOT NULL REFERENCES catalog_tv_shows(id) ON DELETE CASCADE,
        theme_id INTEGER NOT NULL REFERENCES catalog_themes(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS catalog_tv_show_platforms (
        id SERIAL PRIMARY KEY,
        tv_show_id INTEGER NOT NULL REFERENCES catalog_tv_shows(id) ON DELETE CASCADE,
        platform_id INTEGER NOT NULL REFERENCES catalog_platforms(id) ON DELETE CASCADE
      );
      
      -- YouTube channels table
      CREATE TABLE IF NOT EXISTS catalog_youtube_channels (
        id SERIAL PRIMARY KEY,
        tv_show_id INTEGER NOT NULL REFERENCES catalog_tv_shows(id) ON DELETE CASCADE UNIQUE,
        channel_id TEXT,
        subscriber_count TEXT,
        video_count TEXT,
        published_at TEXT
      );
      
      -- Research summaries (read-only)
      CREATE TABLE IF NOT EXISTS catalog_research_summaries (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        summary TEXT,
        full_text TEXT,
        category TEXT NOT NULL,
        image_url TEXT,
        source TEXT,
        original_url TEXT,
        published_date TEXT,
        headline TEXT,
        sub_headline TEXT,
        key_findings TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_catalog_tv_shows_stimulation ON catalog_tv_shows(stimulation_score);
      CREATE INDEX IF NOT EXISTS idx_catalog_tv_shows_featured ON catalog_tv_shows(is_featured);
      CREATE INDEX IF NOT EXISTS idx_catalog_tv_shows_name ON catalog_tv_shows(name);
      CREATE INDEX IF NOT EXISTS idx_catalog_themes_name ON catalog_themes(name);
      CREATE INDEX IF NOT EXISTS idx_catalog_platforms_name ON catalog_platforms(name);
    `);
    
    console.log('✓ Catalog tables created successfully');
  } finally {
    client.release();
  }
}

/**
 * Migrate TV shows data
 */
async function migrateTvShows() {
  console.log('Migrating TV shows data...');
  
  const client = await pool.connect();
  try {
    // Get all TV shows from original table
    const result = await client.query(`
      SELECT * FROM tv_shows ORDER BY id
    `);
    
    console.log(`Found ${result.rows.length} TV shows to migrate`);
    
    for (const show of result.rows) {
      await client.query(`
        INSERT INTO catalog_tv_shows (
          id, name, description, age_range, episode_length, creator,
          release_year, end_year, is_ongoing, seasons, stimulation_score,
          interactivity_level, dialogue_intensity, sound_effects_level,
          music_tempo, total_music_level, total_sound_effect_time_level,
          scene_frequency, creativity_rating, available_on, themes,
          animation_style, image_url, is_featured, subscriber_count,
          video_count, channel_id, is_youtube_channel, published_at,
          has_omdb_data, has_youtube_data
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
          $27, $28, $29, $30, $31
        ) ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          age_range = EXCLUDED.age_range,
          episode_length = EXCLUDED.episode_length,
          creator = EXCLUDED.creator,
          release_year = EXCLUDED.release_year,
          end_year = EXCLUDED.end_year,
          is_ongoing = EXCLUDED.is_ongoing,
          seasons = EXCLUDED.seasons,
          stimulation_score = EXCLUDED.stimulation_score,
          interactivity_level = EXCLUDED.interactivity_level,
          dialogue_intensity = EXCLUDED.dialogue_intensity,
          sound_effects_level = EXCLUDED.sound_effects_level,
          music_tempo = EXCLUDED.music_tempo,
          total_music_level = EXCLUDED.total_music_level,
          total_sound_effect_time_level = EXCLUDED.total_sound_effect_time_level,
          scene_frequency = EXCLUDED.scene_frequency,
          creativity_rating = EXCLUDED.creativity_rating,
          available_on = EXCLUDED.available_on,
          themes = EXCLUDED.themes,
          animation_style = EXCLUDED.animation_style,
          image_url = EXCLUDED.image_url,
          is_featured = EXCLUDED.is_featured,
          subscriber_count = EXCLUDED.subscriber_count,
          video_count = EXCLUDED.video_count,
          channel_id = EXCLUDED.channel_id,
          is_youtube_channel = EXCLUDED.is_youtube_channel,
          published_at = EXCLUDED.published_at,
          has_omdb_data = EXCLUDED.has_omdb_data,
          has_youtube_data = EXCLUDED.has_youtube_data
      `, [
        show.id, show.name, show.description, show.age_range,
        show.episode_length, show.creator, show.release_year, show.end_year,
        show.is_ongoing, show.seasons, show.stimulation_score,
        show.interactivity_level, show.dialogue_intensity, show.sound_effects_level,
        show.music_tempo, show.total_music_level, show.total_sound_effect_time_level,
        show.scene_frequency, show.creativity_rating, show.available_on,
        show.themes, show.animation_style, show.image_url, show.is_featured,
        show.subscriber_count, show.video_count, show.channel_id,
        show.is_youtube_channel, show.published_at, show.has_omdb_data,
        show.has_youtube_data
      ]);
    }
    
    console.log('✓ TV shows migrated successfully');
  } finally {
    client.release();
  }
}

/**
 * Migrate themes data
 */
async function migrateThemes() {
  console.log('Migrating themes data...');
  
  const client = await pool.connect();
  try {
    // Check if themes table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'themes'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      const result = await client.query('SELECT * FROM themes ORDER BY id');
      
      for (const theme of result.rows) {
        await client.query(`
          INSERT INTO catalog_themes (id, name) 
          VALUES ($1, $2) 
          ON CONFLICT (name) DO NOTHING
        `, [theme.id, theme.name]);
      }
      
      console.log(`✓ ${result.rows.length} themes migrated successfully`);
    } else {
      console.log('! Original themes table not found, extracting from show data...');
      
      // Extract unique themes from TV shows
      const result = await client.query(`
        SELECT DISTINCT UNNEST(themes) as theme_name 
        FROM catalog_tv_shows 
        WHERE themes IS NOT NULL
      `);
      
      let themeId = 1;
      for (const row of result.rows) {
        if (row.theme_name && row.theme_name.trim()) {
          await client.query(`
            INSERT INTO catalog_themes (id, name) 
            VALUES ($1, $2) 
            ON CONFLICT (name) DO NOTHING
          `, [themeId++, row.theme_name.trim()]);
        }
      }
      
      console.log(`✓ ${result.rows.length} themes extracted and migrated`);
    }
  } finally {
    client.release();
  }
}

/**
 * Migrate platforms data
 */
async function migratePlatforms() {
  console.log('Migrating platforms data...');
  
  const client = await pool.connect();
  try {
    // Check if platforms table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'platforms'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      const result = await client.query('SELECT * FROM platforms ORDER BY id');
      
      for (const platform of result.rows) {
        await client.query(`
          INSERT INTO catalog_platforms (id, name, url, icon_url) 
          VALUES ($1, $2, $3, $4) 
          ON CONFLICT (name) DO NOTHING
        `, [platform.id, platform.name, platform.url, platform.icon_url]);
      }
      
      console.log(`✓ ${result.rows.length} platforms migrated successfully`);
    } else {
      console.log('! Original platforms table not found, extracting from show data...');
      
      // Extract unique platforms from TV shows
      const result = await client.query(`
        SELECT DISTINCT UNNEST(available_on) as platform_name 
        FROM catalog_tv_shows 
        WHERE available_on IS NOT NULL
      `);
      
      let platformId = 1;
      for (const row of result.rows) {
        if (row.platform_name && row.platform_name.trim()) {
          await client.query(`
            INSERT INTO catalog_platforms (id, name) 
            VALUES ($1, $2) 
            ON CONFLICT (name) DO NOTHING
          `, [platformId++, row.platform_name.trim()]);
        }
      }
      
      console.log(`✓ ${result.rows.length} platforms extracted and migrated`);
    }
  } finally {
    client.release();
  }
}

/**
 * Migrate research summaries
 */
async function migrateResearchSummaries() {
  console.log('Migrating research summaries...');
  
  const client = await pool.connect();
  try {
    // Check if research_summaries table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'research_summaries'
      );
    `);
    
    if (tableExists.rows[0].exists) {
      const result = await client.query('SELECT * FROM research_summaries ORDER BY id');
      
      for (const research of result.rows) {
        await client.query(`
          INSERT INTO catalog_research_summaries (
            id, title, summary, full_text, category, image_url, source,
            original_url, published_date, headline, sub_headline, key_findings,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          ) ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            summary = EXCLUDED.summary,
            full_text = EXCLUDED.full_text,
            category = EXCLUDED.category,
            image_url = EXCLUDED.image_url,
            source = EXCLUDED.source,
            original_url = EXCLUDED.original_url,
            published_date = EXCLUDED.published_date,
            headline = EXCLUDED.headline,
            sub_headline = EXCLUDED.sub_headline,
            key_findings = EXCLUDED.key_findings,
            updated_at = NOW()
        `, [
          research.id, research.title, research.summary, research.full_text,
          research.category, research.image_url, research.source, research.original_url,
          research.published_date, research.headline, research.sub_headline,
          research.key_findings, research.created_at, research.updated_at
        ]);
      }
      
      console.log(`✓ ${result.rows.length} research summaries migrated successfully`);
    } else {
      console.log('! No research summaries table found');
    }
  } finally {
    client.release();
  }
}

/**
 * Migrate admin users
 */
async function migrateAdminUsers() {
  console.log('Migrating admin users...');
  
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM users WHERE is_admin = true ORDER BY id
    `);
    
    for (const user of result.rows) {
      await client.query(`
        INSERT INTO catalog_users (
          id, email, password, first_name, username, is_admin, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email) DO UPDATE SET
          password = EXCLUDED.password,
          first_name = EXCLUDED.first_name,
          username = EXCLUDED.username,
          is_admin = EXCLUDED.is_admin
      `, [
        user.id, user.email, user.password, user.first_name,
        user.username, user.is_admin, user.created_at
      ]);
    }
    
    console.log(`✓ ${result.rows.length} admin users migrated successfully`);
  } finally {
    client.release();
  }
}

/**
 * Generate migration report
 */
async function generateReport() {
  console.log('\n=== MIGRATION REPORT ===');
  
  const client = await pool.connect();
  try {
    const shows = await client.query('SELECT COUNT(*) FROM catalog_tv_shows');
    const themes = await client.query('SELECT COUNT(*) FROM catalog_themes');
    const platforms = await client.query('SELECT COUNT(*) FROM catalog_platforms');
    const research = await client.query('SELECT COUNT(*) FROM catalog_research_summaries');
    const admins = await client.query('SELECT COUNT(*) FROM catalog_users WHERE is_admin = true');
    
    console.log(`TV Shows: ${shows.rows[0].count}`);
    console.log(`Themes: ${themes.rows[0].count}`);
    console.log(`Platforms: ${platforms.rows[0].count}`);
    console.log(`Research Summaries: ${research.rows[0].count}`);
    console.log(`Admin Users: ${admins.rows[0].count}`);
    
    // Check data integrity
    const featuredShows = await client.query('SELECT COUNT(*) FROM catalog_tv_shows WHERE is_featured = true');
    const youtubeShows = await client.query('SELECT COUNT(*) FROM catalog_tv_shows WHERE is_youtube_channel = true');
    
    console.log(`\nData Integrity Checks:`);
    console.log(`Featured Shows: ${featuredShows.rows[0].count}`);
    console.log(`YouTube Shows: ${youtubeShows.rows[0].count}`);
    
    console.log('\n✓ Migration completed successfully!');
  } finally {
    client.release();
  }
}

/**
 * Main migration function
 */
async function main() {
  try {
    console.log('Starting TV Tantrum Catalog Migration...\n');
    
    await createCatalogTables();
    await migrateTvShows();
    await migrateThemes();
    await migratePlatforms();
    await migrateResearchSummaries();
    await migrateAdminUsers();
    await generateReport();
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);