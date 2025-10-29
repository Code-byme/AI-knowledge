import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/database';

// PUT /api/chat/sessions/[id] - Update a chat session
export async function PUT(
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
    const { title, is_active } = await request.json();
    const sessionId = id;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Update chat session
    const updatedSession = await query(`
      UPDATE chat_sessions 
      SET title = $1, is_active = $2, updated_at = NOW()
      WHERE id = $3 AND user_id = $4
      RETURNING id, title, created_at, updated_at, is_active
    `, [title, is_active, sessionId, userId]);

    if (updatedSession.rows.length === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session: updatedSession.rows[0] });
  } catch (error) {
    console.error('Error updating chat session:', error);
    return NextResponse.json(
      { error: 'Failed to update chat session' },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/sessions/[id] - Delete a chat session
export async function DELETE(
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
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Delete chat session (cascade will delete messages)
    const result = await query(`
      DELETE FROM chat_sessions 
      WHERE id = $1 AND user_id = $2
    `, [sessionId, userId]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat session' },
      { status: 500 }
    );
  }
}
