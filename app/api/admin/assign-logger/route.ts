import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';
import { NotificationService } from '@/services/notificationService';

// POST /api/admin/assign-logger - Assign a logger to a competition or match
export async function POST(request: NextRequest) {
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
        error: 'Forbidden: Insufficient permissions to assign loggers' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { loggerId, competitionId, matchId, notes } = body;
    
    // Validate input
    if (!loggerId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Logger ID is required' 
      }, { status: 400 });
    }
    
    if (!competitionId && !matchId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Either competitionId or matchId must be provided' 
      }, { status: 400 });
    }
    
    // Verify logger exists
    const logger = await dbService.getLoggerById(loggerId);
    if (!logger) {
      return NextResponse.json({ 
        success: false, 
        error: 'Logger not found' 
      }, { status: 404 });
    }
    
    // Verify competition exists if provided
    let competition = null;
    if (competitionId) {
      competition = await dbService.getCompetitionById(competitionId);
      if (!competition) {
        return NextResponse.json({ 
          success: false, 
          error: 'Competition not found' 
        }, { status: 404 });
      }
    }
    
    // Verify match exists if provided
    let match = null;
    if (matchId) {
      const matches = await dbService.getMatches();
      match = matches.find(m => m.id === matchId);
      if (!match) {
        return NextResponse.json({ 
          success: false, 
          error: 'Match not found' 
        }, { status: 404 });
      }
    }
    
    // Create assignment
    try {
      const assignment = await dbService.createLoggerAssignment({
        logger_id: loggerId,
        competition_id: competitionId || null,
        match_id: matchId || null,
        assigned_by: adminUser.id,
        notes: notes || null,
        status: 'active'
      });
      
      // Send notification to logger
      try {
        let notificationTitle = 'New Assignment';
        let notificationMessage = '';
        
        if (matchId && match) {
          const teams = await dbService.getTeams();
          const homeTeam = teams.find(t => t.id === match.home_team_id);
          const awayTeam = teams.find(t => t.id === match.away_team_id);
          notificationMessage = `You have been assigned to log the match: ${homeTeam?.name || 'Home Team'} vs ${awayTeam?.name || 'Away Team'} on ${new Date(match.match_date).toLocaleDateString()}`;
        } else if (competitionId && competition) {
          notificationMessage = `You have been assigned to the competition: ${competition.name}`;
        }
        
        await NotificationService.createNotification({
          userId: loggerId,
          type: 'ADMIN_NOTICE',
          title: notificationTitle,
          message: notificationMessage,
          priority: 'HIGH',
          entityType: matchId ? 'MATCH' : 'COMPETITION',
          entityId: matchId ? matchId.toString() : competitionId?.toString(),
          actionUrl: matchId ? `/logger/matches/${matchId}` : `/logger/competitions`,
          source: 'SYSTEM'
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the assignment if notification fails
      }
      
      // Log the admin action
      await dbService.logUserActivity(
        adminUser.id,
        'logger_assigned',
        {
          assignmentId: assignment.id,
          loggerId,
          competitionId,
          matchId
        }
      );
      
      return NextResponse.json({ 
        success: true, 
        data: assignment,
        message: 'Logger assigned successfully'
      });
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      
      // Check for conflict error
      if (error.code === 'ASSIGNMENT_CONFLICT') {
        return NextResponse.json({ 
          success: false, 
          error: error.message || 'Assignment conflict: This match already has an active logger assigned'
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Failed to create assignment' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in assign-logger endpoint:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
      }, { status: 500 });
  }
}

// GET /api/admin/assign-logger - Get all logger assignments (with optional filters)
export async function GET(request: NextRequest) {
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

    // Check if admin has permission to view logger assignments
    if (!hasAdminPermission(adminUser, 'manage_loggers') && !hasAdminPermission(adminUser, 'view_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const loggerId = searchParams.get('loggerId');
    const competitionId = searchParams.get('competitionId');
    const matchId = searchParams.get('matchId');
    const status = searchParams.get('status') as 'active' | 'completed' | 'cancelled' | null;
    const includeDetails = searchParams.get('includeDetails') === 'true';
    
    // Build filters
    const filters: any = {};
    if (loggerId) filters.logger_id = loggerId;
    if (competitionId) filters.competition_id = parseInt(competitionId);
    if (matchId) filters.match_id = parseInt(matchId);
    if (status) filters.status = status;
    
    // Fetch assignments
    let assignments;
    if (includeDetails) {
      assignments = await dbService.getLoggerAssignmentsWithDetails(filters);
    } else {
      assignments = await dbService.getLoggerAssignments(filters);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: assignments,
      count: assignments.length
    });
  } catch (error) {
    console.error('Error fetching logger assignments:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch logger assignments' 
    }, { status: 500 });
  }
}
