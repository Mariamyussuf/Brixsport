import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { API_BASE_URL } from '@/lib/apiConfig';

// Import the favorites service directly
import { favoritesService } from '@/../../brixsport-backend/apps/api/src/services/favorites.service';

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

    // Check if API_BASE_URL points to our own API to avoid infinite loops
    if (API_BASE_URL === '/api' || API_BASE_URL.startsWith('/api')) {
      // Use the favorites service directly
      const result = await favoritesService.getUserFavorites(session.user.id);
      return NextResponse.json({
        success: true,
        data: {
          teams: result.data.teams || [],
          players: result.data.players || [],
          competitions: result.data.competitions || []
        }
      });
    }

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      headers: {
        ...request.headers,
        'host': API_BASE_URL.startsWith('http') ? new URL(API_BASE_URL).host : undefined
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

    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.favorite_type || body.favorite_id === undefined) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Missing required fields: favorite_type and favorite_id'
        },
        { status: 400 }
      );
    }

    // Check if API_BASE_URL points to our own API to avoid infinite loops
    if (API_BASE_URL === '/api' || API_BASE_URL.startsWith('/api')) {
      // Use the favorites service directly
      const result = await favoritesService.addFavorite(session.user.id, body.favorite_type, body.favorite_id);
      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Added to favorites successfully'
      });
    }

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'POST',
      headers: {
        ...request.headers,
        'host': new URL(API_BASE_URL).host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        favorite_type: body.favorite_type,
        favorite_id: body.favorite_id
      })
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

    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.favorite_type || body.favorite_id === undefined) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Missing required fields: favorite_type and favorite_id'
        },
        { status: 400 }
      );
    }

    // Check if API_BASE_URL points to our own API to avoid infinite loops
    if (API_BASE_URL === '/api' || API_BASE_URL.startsWith('/api')) {
      // Use the favorites service directly
      const result = await favoritesService.removeFavorite(session.user.id, body.favorite_type, body.favorite_id);
      return NextResponse.json({
        success: true,
        message: 'Removed from favorites successfully'
      });
    }

    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'DELETE',
      headers: {
        ...request.headers,
        'host': new URL(API_BASE_URL).host,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        favorite_type: body.favorite_type,
        favorite_id: body.favorite_id
      })
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
