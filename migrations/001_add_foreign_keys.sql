-- Migration: Add Foreign Key Constraints
-- This migration adds foreign key constraints to ensure referential integrity

-- Add foreign keys to favorites table
ALTER TABLE favorites 
  ADD CONSTRAINT fk_favorites_user 
  FOREIGN KEY (user_id) REFERENCES users(id) 
  ON DELETE CASCADE;

ALTER TABLE favorites 
  ADD CONSTRAINT fk_favorites_tv_show 
  FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) 
  ON DELETE CASCADE;

-- Add foreign keys to tv_show_reviews table  
ALTER TABLE tv_show_reviews 
  ADD CONSTRAINT fk_reviews_tv_show 
  FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) 
  ON DELETE CASCADE;

-- Add foreign keys to tv_show_searches table
ALTER TABLE tv_show_searches 
  ADD CONSTRAINT fk_searches_tv_show 
  FOREIGN KEY (tv_show_id) REFERENCES tv_shows(id) 
  ON DELETE CASCADE;

-- Output message when migration is complete
DO $$
BEGIN
  RAISE NOTICE 'Foreign key constraints added successfully';
END $$;