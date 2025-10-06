import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/apiConfig';

// GET /api/admin/players - Retrieve a list of players with pagination and filtering (Admin only)
// GET /api/admin/players/search - Advanced search for players (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (this would be implemented with proper auth middleware)
    // For now, we'll just forward to the backend admin endpoints
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || searchParams.get('q');
    
    // Determine if this is a search request
    const isSearch = search !== null;
    
    let backendUrl, queryString;
    if (isSearch) {
      // This is a search request
      backendUrl = `${API_BASE_URL}/admin/players/search`;
      const params = new URLSearchParams();
      
      // Add search parameters
      searchParams.forEach((value, key) => {
        params.append(key, value);
      });
      
      queryString = params.toString();
    } else {
      // This is a regular players list request
      backendUrl = `${API_BASE_URL}/admin/players`;
      const params = new URLSearchParams();
      
      // Add filter parameters
      searchParams.forEach((value, key) => {
        params.append(key, value);
      });
      
      queryString = params.toString();
    }
    
    const url = queryString ? `${backendUrl}?${queryString}` : backendUrl;
    
    const response = await fetch(url, {
      headers: {
        ...request.headers,
        'host': new URL(API_BASE_URL).host
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Failed to fetch ${isSearch ? 'search results' : 'players'}`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching players:', error);
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

// POST /api/admin/players - Create a new player profile (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (this would be implemented with proper auth middleware)
    // For now, we'll just forward to the backend
    
    const body = await request.json();
    
    // Forward request to backend
    const response = await fetch(`${API_BASE_URL}/admin/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...request.headers,
        'host': new URL(API_BASE_URL).host
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create player');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating player:', error);
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