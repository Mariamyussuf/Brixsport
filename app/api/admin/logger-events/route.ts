import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// POST /api/admin/logger-events - Add an event to a logger's match
export async function POST(request: Request) {
  try {
    // Verify admin token
    const token = (await cookies()).get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Check if admin has permission to manage loggers
    if (!hasAdminPermission(adminUser, 'manage_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.matchId || !body.event) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match ID and event data are required' 
      }, { status: 400 });
    }
    
    // Check if the match exists
    const matches = await dbService.getMatches();
    const match = matches.find(m => m.id === parseInt(body.matchId));
    
    if (!match) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match not found' 
      }, { status: 404 });
    }
    
    // Add event to match using existing functionality
    const events = Array.isArray(body.event) ? body.event : [body.event];
    await dbService.saveMatchEvents(events, adminUser.id);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        matchId: body.matchId,
        events: events,
        timestamp: new Date().toISOString()
      },
      message: 'Event added to logger match successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding event to logger match:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add event to logger match' 
    }, { status: 500 });
  }
}