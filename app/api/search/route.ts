import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/apiConfig';

// GET /api/search - Search players, competitions, and teams (Authenticated users only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json(
        { 
          success: false,
          message: 'bad_request',
          details: 'Query parameter is required'
        },
        { status: 400 }
      );
    }
    
    // Forward request to backend search endpoint
    const backendUrl = `${API_BASE_URL}/search`;
    const params = new URLSearchParams();
    params.append('query', query);
    
    // Add optional parameters
    const types = searchParams.getAll('types');
    if (types.length > 0) {
      types.forEach(type => params.append('types', type));
    }
    
    const limit = searchParams.get('limit');
    if (limit) {
      params.append('limit', limit);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${backendUrl}?${queryString}` : backendUrl;
    
    const response = await fetch(url, {
      headers: {
        ...request.headers,
        'host': new URL(API_BASE_URL).host
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to perform search');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error performing search:', error);
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