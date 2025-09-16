import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { dbService as databaseService } from '@/lib/databaseService';

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
    
    // Convert id to number
    const competitionId = parseInt(id, 10);
    if (isNaN(competitionId)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid competition ID'
        },
        { status: 400 }
      );
    }
    
    // Fetch competitions from database
    const competitions = await databaseService.getAllCompetitions();
    const competition = competitions.find(c => c.id === competitionId);
    
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