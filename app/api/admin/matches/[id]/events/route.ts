import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';

// Define the Event interface
interface Event {
  id: string;
  type: string;
  teamId: string;
  playerId: string;
  time: string;
  description: string;
  [key: string]: any; // Allow additional properties
}

// Define the Match interface
interface Match {
  id: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  period: string | null;
  timeRemaining: string | null;
  events: Event[];
  loggerId: string;
  lastUpdated: string;
}

// Mock data for matches (in production, this would be a database)
// Note: In a real implementation, this would be imported from a shared service
let matches: Match[] = [
  {
    id: 'match1',
    competitionId: 'comp1',
    homeTeamId: 'team1',
    awayTeamId: 'team2',
    startTime: new Date('2023-09-15T15:00:00Z').toISOString(),
    status: 'scheduled',
    homeScore: null,
    awayScore: null,
    period: null,
    timeRemaining: null,
    events: [],
    loggerId: 'logger1',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'match2',
    competitionId: 'comp1',
    homeTeamId: 'team3',
    awayTeamId: 'team4',
    startTime: new Date('2023-09-16T17:30:00Z').toISOString(),
    status: 'live',
    homeScore: 1,
    awayScore: 0,
    period: '1st Half',
    timeRemaining: '25:00',
    events: [
      {
        id: 'event1',
        type: 'goal',
        teamId: 'team3',
        playerId: 'player1',
        time: '20:00',
        description: 'Goal scored by Player 1'
      }
    ],
    loggerId: 'logger1',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'match3',
    competitionId: 'comp2',
    homeTeamId: 'team5',
    awayTeamId: 'team6',
    startTime: new Date('2023-09-17T20:00:00Z').toISOString(),
    status: 'scheduled',
    homeScore: null,
    awayScore: null,
    period: null,
    timeRemaining: null,
    events: [],
    loggerId: 'logger2',
    lastUpdated: new Date().toISOString()
  }
];

// POST /api/admin/matches/:id/events - Add an event to a match
export async function POST(request: Request, { params }: { params: { id: string } }) {
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

    // Check if admin has permission to manage matches
    if (!hasAdminPermission(adminUser, 'manage_matches')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { id } = params;
    
    // Find match to update
    const matchIndex = matches.findIndex(match => match.id === id);
    if (matchIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match not found' 
      }, { status: 404 });
    }
    
    // Add event to match
    const newEvent: Event = {
      id: `event${Date.now()}`,
      ...body,
      time: new Date().toISOString()
    };
    
    matches[matchIndex].events.push(newEvent);
    matches[matchIndex].lastUpdated = new Date().toISOString();
    
    return NextResponse.json({ 
      success: true, 
      data: matches[matchIndex],
      message: 'Event added successfully'
    });
  } catch (error) {
    console.error('Error adding event to match:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add event to match' 
    }, { status: 500 });
  }
}
