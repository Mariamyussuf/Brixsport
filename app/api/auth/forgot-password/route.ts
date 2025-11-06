import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { success: false, error: { message: 'Email is required' } },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (error || !user) {
      // For security reasons, we don't reveal if the email exists
      // We still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.'
      }, { status: 200 });
    }

    // In a real implementation, you would send an email with a reset token
    // For now, we'll just return a success response
    // You would typically generate a reset token and send it via email
    
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.'
    }, { status: 200 });
  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}