import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Simply clear the auth cookies - no backend call needed
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    }, { status: 200 });

    // Clear auth cookies
    response.cookies.delete('auth-token');
    
    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    
    // Clear auth cookies on error
    const response = NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
    
    response.cookies.delete('auth-token');
    
    return response;
  }
}
