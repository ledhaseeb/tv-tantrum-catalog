-- Add new columns to users table to track total ratings
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_date TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Create a new table to track user's read research
CREATE TABLE IF NOT EXISTS user_read_research (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  research_id INTEGER NOT NULL,
  read_at TEXT NOT NULL,
  UNIQUE(user_id, research_id)
);

-- Create a table for user points history
CREATE TABLE IF NOT EXISTS user_points_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  points INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL
);

-- Create a table for research summaries
CREATE TABLE IF NOT EXISTS research_summaries (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  points_value INTEGER DEFAULT 5,
  created_at TEXT NOT NULL
);

-- Create a table for show submissions from users
CREATE TABLE IF NOT EXISTS show_submissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  show_name TEXT NOT NULL,
  description TEXT NOT NULL,
  age_range TEXT NOT NULL,
  platform TEXT NOT NULL,
  release_year INTEGER NOT NULL,
  creator TEXT,
  additional_info TEXT,
  status TEXT DEFAULT 'pending',
  admin_feedback TEXT,
  created_at TEXT NOT NULL
);

-- Create a table for review upvotes
CREATE TABLE IF NOT EXISTS review_upvotes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  review_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, review_id)
);

-- Create a table for user referrals
CREATE TABLE IF NOT EXISTS user_referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL,
  referred_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(referred_id)
);

-- Create a table to track all user TV show ratings (separate from the reviews)
CREATE TABLE IF NOT EXISTS user_tv_ratings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  tv_show_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  rated_at TEXT NOT NULL,
  UNIQUE(user_id, tv_show_id)
);

-- Join reviews table and user ratings table when a review is created
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
    (SELECT id FROM users WHERE username = NEW.user_name),
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

-- Create a trigger to sync the reviews and ratings tables
CREATE TRIGGER trigger_sync_review_rating
AFTER INSERT OR UPDATE ON tv_show_reviews
FOR EACH ROW
EXECUTE FUNCTION sync_review_rating();

-- Sample research summaries data
INSERT INTO research_summaries (
  title, 
  content, 
  category, 
  points_value, 
  created_at
)
VALUES 
(
  'The Impact of Screen Time on Developing Brains',
  'Recent research suggests that limited, high-quality screen time can be beneficial for children when supervised. However, excessive screen time has been linked to attention problems, reduced quality sleep, and delayed language development. The American Academy of Pediatrics recommends no screen time for children under 18 months (except video chatting), limited screen time for children 18-24 months with adult supervision, and no more than 1 hour per day for children 2-5 years.',
  'Child Development',
  5,
  CURRENT_TIMESTAMP
),
(
  'Benefits of Educational Programming',
  'Studies show that high-quality educational programming can have positive effects on children's cognitive development. Shows with clear learning objectives, active viewer participation, and relatable characters tend to be most effective. Educational shows that incorporate storytelling can help improve narrative skills and vocabulary acquisition in young viewers.',
  'Education',
  5,
  CURRENT_TIMESTAMP
),
(
  'Sensory Processing and Children's Media',
  'Children with sensory processing sensitivities may be overwhelmed by certain types of media content. Factors such as bright flashing lights, sudden loud sounds, and rapid scene transitions can trigger sensory overload. Media that features slower pacing, predictable transitions, and moderate sound levels is often better tolerated by children with sensory processing challenges.',
  'Sensory Issues',
  10,
  CURRENT_TIMESTAMP
);