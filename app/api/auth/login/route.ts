import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Forward to backend API
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendResponse.json();
    
    if (!backendResponse.ok) {
      return NextResponse.json(
        { success: false, error: data.error || { message: 'Authentication failed' } },
        { status: backendResponse.status }
      );
    }

    // Set cookies for authentication
    const response = NextResponse.json({
      success: true,
      data
    }, { status: 200 });

    // Set auth cookies
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
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}