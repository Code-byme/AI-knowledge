import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/database';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large. Maximum 10MB allowed.' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'application/json',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'File type not supported. Allowed types: PDF, TXT, DOC, DOCX, MD, JSON, CSV' 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Extract text content for search
    let content = '';
    
    try {
      if (file.type === 'text/plain' || file.type === 'text/markdown' || file.type === 'text/csv') {
        content = buffer.toString('utf-8');
      } else if (file.type === 'application/json') {
        try {
          const jsonContent = JSON.parse(buffer.toString('utf-8'));
          content = JSON.stringify(jsonContent, null, 2);
        } catch (e) {
          content = buffer.toString('utf-8');
        }
      } else if (file.type === 'application/pdf') {
        // PDF files are stored but content extraction is disabled for now
        content = `[PDF Document: ${file.name}]\n\nPDF uploaded successfully and stored. Content extraction is currently disabled. For AI analysis, please convert to DOCX or TXT format.`;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Extract text from DOCX
        const result = await mammoth.extractRawText({ buffer });
        content = result.value;
      } else if (file.type === 'application/msword') {
        // For older .doc files, we'll store them but can't easily extract content
        content = '[DOC file - content extraction not supported for .doc files. Please convert to .docx for full functionality.]';
      }
    } catch (extractionError) {
      console.error('Content extraction error:', extractionError);
      content = `[Error extracting content from ${file.name}: ${extractionError instanceof Error ? extractionError.message : 'Unknown error'}]`;
    }

    // Save file info to database
    const result = await query(
      `INSERT INTO documents (user_id, title, content, file_path, file_type, file_size, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [
        parseInt(session.user.id),
        title || file.name,
        content,
        `/uploads/${fileName}`,
        file.type,
        file.size
      ]
    );

    const document = result.rows[0];

    return NextResponse.json({
      message: 'File uploaded successfully',
      document: {
        id: document.id,
        title: document.title,
        file_type: document.file_type,
        file_size: document.file_size,
        created_at: document.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
