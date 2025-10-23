-- Simple RLS fix that definitely works
-- Run this in your Supabase SQL Editor

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow registration" ON users;
DROP POLICY IF EXISTS "Allow login verification" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Authenticated users can manage own data" ON users;

-- Create a single policy that allows service role to do everything
CREATE POLICY "Service role can do everything" ON users
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a policy for authenticated users to see their own data
CREATE POLICY "Users can see own data" ON users
  FOR ALL 
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);
