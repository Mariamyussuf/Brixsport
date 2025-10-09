import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { dbService } from '@/lib/databaseService';

// GET /api/user/competitions - List all competitions for regular users
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
    
    // Fetch competitions directly from the database service
    const competitions = await dbService.getCompetitions();
    
    return NextResponse.json({
      success: true,
      data: competitions
    });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch competitions'
      },
      { status: 500 }
    );
  }
}