import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { dbService } from '@/lib/databaseService';

// GET /api/user/competitions/[id] - Get user competition details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id: competitionId } = await params;

    // Get competition details
    const competitions = await dbService.getCompetitions();
    const competition = competitions.find(c => c.id === parseInt(competitionId));
    
    if (!competition) {
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Competition not found' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: competition
    });
  } catch (error) {
    console.error('Error fetching competition details:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching competition details' 
      } 
    }, { status: 500 });
  }
}