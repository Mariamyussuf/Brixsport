import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/apiConfig';

// GET /api/teams/[id]/top-scorers - Get top scorers for a team
export async function GET(request: NextRequest) {
  try {
    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/teams/top-scorers`, {
      headers: {
        ...request.headers,
        'host': new URL(API_BASE_URL).host
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch top scorers');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}