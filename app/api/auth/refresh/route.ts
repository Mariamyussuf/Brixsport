import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    // Forward to backend API
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await backendResponse.json();
    
    if (!backendResponse.ok) {
      // Clear auth cookies on refresh failure
      const response = NextResponse.json(
        { success: false, error: data.error || { message: 'Token refresh failed' } },
        { status: backendResponse.status }
      );
      
      response.cookies.delete('auth-token');
      response.cookies.delete('refresh-token');
      
      return response;
    }

    // Set new cookies for authentication
    const response = NextResponse.json({
      success: true,
      data
    }, { status: 200 });

    // Set new auth cookies
    response.cookies.set('auth-token', data.data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    response.cookies.set('refresh-token', data.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh API error:', error);
    
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