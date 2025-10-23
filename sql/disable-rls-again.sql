-- Disable RLS again for testing
-- Run this if the RLS policies still don't work

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- This will allow registration to work immediately
-- You can work on RLS policies later when everything is stable
