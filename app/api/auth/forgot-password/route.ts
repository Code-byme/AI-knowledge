import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const userResult = await query('SELECT id, email, name FROM users WHERE email = $1', [email]);
    
    // Always return success to prevent email enumeration
    // Don't reveal whether the email exists or not
    if (userResult.rows.length === 0) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json({
        message: 'If an account exists with that email, a password reset link has been sent.',
      });
    }

    const user = userResult.rows[0];

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Store the reset token in the database
    // Note: The column names might be password_reset_token and password_reset_expires
    // Based on the user's description
    try {
      await query(
        `UPDATE users 
         SET password_reset_token = $1, 
             password_reset_expires = $2 
         WHERE id = $3`,
        [resetToken, resetTokenExpires, user.id]
      );
    } catch (dbError: any) {
      // If columns don't exist, try alternative column names
      console.error('Database error:', dbError);
      
      // Try with different column name variations
      try {
        await query(
          `UPDATE users 
           SET password_reset_token = $1, 
               password_reset_expire = $2 
           WHERE id = $3`,
          [resetToken, resetTokenExpires, user.id]
        );
      } catch (error2) {
        console.error('Failed to update password reset token:', error2);
        return NextResponse.json(
          { error: 'Failed to process password reset request' },
          { status: 500 }
        );
      }
    }

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Still return success to prevent revealing email issues
      // In production, you might want to log this for monitoring
    }

    return NextResponse.json({
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

