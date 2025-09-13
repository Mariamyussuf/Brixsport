import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/apiConfig';
import { getAuth } from '@/lib/auth';

// PATCH /api/track/events/[id]/status - Update event status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuth(request);
    
    if (!session || !['logger', 'admin'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Unauthorized: Only loggers and admins can update event status'
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/track/events/${id}/status`, {
      method: 'PATCH',
      headers: {
        ...request.headers,
        'host': new URL(API_BASE_URL).host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(await request.json())
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update event status');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating event status:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}