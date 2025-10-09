import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { dbService } from '@/lib/databaseService';

// PATCH /api/live/matches/[id]/score - Update live match score (Admin/Logger only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user has permission to update live scores
    if (session.user.role !== 'admin' && session.user.role !== 'logger') {
      return NextResponse.json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions' 
        } 
      }, { status: 403 });
    }

    const { id: matchId } = await params;
    const { homeScore, awayScore, currentMinute, period } = await req.json();

    // Update the specific match score
    const scores = [{
      matchId: parseInt(matchId),
      homeScore,
      awayScore,
      currentMinute,
      period
    }];

    await dbService.updateMatchScores(scores, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Match score updated successfully'
    });
  } catch (error) {
    console.error('Error updating match score:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while updating the match score' 
      } 
    }, { status: 500 });
  }
}