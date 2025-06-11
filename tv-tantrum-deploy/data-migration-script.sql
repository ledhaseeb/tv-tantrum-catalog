-- TV Tantrum Database Migration Script for Railway
-- Complete schema and data export for production deployment

-- Create sessions table for authentication (required for Railway)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire);

-- Create catalog_tv_shows table with all 302 shows
CREATE TABLE IF NOT EXISTS catalog_tv_shows (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  age_range TEXT,
  episode_length INTEGER,
  creator TEXT,
  release_year INTEGER,
  end_year INTEGER,
  is_ongoing BOOLEAN DEFAULT false,
  seasons INTEGER,
  stimulation_score INTEGER,
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

-- Create homepage_categories table for admin-controlled sections
CREATE TABLE IF NOT EXISTS homepage_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filter_config JSONB,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create research_summaries table for content insights
CREATE TABLE IF NOT EXISTS research_summaries (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  full_text TEXT,
  category TEXT,
  image_url TEXT,
  source TEXT,
  original_url TEXT,
  published_date DATE,
  headline TEXT,
  sub_headline TEXT,
  key_findings TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance optimization (critical for viral traffic)
CREATE INDEX IF NOT EXISTS idx_tv_shows_stimulation_score ON catalog_tv_shows (stimulation_score);
CREATE INDEX IF NOT EXISTS idx_tv_shows_age_range ON catalog_tv_shows (age_range);
CREATE INDEX IF NOT EXISTS idx_tv_shows_themes ON catalog_tv_shows USING GIN (themes);
CREATE INDEX IF NOT EXISTS idx_tv_shows_featured ON catalog_tv_shows (is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_homepage_categories_active ON homepage_categories (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_homepage_categories_order ON homepage_categories (display_order);

-- Note: TV shows data (302 shows) and homepage categories will be imported separately
-- Use the Replit database export commands to generate CSV files for import

COMMENT ON TABLE catalog_tv_shows IS 'Contains 302 authentic TV shows with stimulation ratings';
COMMENT ON TABLE homepage_categories IS 'Admin-controlled homepage sections with custom filtering';
COMMENT ON TABLE research_summaries IS 'Research insights for content discovery optimization';