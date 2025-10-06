import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/apiConfig';

// Helper function to forward requests to backend
async function forwardRequest(url: string, request: NextRequest, method: string = 'GET', body?: any) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...request.headers,
        'host': new URL(API_BASE_URL).host
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
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if user is admin (this would be implemented with proper auth middleware)
    // For now, we'll just forward to the backend
    
    // Check if this is a stats request
    const url = new URL(request.url);
    const isStatsRequest = url.pathname.endsWith('/stats');
    
    if (isStatsRequest) {
      // GET /api/admin/players/[id]/stats - Get player stats (Admin only)
      return forwardRequest(`${API_BASE_URL}/admin/players/${id}/stats`, request);
    }
    
    // Regular player request
    return forwardRequest(`${API_BASE_URL}/admin/players/${id}`, request);
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
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if user is admin (this would be implemented with proper auth middleware)
    // For now, we'll just forward to the backend
    
    const body = await request.json();
    
    // Check if this is a stats update request
    const url = new URL(request.url);
    const isStatsRequest = url.pathname.endsWith('/stats');
    
    if (isStatsRequest) {
      // PUT /api/admin/players/[id]/stats - Update player stats (Admin only)
      return forwardRequest(`${API_BASE_URL}/admin/players/${id}/stats`, request, 'PUT', body);
    }
    
    // Regular player update
    return forwardRequest(`${API_BASE_URL}/admin/players/${id}`, request, 'PUT', body);
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
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if user is admin (this would be implemented with proper auth middleware)
    // For now, we'll just forward to the backend
    
    // Check if this is a team removal request
    const url = new URL(request.url);
    const isTeamRequest = url.pathname.endsWith('/team');
    
    if (isTeamRequest) {
      // DELETE /api/admin/players/[id]/team - Remove player from team (Admin only)
      return forwardRequest(`${API_BASE_URL}/admin/players/${id}/team`, request, 'DELETE');
    }
    
    // Regular player deletion
    return forwardRequest(`${API_BASE_URL}/admin/players/${id}`, request, 'DELETE');
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
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Check if user is admin (this would be implemented with proper auth middleware)
    // For now, we'll just forward to the backend
    
    const body = await request.json();
    
    return forwardRequest(`${API_BASE_URL}/admin/players/${id}/team`, request, 'POST', body);
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