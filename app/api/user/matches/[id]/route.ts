import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { dbService } from '@/lib/databaseService';

// GET /api/user/matches/[id] - Get user match details
export async function GET(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: matchId } = await params as { id: string };

    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Get match details
    const matches = await dbService.getMatches();
    const match = matches.find(m => m.id === parseInt(matchId));
    
    if (!match) {
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Match not found' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('Error fetching match details:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching match details' 
      } 
    }, { status: 500 });
  }
}