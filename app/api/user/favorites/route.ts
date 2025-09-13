import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/apiConfig';

// GET /api/user/favorites - Get user favorites
export async function GET(request: NextRequest) {
  try {
    // Get the authentication session
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Unauthorized: User not authenticated'
        },
        { status: 401 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      headers: {
        ...request.headers,
        'host': new URL(API_BASE_URL).host
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch favorites');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

// POST /api/user/favorites - Add to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Unauthorized: User not authenticated'
        },
        { status: 401 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/favorites`, {
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
      throw new Error(data.error || 'Failed to add favorite');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

// DELETE /api/user/favorites - Remove from favorites
export async function DELETE(request: NextRequest) {
  try {
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Unauthorized: User not authenticated'
        },
        { status: 401 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'DELETE',
      headers: {
        ...request.headers,
        'host': new URL(API_BASE_URL).host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(await request.json())
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to remove favorite');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}
