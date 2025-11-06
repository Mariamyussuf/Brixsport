import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Name, email, and password are required' } },
        { status: 400 }
      );
    }

    // Forward to backend API
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await backendResponse.json();
    
    if (!backendResponse.ok) {
      // Log the error for debugging
      console.error('Backend registration error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        data
      });
      
      // Return a more informative error response
      const errorResponse = {
        success: false,
        error: data.error || { message: data.message || 'Registration failed' },
        code: data.code || 'REGISTRATION_ERROR'
      };
      
      return NextResponse.json(errorResponse, { status: backendResponse.status });
    }

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data
    }, { status: 201 });
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