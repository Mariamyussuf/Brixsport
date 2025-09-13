import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/apiConfig';

// GET /api/track/fixtures - Get all fixtures to track
export async function GET(request: NextRequest) {
  try {
    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/track/fixtures`, {
      headers: {
        ...request.headers,
        'host': new URL(API_BASE_URL).host
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch fixtures');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}