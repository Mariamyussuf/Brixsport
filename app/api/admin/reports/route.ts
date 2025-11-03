import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// GET /api/admin/reports - Get all reports
export async function GET() {
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

    // Check if admin has permission to view reports
    if (!hasAdminPermission(adminUser, 'view_reports')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    // Get real data for reports
    const matches = await dbService.getMatches();
    const competitions = await dbService.getCompetitions();
    const teams = await dbService.getTeams();
    
    // Generate sample reports based on real data
    const reports = [];
    
    // Generate match reports for live matches
    const liveMatches = matches.filter(match => match.status === 'live');
    for (const match of liveMatches.slice(0, 3)) { // Limit to first 3 live matches
      const homeTeam = teams.find(team => team.id === match.home_team_id) || null;
      const awayTeam = teams.find(team => team.id === match.away_team_id) || null;
      const competition = competitions.find(comp => comp.id === match.competition_id) || null;
      
      reports.push({
        id: `match-report-${match.id}-${Date.now()}`,
        type: 'match',
        title: `Live Match Report: ${homeTeam?.name || 'Home Team'} vs ${awayTeam?.name || 'Away Team'}`,
        generatedAt: new Date().toISOString(),
        data: {
          matchId: match.id,
          homeTeam: homeTeam?.name || 'Home Team',
          awayTeam: awayTeam?.name || 'Away Team',
          finalScore: `${match.home_score || 0}-${match.away_score || 0}`,
          competition: competition?.name || 'Unknown Competition',
          status: match.status,
          period: match.period || 'Not started'
        }
      });
    }
    
    // Generate competition reports
    for (const competition of competitions.slice(0, 2)) { // Limit to first 2 competitions
      const competitionMatches = matches.filter(match => match.competition_id === competition.id);
      
      reports.push({
        id: `competition-report-${competition.id}-${Date.now()}`,
        type: 'competition',
        title: `Competition Report: ${competition.name}`,
        generatedAt: new Date().toISOString(),
        data: {
          competitionId: competition.id,
          name: competition.name,
          totalMatches: competitionMatches.length,
          completedMatches: competitionMatches.filter(m => m.status === 'completed').length,
          upcomingMatches: competitionMatches.filter(m => m.status === 'scheduled').length,
          // Would need to calculate top scorers and standings from real data
          topScorers: [],
          standings: []
        }
      });
    }
    
    // Generate system report
    reports.push({
      id: `system-report-${Date.now()}`,
      type: 'system',
      title: 'System Report',
      generatedAt: new Date().toISOString(),
      data: {
        totalLoggers: 0, // Would need to get from database
        activeLoggers: 0, // Would need to get from database
        totalMatches: matches.length,
        matchesToday: matches.filter(m => {
          const today = new Date();
          const matchDate = new Date(m.match_date);
          return matchDate.getDate() === today.getDate() && 
                 matchDate.getMonth() === today.getMonth() && 
                 matchDate.getFullYear() === today.getFullYear();
        }).length,
        eventsLogged: 0, // Would need to get from database
        systemHealth: 'Good'
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: reports 
    });
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch reports' 
    }, { status: 500 });
  }
}

// POST /api/admin/reports - Generate a general report
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

    // Check if admin has permission to generate reports
    if (!hasAdminPermission(adminUser, 'generate_reports')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { type, id } = body;
    
    let report;
    
    switch (type) {
      case 'match':
        if (!id) {
          throw new Error('Match ID is required for match reports');
        }
        
        // Get match details
        const matches = await dbService.getMatches();
        const match = matches.find(m => m.id.toString() === id);
        
        if (!match) {
          throw new Error('Match not found');
        }
        
        // Get team details
        const teams = await dbService.getTeams();
        const homeTeam = teams.find(team => team.id === match.home_team_id) || null;
        const awayTeam = teams.find(team => team.id === match.away_team_id) || null;
        
        // Get competition details
        const competition = await dbService.getCompetitionById(match.competition_id);
        
        report = {
          id: `match-report-${id}-${Date.now()}`,
          type: 'match',
          title: `Match Report: ${homeTeam?.name || 'Home Team'} vs ${awayTeam?.name || 'Away Team'}`,
          generatedAt: new Date().toISOString(),
          generatedBy: adminUser.name,
          data: {
            matchId: id,
            homeTeam: homeTeam?.name || 'Home Team',
            awayTeam: awayTeam?.name || 'Away Team',
            finalScore: `${match.home_score || 0}-${match.away_score || 0}`,
            competition: competition?.name || 'Unknown Competition',
            status: match.status,
            period: match.period || 'Not started'
          }
        };
        break;
        
      case 'competition':
        if (!id) {
          throw new Error('Competition ID is required for competition reports');
        }
        
        // Get competition details
        const comp = await dbService.getCompetitionById(parseInt(id));
        
        if (!comp) {
          throw new Error('Competition not found');
        }
        
        // Get matches for this competition
        const compMatches = await dbService.getMatchesByCompetition(parseInt(id));
        
        report = {
          id: `competition-report-${id}-${Date.now()}`,
          type: 'competition',
          title: `Competition Report: ${comp.name}`,
          generatedAt: new Date().toISOString(),
          generatedBy: adminUser.name,
          data: {
            competitionId: id,
            name: comp.name,
            totalMatches: compMatches.length,
            completedMatches: compMatches.filter(m => m.status === 'completed').length,
            upcomingMatches: compMatches.filter(m => m.status === 'scheduled').length,
            // Would need to calculate top scorers and standings from real data
            topScorers: [],
            standings: []
          }
        };
        break;
        
      case 'system':
        // Generate system report
        const allMatches = await dbService.getMatches();
        
        report = {
          id: `system-report-${Date.now()}`,
          type: 'system',
          title: 'System Report',
          generatedAt: new Date().toISOString(),
          generatedBy: adminUser.name,
          data: {
            totalLoggers: 0, // Would need to get from database
            activeLoggers: 0, // Would need to get from database
            totalMatches: allMatches.length,
            matchesToday: allMatches.filter(m => {
              const today = new Date();
              const matchDate = new Date(m.match_date);
              return matchDate.getDate() === today.getDate() && 
                     matchDate.getMonth() === today.getMonth() && 
                     matchDate.getFullYear() === today.getFullYear();
            }).length,
            eventsLogged: 0, // Would need to get from database
            systemHealth: 'Good'
          }
        };
        break;
        
      default:
        throw new Error('Invalid report type');
    }
    
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