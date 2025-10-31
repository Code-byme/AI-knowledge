import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find user by reset token and check if token is still valid
    let userResult;
    try {
      userResult = await query(
        `SELECT id, email, password_reset_token, password_reset_expires 
         FROM users 
         WHERE password_reset_token = $1 
         AND password_reset_expires > NOW()`,
        [token]
      );
    } catch (dbError: unknown) {
      // Try with alternative column name
      console.error('Database error (trying alternative column names):', dbError);
      try {
        userResult = await query(
          `SELECT id, email, password_reset_token, password_reset_expire 
           FROM users 
           WHERE password_reset_token = $1 
           AND password_reset_expire > NOW()`,
          [token]
        );
      } catch (error2) {
        console.error('Database error:', error2);
        return NextResponse.json(
          { error: 'Invalid or expired reset token' },
          { status: 400 }
        );
      }
    }

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    try {
      await query(
        `UPDATE users 
         SET password_hash = $1, 
             password_reset_token = NULL, 
             password_reset_expires = NULL 
         WHERE id = $2`,
        [hashedPassword, user.id]
      );
    } catch (dbError: unknown) {
      // Try with alternative column name
      console.error('Database error (trying alternative column names):', dbError);
      try {
        await query(
          `UPDATE users 
           SET password_hash = $1, 
               password_reset_token = NULL, 
               password_reset_expire = NULL 
           WHERE id = $2`,
          [hashedPassword, user.id]
        );
      } catch (error2) {
        console.error('Failed to update password:', error2);
        return NextResponse.json(
          { error: 'Failed to reset password' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

