import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/database';

// Get user's documents
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const fileType = searchParams.get('file_type');
    const search = searchParams.get('search');

    // Build query conditions
    const whereConditions = ['user_id = $1'];
    const params: string[] = [parseInt(session.user.id).toString()];
    let paramCount = 1;

    if (fileType) {
      paramCount++;
      whereConditions.push(`file_type = $${paramCount}`);
      params.push(fileType);
    }
    
    if (search) {
      paramCount++;
      whereConditions.push(`(title ILIKE $${paramCount} OR content ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM documents WHERE ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    // Get documents with pagination
    const documentsResult = await query(
      `SELECT * FROM documents WHERE ${whereClause} ORDER BY created_at DESC OFFSET $${paramCount + 1} LIMIT $${paramCount + 2}`,
      [...params, (page - 1) * limit, limit]
    );
    const documents = documentsResult.rows;

    return NextResponse.json({
      documents: documents || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete document
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Get document to verify ownership and get file path
    const documentResult = await query(
      'SELECT file_path FROM documents WHERE id = $1 AND user_id = $2',
      [parseInt(documentId), parseInt(session.user.id)]
    );
    const document = documentResult.rows[0];

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from database
    await query('DELETE FROM documents WHERE id = $1', [parseInt(documentId)]);

    // TODO: Delete file from storage if needed
    // For now, we'll just delete from database

    return NextResponse.json({ 
      message: 'Document deleted successfully' 
    });

  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
