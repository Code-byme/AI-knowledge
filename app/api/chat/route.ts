import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/database';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, sessionId } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const userId = parseInt(session.user.id);
    let currentSessionId = sessionId;

    // Create new session if none provided
    if (!currentSessionId) {
      const newSession = await query(`
        INSERT INTO chat_sessions (user_id, title)
        VALUES ($1, 'New Chat')
        RETURNING id
      `, [userId]);
      currentSessionId = newSession.rows[0].id;
    } else {
      // Verify session belongs to user
      const sessionCheck = await query(`
        SELECT id FROM chat_sessions 
        WHERE id = $1 AND user_id = $2
      `, [currentSessionId, userId]);

      if (sessionCheck.rows.length === 0) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    }

    // Save user message to database
    await query(`
      INSERT INTO chat_messages (session_id, role, content, documents_used)
      VALUES ($1, 'user', $2, 0)
    `, [currentSessionId, message]);

    // Get user's documents for context
    const documentsResult = await query(
      `SELECT id, title, content, file_type, file_path 
       FROM documents 
       WHERE user_id = $1 AND content IS NOT NULL AND content != ''
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );

    const documents = documentsResult.rows;
    
    // Build context from documents
    let documentContext = '';
    if (documents.length > 0) {
      documentContext = '\n\nRelevant documents from your knowledge base:\n';
      documents.forEach((doc, index) => {
        documentContext += `\n--- Document ${index + 1}: ${doc.title} ---\n`;
        // Truncate content to avoid token limits
        const truncatedContent = doc.content.length > 2000 
          ? doc.content.substring(0, 2000) + '...' 
          : doc.content;
        documentContext += truncatedContent + '\n';
      });
    }

    // Create the prompt with document context
    const systemPrompt = `You are an AI assistant helping users with their uploaded documents. 
    You have access to their knowledge base and should provide helpful, accurate responses based on the document content.
    If the user's question relates to the uploaded documents, use that information to provide a comprehensive answer.
    If the question is not related to the documents, provide a helpful general response.
    Always be helpful, accurate, and cite specific information from the documents when relevant.`;

    const userPrompt = `${message}${documentContext}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'AI Knowledge Hub',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const assistantResponse = data.choices[0]?.message?.content || 'No response received';
    
    // Save assistant message to database
    await query(`
      INSERT INTO chat_messages (session_id, role, content, documents_used)
      VALUES ($1, 'assistant', $2, $3)
    `, [currentSessionId, assistantResponse, documents.length]);

    // Update session's updated_at timestamp
    await query(`
      UPDATE chat_sessions 
      SET updated_at = NOW() 
      WHERE id = $1
    `, [currentSessionId]);
    
    return NextResponse.json({
      success: true,
      response: assistantResponse,
      usage: data.usage,
      documentsUsed: documents.length,
      sessionId: currentSessionId,
    });

  } catch (error) {
    console.error('Error calling OpenRouter API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
