-- Helper functions for users table
-- Run this AFTER the users table is created successfully

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

-- Function to handle login attempts
CREATE OR REPLACE FUNCTION handle_login_attempt(
  user_email TEXT,
  is_successful BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
BEGIN
  SELECT * INTO user_record FROM users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF is_successful THEN
    UPDATE users SET 
      login_attempts = 0,
      last_login_at = NOW(),
      locked_until = NULL
    WHERE id = user_record.id;
  ELSE
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

-- Function to generate email verification token
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

-- Function to generate password reset token
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
