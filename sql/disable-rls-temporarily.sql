-- Temporarily disable RLS for testing
-- Run this in your Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- This will allow the service role to insert users without RLS restrictions
-- You can re-enable RLS later once everything is working
