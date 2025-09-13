import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getCompetitions } from '@/lib/userCompetitionService';

// GET /api/user/competitions - List all competitions for regular users
export async function GET(request: NextRequest) {
  try {
    // Get the authentication session
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch competitions from the user competition service
    const competitions = await getCompetitions();
    
    return NextResponse.json({
      success: true,
      data: competitions
    });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch competitions'
      },
      { status: 500 }
    );
  }
}
