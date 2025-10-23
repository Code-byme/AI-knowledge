-- Add last_login column to users table
-- Run this in your Supabase SQL Editor

-- Add last_login column
ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Update existing users to have null last_login (they haven't logged in yet)
-- This is already the default behavior for new columns

-- Optional: You can also add a trigger to automatically update last_login on successful login
-- But for now, we'll handle this in the application code
