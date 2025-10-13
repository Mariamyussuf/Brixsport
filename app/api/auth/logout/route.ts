import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    // Forward to backend API
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await backendResponse.json();
    
    if (!backendResponse.ok) {
      return NextResponse.json(
        { success: false, error: data.error || { message: 'Logout failed' } },
        { status: backendResponse.status }
      );
    }

    // Clear auth cookies
    const response = NextResponse.json({
      success: true,
      data
    }, { status: 200 });

    response.cookies.delete('auth-token');
    response.cookies.delete('refresh-token');

    return response;
  } catch (error) {
    console.error('Logout API error:', error);
    
    // Clear auth cookies on error
    const response = NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
    
    response.cookies.delete('auth-token');
    response.cookies.delete('refresh-token');
    
    return response;
  }
}