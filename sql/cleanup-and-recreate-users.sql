-- Cleanup and recreate users table properly
-- Run this in your Supabase SQL Editor

-- Drop everything related to users table with CASCADE
DROP TABLE IF EXISTS users CASCADE;

-- Drop any existing functions that might conflict
DROP FUNCTION IF EXISTS handle_login_attempt(TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS generate_email_verification_token(UUID);
DROP FUNCTION IF EXISTS generate_password_reset_token(TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop any existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Now create the users table fresh
CREATE TABLE users (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic user information
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  image TEXT,
  
  -- Email verification
  email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  email_verification_expires TIMESTAMP WITH TIME ZONE,
  
  -- Password reset
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  
  -- Account status and security
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'banned')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  
  -- Login tracking
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  
  -- User preferences
  preferences JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Service role first, then user policies)
CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Helper functions for user management
CREATE OR REPLACE FUNCTION handle_login_attempt(
  user_email TEXT,
  is_successful BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user record
  SELECT * INTO user_record FROM users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF is_successful THEN
    -- Reset login attempts and update last login
    UPDATE users SET 
      login_attempts = 0,
      last_login_at = NOW(),
      locked_until = NULL
    WHERE id = user_record.id;
  ELSE
    -- Increment login attempts
    UPDATE users SET 
      login_attempts = login_attempts + 1,
      locked_until = CASE 
        WHEN login_attempts + 1 >= 5 THEN NOW() + INTERVAL '30 minutes'
        ELSE locked_until
      END
    WHERE id = user_record.id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_email_verification_token(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  token := encode(gen_random_bytes(32), 'hex');
  
  UPDATE users SET 
    email_verification_token = token,
    email_verification_expires = NOW() + INTERVAL '24 hours'
  WHERE id = user_id;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION generate_password_reset_token(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  token := encode(gen_random_bytes(32), 'hex');
  
  UPDATE users SET 
    password_reset_token = token,
    password_reset_expires = NOW() + INTERVAL '1 hour'
  WHERE id = user_id;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
