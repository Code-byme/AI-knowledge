import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/database';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

    const documentId = id;
    const userId = parseInt(session.user.id);

    // Get document info and verify ownership
    const result = await query(
      `SELECT id, title, file_path, file_type, file_size FROM documents 
       WHERE id = $1 AND user_id = $2`,
      [documentId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = result.rows[0];
    const fileName = document.file_path;
    const filePath = join(process.cwd(), 'secure-uploads', fileName);

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', document.file_type);
    headers.set('Content-Disposition', `attachment; filename="${document.title}"`);
    headers.set('Content-Length', document.file_size.toString());

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const documentId = id;
    const userId = parseInt(session.user.id);

    // Get document info and verify ownership
    const result = await query(
      `SELECT file_path FROM documents WHERE id = $1 AND user_id = $2`,
      [documentId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const fileName = result.rows[0].file_path;
    const filePath = join(process.cwd(), 'secure-uploads', fileName);

    // Delete from database first
    await query(`DELETE FROM documents WHERE id = $1 AND user_id = $2`, [documentId, userId]);

    // Delete file from disk
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
