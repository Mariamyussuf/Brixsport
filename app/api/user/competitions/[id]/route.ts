import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getCompetitionById } from '@/lib/userCompetitionService';

// GET /api/user/competitions/[id] - Get a specific competition by ID for regular users
export async function GET(request: NextRequest, context: { params: any }) {
  try {
    // Get the authentication session
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params as { id: string };
    
    // Fetch competition by ID from the user competition service
    const competition = await getCompetitionById(id);
    
    if (!competition) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Competition not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: competition
    });
  } catch (error) {
    console.error('Error fetching competition:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch competition'
      },
      { status: 500 }
    );
  }
}