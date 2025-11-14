import { NextRequest, NextResponse } from 'next/server';

/**
 * Forgot Password API Route
 * Handles password reset requests
 */
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    // Get IP address and user agent for security logging
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Call backend API to initiate password reset
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ipAddress,
        'User-Agent': userAgent,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    // Always return success for security (prevent email enumeration)
    // Even if the backend returns an error, we return success to the client
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions shortly.'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Forgot password API error:', error);
    // Still return success to prevent information leakage
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, you will receive password reset instructions shortly.'
    }, { status: 200 });
  }
}
