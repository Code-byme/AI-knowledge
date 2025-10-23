-- RLS policies that allow registration but protect user data
-- Run this when you want to enable RLS

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow service role to insert new users (for registration)
CREATE POLICY "Allow registration" ON users
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- Policy 2: Allow service role to read users (for login verification)
CREATE POLICY "Allow login verification" ON users
  FOR SELECT 
  TO service_role
  USING (true);

-- Policy 3: Users can only see their own data (for client-side operations)
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT 
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Policy 4: Users can update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);
