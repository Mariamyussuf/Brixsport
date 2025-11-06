import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    // Validate inputs
    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: { message: 'Token and new password are required' } },
        { status: 400 }
      );
    }

    // In a real implementation, you would verify the token here
    // For now, we'll simulate the reset by finding a user and updating their password
    // This is a simplified version - in production you would have a proper reset token system
    
    // For demonstration, let's assume the token contains the user email (in a real app, this would be a secure token)
    // This is just for demonstration purposes
    const email = token; // In reality, you'd decode a proper reset token
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password in Supabase
    const { data, error } = await supabase
      .from('User')
      .update({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .eq('email', email)
      .select('id, name, email')
      .single();

    if (error) {
      console.error('Error updating password:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to reset password' } },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: { message: 'User not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}