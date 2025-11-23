import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the backend API URL from environment variables
    const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Forward the request to the backend API
    const backendResponse = await fetch(`${backendApiUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: await req.text(),
    });

    // Get the response data
    const data = await backendResponse.json();

    // Return the backend response
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}