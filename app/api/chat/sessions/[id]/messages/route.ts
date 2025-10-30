import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/database';

// GET /api/chat/sessions/[id]/messages - Get messages for a specific session
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const sessionId = id;
    
    // Verify session belongs to user
    const sessionCheck = await query(`
      SELECT id FROM chat_sessions 
      WHERE id = $1 AND user_id = $2
    `, [sessionId, userId]);

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Get messages for the session
    const messages = await query(`
      SELECT 
        id,
        role,
        content,
        documents_used,
        created_at,
        metadata
      FROM chat_messages 
      WHERE session_id = $1 
      ORDER BY created_at ASC
    `, [sessionId]);

    return NextResponse.json({ messages: messages.rows });
  } catch (error) {
    console.error('Error fetching session messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session messages' },
      { status: 500 }
    );
  }
}

// POST /api/chat/sessions/[id]/messages - Add a message to a session
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const sessionId = id;
    const { role, content, documents_used = 0, metadata = {} } = await request.json();
    
    // Verify session belongs to user
    const sessionCheck = await query(`
      SELECT id FROM chat_sessions 
      WHERE id = $1 AND user_id = $2
    `, [sessionId, userId]);

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Add message to session
    const newMessage = await query(`
      INSERT INTO chat_messages (session_id, role, content, documents_used, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, role, content, documents_used, created_at, metadata
    `, [sessionId, role, content, documents_used, JSON.stringify(metadata)]);

    // Update session's updated_at timestamp
    await query(`
      UPDATE chat_sessions 
      SET updated_at = NOW() 
      WHERE id = $1
    `, [sessionId]);

    return NextResponse.json({ message: newMessage.rows[0] });
  } catch (error) {
    console.error('Error adding message to session:', error);
    return NextResponse.json(
      { error: 'Failed to add message to session' },
      { status: 500 }
    );
  }
}
