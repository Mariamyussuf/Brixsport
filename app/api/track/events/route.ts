import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/apiConfig';
import { getAuth } from '@/lib/auth';

// POST /api/track/events - Create track event
export async function POST(request: NextRequest) {
  try {
    const session = await getAuth(request);
    
    if (!session || !['logger', 'admin'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Unauthorized: Only loggers and admins can create events'
        },
        { status: 401 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/track/events`, {
      method: 'POST',
      headers: {
        ...request.headers,
        'host': new URL(API_BASE_URL).host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(await request.json())
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create event');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}