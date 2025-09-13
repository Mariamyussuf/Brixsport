import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // This will be replaced with actual backend integration
    const { name, email, password } = await req.json();

    // Return mock success response for now
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: 'mock-user-id',
          email,
          name,
          role: 'user'
        }
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Registration failed'
    }, { status: 400 });
  }
}