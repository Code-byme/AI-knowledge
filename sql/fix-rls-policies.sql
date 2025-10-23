-- Fix RLS policies for users table
-- Run this in your Supabase SQL Editor

-- First, let's see what policies exist
-- Drop all existing policies
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create a simple service role policy that allows everything
CREATE POLICY "Service role full access" ON users
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also create a policy for authenticated users
CREATE POLICY "Authenticated users can manage own data" ON users
  FOR ALL 
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);
