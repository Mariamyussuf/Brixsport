import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { dbService } from '@/lib/databaseService';

// GET /api/home/matches/{sport} - Get matches filtered by sport type
export async function GET(request: NextRequest, context: { params: any }) {
  try {
    const params = await context.params;
    const { sport } = params as { sport: string };
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    
    // Validate sport parameter
    const validSports = ['football', 'basketball', 'track'];
    if (!validSports.includes(sport)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid sport parameter. Valid values: football, basketball, track'
        },
        { status: 400 }
      );
    }
    
    // Get the authenticated user (but don't require authentication for public access)
    const session = await getAuth(request);
    const userId = session?.user?.id;

    // Fetch matches from database service
    const matches = await dbService.getMatchesBySport(sport, status === 'all' ? undefined : status);
    
    return NextResponse.json({
      success: true,
      data: {
        matches
      }
    });
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch matches'
      },
      { status: 500 }
    );
  }
}