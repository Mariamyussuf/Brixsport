import { NextRequest, NextResponse } from 'next/server';
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
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error forwarding request:', error);
    return NextResponse.json(
      { success: false, message: 'server_error' },
      { status: 500 }
    );
  }
}

// GET /api/competitions/[id] - Get competition by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    return forwardRequest(`${API_BASE_URL}/competitions/${id}`);
  } catch (error) {
    console.error('Error fetching competition:', error);
    return NextResponse.json(
      { success: false, message: 'server_error' },
      { status: 500 }
    );
  }
}
