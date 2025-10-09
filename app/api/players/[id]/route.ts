import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/apiConfig';

// Helper function to forward requests to backend
async function forwardRequest(url: string, method: string = 'GET', body?: any) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error forwarding request:', error);
    const is404 = error instanceof Error && 
      (error.message.includes('not found') || error.message.includes('404'));

    return NextResponse.json(
      { 
        success: false,
        message: is404 ? 'not_found' : 'server_error',
        details: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: is404 ? 404 : 500 }
    );
  }
}

// GET /api/admin/players/[id] - Get player by ID (Admin only)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Check if this is a stats request
    const url = new URL(req.url);
    const isStatsRequest = url.pathname.endsWith('/stats');
    
    if (isStatsRequest) {
      // GET /api/admin/players/[id]/stats - Get player stats (Admin only)
      return forwardRequest(`${API_BASE_URL}/admin/players/${id}/stats`);
    }
    
    // Regular player request
    return forwardRequest(`${API_BASE_URL}/admin/players/${id}`);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'server_error',
        details: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/admin/players/[id] - Update player (Admin only)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    const body = await req.json();
    
    // Check if this is a stats update request
    const url = new URL(req.url);
    const isStatsRequest = url.pathname.endsWith('/stats');
    
    if (isStatsRequest) {
      // PUT /api/admin/players/[id]/stats - Update player stats (Admin only)
      return forwardRequest(`${API_BASE_URL}/admin/players/${id}/stats`, 'PUT', body);
    }
    
    // Regular player update
    return forwardRequest(`${API_BASE_URL}/admin/players/${id}`, 'PUT', body);
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'server_error',
        details: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/players/[id] - Delete player (Admin only)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Check if this is a team removal request
    const url = new URL(req.url);
    const isTeamRequest = url.pathname.endsWith('/team');
    
    if (isTeamRequest) {
      // DELETE /api/admin/players/[id]/team - Remove player from team (Admin only)
      return forwardRequest(`${API_BASE_URL}/admin/players/${id}/team`, 'DELETE');
    }
    
    // Regular player deletion
    return forwardRequest(`${API_BASE_URL}/admin/players/${id}`, 'DELETE');
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'server_error',
        details: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/players/[id]/team - Assign player to team (Admin only)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    const body = await req.json();
    
    return forwardRequest(`${API_BASE_URL}/admin/players/${id}/team`, 'POST', body);
  } catch (error) {
    console.error('Error assigning player to team:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'server_error',
        details: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}