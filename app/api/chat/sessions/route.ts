import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/database';

// GET /api/chat/sessions - Get all chat sessions for the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    
    // Get all chat sessions for the user, ordered by most recent
    const sessions = await query(`
      SELECT 
        cs.id,
        cs.title,
        cs.created_at,
        cs.updated_at,
        cs.is_active,
        COUNT(cm.id) as message_count,
        MAX(cm.created_at) as last_message_at
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      WHERE cs.user_id = $1
      GROUP BY cs.id, cs.title, cs.created_at, cs.updated_at, cs.is_active
      ORDER BY cs.updated_at DESC
    `, [userId]);

    return NextResponse.json({ sessions: sessions.rows });
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}

// POST /api/chat/sessions - Create a new chat session
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { title } = await request.json();
    
    // Create new chat session
    const newSession = await query(`
      INSERT INTO chat_sessions (user_id, title)
      VALUES ($1, $2)
      RETURNING id, title, created_at, updated_at, is_active
    `, [userId, title || 'New Chat']);

    return NextResponse.json({ session: newSession.rows[0] });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to create chat session' },
      { status: 500 }
    );
  }
}

