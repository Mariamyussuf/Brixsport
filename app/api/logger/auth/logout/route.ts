import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    
    // Validate refresh token
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    // Find logger with matching refresh token and clear it
    const { data: loggers, error: findError } = await supabase
      .from('Logger')
      .select('id')
      .eq('refreshToken', refreshToken);
    
    if (findError || !loggers || loggers.length === 0) {
      // If we can't find the refresh token, we still return success to the client
      // as the token might have already been invalidated
      return NextResponse.json({
        success: true,
        message: 'Logged out successfully'
      });
    }
    
    const loggerId = loggers[0].id;
    
    // Clear refresh token in database
    const { error: updateError } = await supabase
      .from('Logger')
      .update({ refreshToken: null })
      .eq('id', loggerId);
    
    if (updateError) {
      console.error('Error clearing refresh token:', updateError);
      // We still return success to the client as the token is no longer usable
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logger logout error:', error);
    // Still return success to client to ensure logout on client side
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}