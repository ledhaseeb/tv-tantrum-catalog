-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_sync_review_rating ON tv_show_reviews;
DROP FUNCTION IF EXISTS sync_review_rating();

-- Create an improved function that uses direct user_id when available
CREATE OR REPLACE FUNCTION sync_review_rating() RETURNS TRIGGER AS $$
BEGIN
  -- When a review is added, also add or update the user rating
  -- Use direct user_id when available, otherwise look up by username
  INSERT INTO user_tv_ratings (
    user_id, 
    tv_show_id, 
    rating, 
    rated_at
  ) 
  VALUES (
    COALESCE(NEW.user_id, (SELECT id FROM users WHERE username = NEW.user_name)),
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

-- Recreate the trigger
CREATE TRIGGER trigger_sync_review_rating
AFTER INSERT OR UPDATE ON tv_show_reviews
FOR EACH ROW
EXECUTE FUNCTION sync_review_rating();

-- Update any existing reviews that don't have user_id
UPDATE tv_show_reviews 
SET user_id = (SELECT id FROM users WHERE username = user_name)
WHERE user_id IS NULL;