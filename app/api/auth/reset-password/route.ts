import { NextRequest, NextResponse } from 'next/server';

/**
 * Password Reset API Route
 * Handles password reset with secure token validation
 */
export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    // Validate inputs
    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, error: { message: 'Token and new password are required' } },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character' 
          } 
        },
        { status: 400 }
      );
    }

    // Get IP address and user agent for security logging
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Call backend API to reset password
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:4000';
    const response = await fetch(`${backendUrl}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ipAddress,
        'User-Agent': userAgent,
      },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend password reset error:', data);
      return NextResponse.json(
        { 
          success: false, 
          error: { message: data.error?.message || data.message || 'Failed to reset password' } 
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    }, { status: 200 });
  } catch (error: any) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Internal server error' } },
      { status: 500 }
    );
  }
}