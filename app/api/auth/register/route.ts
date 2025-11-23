import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the backend API URL from environment variables
    const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    // Forward the request to the backend API
    const backendResponse = await fetch(`${backendApiUrl}/api/v1/auth/signup`, {
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
  } catch (error: any) {
    console.error('Registration API error:', {
      message: error.message,
      stack: error.stack
    });
    
    // Return a user-friendly error message
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Service temporarily unavailable. Please try again later.',
          code: 'SERVER_ERROR'
        }
      },
      { status: 503 }
    );
  }
}