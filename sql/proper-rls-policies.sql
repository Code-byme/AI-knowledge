-- Proper RLS policies that allow registration but protect user data
-- Run this when you're ready to re-enable RLS

-- First, enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Authenticated users can manage own data" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Policy 1: Service role can do everything (for registration, login, etc.)
CREATE POLICY "Service role full access" ON users
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Users can only see and update their own data
CREATE POLICY "Users can manage own profile" ON users
  FOR ALL 
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Policy 3: Allow public registration (if you want anyone to register)
-- This allows the service role to insert new users during registration
CREATE POLICY "Allow user registration" ON users
  FOR INSERT 
  TO service_role
  WITH CHECK (true);
