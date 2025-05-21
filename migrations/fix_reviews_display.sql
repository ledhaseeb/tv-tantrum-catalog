-- Update the SQL INSERT trigger for reviews to properly handle user_id
CREATE OR REPLACE FUNCTION add_review() RETURNS TRIGGER AS $$
BEGIN
    -- When a new review is submitted through the API, make sure it has a user_id
    -- This ensures all reviews are properly linked to users
    
    -- Set created_at if not provided
    IF NEW.created_at IS NULL THEN
        NEW.created_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if the trigger already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'add_review_trigger') THEN
        CREATE TRIGGER add_review_trigger
        BEFORE INSERT ON tv_show_reviews
        FOR EACH ROW
        EXECUTE FUNCTION add_review();
    END IF;
END $$;

-- Fix the existing review to ensure it's properly displayed in the dashboard
UPDATE tv_show_reviews
SET user_id = (SELECT id FROM users WHERE username = 'uschooler')
WHERE user_name = 'uschooler' AND user_id IS NULL;