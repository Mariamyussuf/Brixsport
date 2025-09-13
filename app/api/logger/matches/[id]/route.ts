import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Forward the request to the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/matches/${id}`, {
      headers: {
        ...req.headers,
        'host': new URL(process.env.NEXT_PUBLIC_API_BASE_URL || '').host
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch match');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Match not found'
    }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await req.json();

    // Forward the request to the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/matches/${id}`, {
      method: 'PATCH',
      headers: {
        ...req.headers,
        'host': new URL(process.env.NEXT_PUBLIC_API_BASE_URL || '').host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update match');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update match'
    }, { status: 400 });
  }
}