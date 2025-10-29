import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/database';

// GET user profile
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(
      'SELECT id, name, email, created_at, last_login FROM users WHERE id = $1',
      [parseInt(session.user.id)]
    );
    const user = result.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        last_login_at: user.last_login
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// UPDATE user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email } = await request.json();

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const existingUserResult = await query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, parseInt(session.user.id)]
    );
    const existingUser = existingUserResult.rows[0];

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already taken by another user' },
        { status: 400 }
      );
    }

    // Update user profile
    const updateResult = await query(
      'UPDATE users SET name = $1, email = $2, updated_at = $3 WHERE id = $4 RETURNING id, name, email, created_at',
      [name, email, new Date(), parseInt(session.user.id)]
    );
    const user = updateResult.rows[0];

    if (!user) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
