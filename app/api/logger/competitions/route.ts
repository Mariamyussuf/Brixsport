import { NextRequest, NextResponse } from 'next/server';
import { getLoggerAuth } from '@/lib/loggerAuthService';
import { LoggerRBAC } from '@/lib/loggerRBAC';
import { dbService } from '@/lib/databaseService';

// Logger competition data interface
interface LoggerCompetition {
  id: string;
  name: string;
  sport: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  assignedLoggers: string[];
}

// Mock competitions data - in production this would come from a database
const MOCK_COMPETITIONS: LoggerCompetition[] = [
  {
    id: 'comp-1',
    name: 'University Premier League',
    sport: 'football',
    startDate: '2025-09-01',
    endDate: '2025-12-15',
    status: 'active',
    assignedLoggers: ['logger-1', 'senior-logger-1']
  },
  {
    id: 'comp-2',
    name: 'Inter-University Basketball Championship',
    sport: 'basketball',
    startDate: '2025-10-01',
    endDate: '2025-11-30',
    status: 'active',
    assignedLoggers: ['logger-1']
  },
  {
    id: 'comp-3',
    name: 'University Athletics Championship',
    sport: 'athletics',
    startDate: '2025-11-01',
    endDate: '2025-11-15',
    status: 'upcoming',
    assignedLoggers: ['senior-logger-1']
  }
];

// GET /api/logger/competitions - Get all competitions accessible to the logger
export async function GET(request: NextRequest) {
  try {
    const session = await getLoggerAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Filter competitions based on user permissions
    let accessibleCompetitions = MOCK_COMPETITIONS;
    
    // Regular loggers only see their assigned competitions
    if (session.user.role === 'logger') {
      accessibleCompetitions = MOCK_COMPETITIONS.filter(comp => 
        comp.assignedLoggers.includes(session.user.id)
      );
    }
    
    // Senior loggers and admins can see all competitions
    // But we still apply RBAC checks
    if (!LoggerRBAC.canManageCompetitions(session.user)) {
      // For users who can't manage competitions, only show active ones
      accessibleCompetitions = accessibleCompetitions.filter(comp => 
        comp.status === 'active'
      );
    }
    
    return NextResponse.json({
      success: true,
      data: accessibleCompetitions,
      count: accessibleCompetitions.length
    });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitions' },
      { status: 500 }
    );
  }
}

// POST /api/logger/competitions - Create a new competition (admin/senior logger only)
export async function POST(request: NextRequest) {
  try {
    const session = await getLoggerAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to create competitions
    if (!LoggerRBAC.canManageCompetitions(session.user)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create competitions' },
        { status: 403 }
      );
    }
    
    const competitionData = await request.json();
    
    // Validate required fields
    if (!competitionData.name || !competitionData.sport) {
      return NextResponse.json(
        { error: 'Name and sport are required' },
        { status: 422 }
      );
    }
    
    // Create new competition
    const newCompetition: LoggerCompetition = {
      id: `comp-${Date.now()}`,
      name: competitionData.name,
      sport: competitionData.sport,
      startDate: competitionData.startDate || new Date().toISOString().split('T')[0],
      endDate: competitionData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: competitionData.status || 'upcoming',
      assignedLoggers: competitionData.assignedLoggers || []
    };
    
    // In production, save to database
    // await dbService.createCompetition(newCompetition);
    
    // For now, add to mock data
    MOCK_COMPETITIONS.push(newCompetition);
    
    // Log activity
    await dbService.logUserActivity(
      session.user.id, 
      'competition_created', 
      { competitionId: newCompetition.id, competitionName: newCompetition.name }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Competition created successfully',
      data: newCompetition
    });
  } catch (error) {
    console.error('Error creating competition:', error);
    return NextResponse.json(
      { error: 'Failed to create competition' },
      { status: 500 }
    );
  }
}