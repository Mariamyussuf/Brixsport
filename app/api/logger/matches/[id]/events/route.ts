import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = await req.json();

    // Forward the request to the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/live/events`, {
      method: 'POST',
      headers: {
        ...req.headers,
        'host': new URL(process.env.NEXT_PUBLIC_API_BASE_URL || '').host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...event,
        matchId: id,
        timestamp: event.timestamp || new Date().toISOString()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add event');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to add event'
    }, { status: 400 });
  }
}