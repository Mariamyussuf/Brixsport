import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// POST /api/admin/reports/:matchId - Generate a match report
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

    // Check if admin has permission to generate reports
    if (!hasAdminPermission(adminUser, 'generate_reports')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const { matchId } = await params;
    
    // Get match details from database
    const matches = await dbService.getMatches();
    const match = matches.find(m => m.id.toString() === matchId);
    
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
    
    // Get match events
    const events = await dbService.getMatchEvents(match.id);
    
    // Generate report based on real match data
    const report = {
      id: `report-${matchId}-${Date.now()}`,
      matchId: matchId,
      type: 'match',
      title: `Match Report: ${homeTeam?.name || 'Home Team'} vs ${awayTeam?.name || 'Away Team'}`,
      generatedAt: new Date().toISOString(),
      generatedBy: adminUser.name,
      data: {
        matchId: matchId,
        homeTeam: homeTeam?.name || 'Home Team',
        awayTeam: awayTeam?.name || 'Away Team',
        finalScore: `${match.home_score || 0}-${match.away_score || 0}`,
        events: events.map((event: any) => ({
          time: event.timestamp ? new Date(event.timestamp).toISOString() : 'Unknown',
          event: event.type || 'Event',
          team: event.teamId ? (teams.find(t => t.id === event.teamId)?.name || 'Unknown Team') : 'Unknown Team',
          player: event.playerId || 'Unknown Player'
        })),
        statistics: {
          home: {
            shots: 0, // Would need to calculate from events
            shotsOnTarget: 0, // Would need to calculate from events
            possession: '50%', // Would need to calculate from events
            corners: 0, // Would need to calculate from events
            fouls: 0 // Would need to calculate from events
          },
          away: {
            shots: 0, // Would need to calculate from events
            shotsOnTarget: 0, // Would need to calculate from events
            possession: '50%', // Would need to calculate from events
            corners: 0, // Would need to calculate from events
            fouls: 0 // Would need to calculate from events
          }
        }
      }
    };
    
    return NextResponse.json({ 
      success: true, 
      data: report,
      message: 'Report generated successfully'
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to generate report' 
    }, { status: 500 });
  }
}