#!/bin/bash

# Database Migration Script for Chat History
# This script applies the chat history schema to your PostgreSQL database

echo "🚀 Starting chat history database migration..."

# Check if database connection is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Database connection parameters
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB:-ai_knowledge_db}
DB_USER=${POSTGRES_USER:-postgres}

echo "📊 Connecting to database: $DB_NAME@$DB_HOST:$DB_PORT as $DB_USER"

# Run the migration
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f sql/chat-history-schema.sql; then
    echo "✅ Chat history migration completed successfully!"
    echo ""
    echo "📋 New tables created:"
    echo "   - chat_sessions: Stores chat conversation sessions"
    echo "   - chat_messages: Stores individual messages within sessions"
    echo ""
    echo "🔧 Features added:"
    echo "   - Automatic session title generation"
    echo "   - Message history tracking"
    echo "   - Session management"
    echo ""
    echo "🎉 Your AI Knowledge Hub now supports chat history!"
else
    echo "❌ Migration failed. Please check your database connection and try again."
    exit 1
fi
