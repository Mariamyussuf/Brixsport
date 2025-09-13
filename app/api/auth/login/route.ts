import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // This will be replaced with actual backend integration
    const { email, password } = await req.json();

    // Return mock success response for now
    return NextResponse.json({
      success: true,
      data: {
        token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email,
          name: 'Mock User',
          role: 'user'
        }
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid credentials'
    }, { status: 401 });
  }
}