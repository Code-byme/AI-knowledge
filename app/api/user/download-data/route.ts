import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all user data
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [parseInt(session.user.id)]
    );
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Create user data export
    const userData = {
      export_date: new Date().toISOString(),
      user_data: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      export_info: {
        reason: 'User requested data download',
        format: 'JSON',
        version: '1.0'
      }
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(userData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-${user.id}.json"`
      }
    });

  } catch (error) {
    console.error('Download data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
