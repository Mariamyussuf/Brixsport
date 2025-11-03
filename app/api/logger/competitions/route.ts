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

// Logger competitions data - fetched from database
let competitionsCache: LoggerCompetition[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
    
    // Fetch competitions from database
    let competitions: LoggerCompetition[] = [];
    
    // Check if cache is valid
    if (competitionsCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      competitions = competitionsCache;
    } else {
      // Fetch from database
      const dbCompetitions = await dbService.getCompetitions();
      competitions = dbCompetitions.map(comp => ({
        id: comp.id.toString(),
        name: comp.name,
        sport: comp.type || 'football',
        startDate: comp.start_date || new Date().toISOString().split('T')[0],
        endDate: comp.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: (comp.status as 'upcoming' | 'active' | 'completed') || 'upcoming',
        assignedLoggers: [] // This would need to be populated from a separate assignment table
      }));
      
      // Update cache
      competitionsCache = competitions;
      cacheTimestamp = Date.now();
    }
    
    // Filter competitions based on user permissions
    let accessibleCompetitions = competitions;
    
    // Regular loggers only see their assigned competitions
    // For now, we'll show all competitions to all users since assignment is not fully implemented
    // In a real implementation, this would filter based on actual assignments
    if (session.user.role === 'logger') {
      // accessibleCompetitions = competitions.filter(comp => 
      //   comp.assignedLoggers.includes(session.user.id)
      // );
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
    
    // Save to database
    await dbService.createCompetition({
      name: newCompetition.name,
      type: newCompetition.sport,
      category: 'default',
      status: newCompetition.status,
      start_date: newCompetition.startDate,
      end_date: newCompetition.endDate
    });
    
    // Clear cache
    competitionsCache = null;
    cacheTimestamp = null;
    
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