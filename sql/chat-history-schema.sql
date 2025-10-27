-- Chat History Schema for AI Knowledge App
-- This adds chat session and message tracking

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    documents_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Create trigger to update updated_at for chat_sessions
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create session title from first user message
CREATE OR REPLACE FUNCTION create_session_title()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update title if it's still the default and this is the first user message
    IF NEW.role = 'user' AND EXISTS (
        SELECT 1 FROM chat_sessions cs 
        WHERE cs.id = NEW.session_id 
        AND cs.title = 'New Chat'
        AND NOT EXISTS (
            SELECT 1 FROM chat_messages cm 
            WHERE cm.session_id = NEW.session_id 
            AND cm.role = 'user' 
            AND cm.id != NEW.id
        )
    ) THEN
        UPDATE chat_sessions 
        SET title = CASE 
            WHEN LENGTH(NEW.content) > 50 THEN LEFT(NEW.content, 47) || '...'
            ELSE NEW.content
        END
        WHERE id = NEW.session_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-generate session titles
CREATE TRIGGER auto_create_session_title 
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION create_session_title();
