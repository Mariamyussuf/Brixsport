import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { dbService } from '@/lib/databaseService';

// GET /api/logger/matches/[id] - Get match details for logger
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user is a logger
    if (session.user.role !== 'logger') {
      return NextResponse.json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Only loggers can access match details' 
        } 
      }, { status: 403 });
    }

    const { id: matchId } = params;

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

// PATCH /api/logger/matches/[id] - Update match status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user is a logger
    if (session.user.role !== 'logger') {
      return NextResponse.json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Only loggers can update match status' 
        } 
      }, { status: 403 });
    }

    const { id: matchId } = params;
    const { status, currentMinute, period } = await req.json();

    // Update match status
    const scores = [{
      matchId: parseInt(matchId),
      status,
      currentMinute,
      period
    }];

    await dbService.updateMatchScores(scores, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Match status updated successfully'
    });
  } catch (error) {
    console.error('Error updating match status:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while updating match status' 
      } 
    }, { status: 500 });
  }
}