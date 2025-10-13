import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Extract token from cookies
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Validate token with backend API
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!backendResponse.ok) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userData = await backendResponse.json();
    
    // Return the authenticated user data
    return NextResponse.json(userData.data);
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}