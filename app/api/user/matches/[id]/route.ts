import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';

// GET /api/user/matches/[id] - Get a specific match by ID for regular users
export async function GET(request: NextRequest, context: { params: any }) {
  try {
    // Get the authentication session
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params as { id: string };
    
    // Placeholder for actual implementation
    // This would fetch a specific match from your database by ID
    const match = null;
    
    if (!match) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Match not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch match'
      },
      { status: 500 }
    );
  }
}