import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { dbService } from '@/lib/databaseService';

// POST /api/logger/matches/[id]/events - Log match events
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
          message: 'Only loggers can log match events' 
        } 
      }, { status: 403 });
    }

    const { id: matchId } = await params;
    const events = await req.json();

    // Validate required fields
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ 
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Events array is required and cannot be empty' 
        } 
      }, { status: 400 });
    }

    // Add matchId to each event
    const eventsWithMatchId = events.map(event => ({
      ...event,
      matchId: parseInt(matchId)
    }));

    await dbService.saveMatchEvents(eventsWithMatchId, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Events logged successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error logging match events:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while logging match events' 
      } 
    }, { status: 500 });
  }
}