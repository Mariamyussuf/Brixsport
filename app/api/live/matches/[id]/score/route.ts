import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/apiConfig';
import { getAuth } from '@/lib/auth';

// PATCH /api/live/matches/[id]/score - Update match score
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuth(request);
    
    if (!session || !['logger', 'admin'].includes(session.user?.role || '')) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Unauthorized: Only loggers and admins can update scores'
        },
        { status: 401 }
      );
    }

    // Resolve the params promise
    const { id } = await params;

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/live/matches/${id}/score`, {
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
      throw new Error(data.error || 'Failed to update score');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating score:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}