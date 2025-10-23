-- Simple users table with minimal fields
-- Run this in your Supabase SQL Editor

-- Drop existing table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create simple users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for email (for faster lookups)
CREATE INDEX idx_users_email ON users(email);

-- Keep RLS disabled for now (simple setup)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
