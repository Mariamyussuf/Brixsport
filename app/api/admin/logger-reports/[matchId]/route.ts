import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// POST /api/admin/logger-reports/[matchId] - Generate a logger report for a match
export async function POST(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
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

    const { matchId } = await params;
    
    // Validate match ID
    if (!matchId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match ID is required' 
      }, { status: 400 });
    }
    
    // Check if the match exists
    const matches = await dbService.getMatches();
    const match = matches.find(m => m.id === parseInt(matchId));
    
    if (!match) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match not found' 
      }, { status: 404 });
    }
    
    // Get competition details
    const competition = await dbService.getCompetitionById(match.competition_id);
    
    // Get team details
    const teams = await dbService.getTeams();
    const homeTeam = teams.find(team => team.id === match.home_team_id) || null;
    const awayTeam = teams.find(team => team.id === match.away_team_id) || null;
    
    // Generate logger report for the match
    const report = {
      matchId: matchId,
      reportId: `report-${matchId}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      generatedBy: adminUser.name,
      data: {
        matchDetails: {
          id: match.id,
          competition: competition?.name || 'Unknown Competition',
          homeTeam: homeTeam?.name || 'Unknown Team',
          awayTeam: awayTeam?.name || 'Unknown Team',
          matchDate: match.match_date,
          status: match.status,
          venue: match.venue
        },
        matchStatistics: {
          // In a real implementation, this would fetch actual match statistics
          homeScore: match.home_score || 0,
          awayScore: match.away_score || 0,
          period: match.period || 'Not started',
          currentMinute: match.current_minute || 0
        }
      }
    };
    
    return NextResponse.json({ 
      success: true, 
      data: report,
      message: 'Logger report generated successfully'
    });
  } catch (error) {
    console.error('Error generating logger report:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate logger report' 
    }, { status: 500 });
  }
}