import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json();

    // Forward to backend API
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await backendResponse.json();
    
    if (!backendResponse.ok) {
      return NextResponse.json(
        { success: false, error: data.error || { message: 'Failed to reset password' } },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      data
    }, { status: 200 });
  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}