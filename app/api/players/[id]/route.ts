import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/apiConfig';

// GET /api/players/[id] - Get player by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/teams/players/${id}`, {
      headers: {
        ...request.headers,
        'host': new URL(API_BASE_URL).host
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch player');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching player:', error);
    // Check if it's a 404 (not found) error
    const is404 = error instanceof Error && 
      (error.message.includes('not found') || error.message.includes('404'));

    return NextResponse.json(
      { 
        success: false,
        message: is404 ? 'feature_not_implemented' : 'server_error',
        details: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: is404 ? 404 : 500 }
    );
  }
}