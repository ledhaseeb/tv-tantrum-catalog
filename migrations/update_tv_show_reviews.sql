-- Add a user_id column to the tv_show_reviews table to properly link users and reviews
ALTER TABLE tv_show_reviews ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Update existing reviews to set user_id correctly based on username
UPDATE tv_show_reviews r
SET user_id = u.id
FROM users u
WHERE r.user_name = u.username;

-- Create an index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_tv_show_reviews_user_id ON tv_show_reviews(user_id);

-- Update trigger function to include user_id when inserting into user_tv_ratings
CREATE OR REPLACE FUNCTION sync_review_rating() RETURNS TRIGGER AS $$
BEGIN
  -- When a review is added, also add or update the user rating
  INSERT INTO user_tv_ratings (
    user_id, 
    tv_show_id, 
    rating, 
    rated_at
  ) 
  VALUES (
    NEW.user_id, -- Use user_id directly from the review
    NEW.tv_show_id,
    NEW.rating,
    NEW.created_at
  )
  ON CONFLICT (user_id, tv_show_id) 
  DO UPDATE SET 
    rating = NEW.rating,
    rated_at = NEW.created_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;