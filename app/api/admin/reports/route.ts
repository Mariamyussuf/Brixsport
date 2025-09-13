import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';

// Mock data for reports (in production, this would be generated from database)
const generateReportData = (reportType: string, id?: string) => {
  switch (reportType) {
    case 'match':
      return {
        id: id || 'report1',
        type: 'match',
        title: `Match Report ${id || '1'}`,
        generatedAt: new Date().toISOString(),
        data: {
          matchId: id || 'match1',
          homeTeam: 'Home Team',
          awayTeam: 'Away Team',
          finalScore: '2-1',
          events: [
            { time: '15:00', event: 'Goal', team: 'Home Team', player: 'Player A' },
            { time: '32:00', event: 'Yellow Card', team: 'Away Team', player: 'Player B' },
            { time: '45:00', event: 'Goal', team: 'Home Team', player: 'Player C' },
            { time: '67:00', event: 'Substitution', team: 'Away Team' },
            { time: '89:00', event: 'Goal', team: 'Away Team', player: 'Player D' }
          ],
          statistics: {
            home: {
              shots: 12,
              shotsOnTarget: 6,
              possession: '58%',
              corners: 5,
              fouls: 8
            },
            away: {
              shots: 8,
              shotsOnTarget: 3,
              possession: '42%',
              corners: 3,
              fouls: 12
            }
          }
        }
      };
    case 'competition':
      return {
        id: id || 'report2',
        type: 'competition',
        title: `Competition Report ${id || '1'}`,
        generatedAt: new Date().toISOString(),
        data: {
          competitionId: id || 'comp1',
          name: 'Premier League',
          totalMatches: 20,
          completedMatches: 15,
          upcomingMatches: 5,
          topScorers: [
            { player: 'Player A', team: 'Team 1', goals: 15 },
            { player: 'Player B', team: 'Team 2', goals: 12 },
            { player: 'Player C', team: 'Team 3', goals: 10 }
          ],
          standings: [
            { position: 1, team: 'Team 1', points: 45, played: 15, wins: 14, draws: 3, losses: 2 },
            { position: 2, team: 'Team 2', points: 42, played: 15, wins: 13, draws: 3, losses: 3 },
            { position: 3, team: 'Team 3', points: 38, played: 15, wins: 11, draws: 5, losses: 4 }
          ]
        }
      };
    case 'logger':
      return {
        id: id || 'report3',
        type: 'logger',
        title: `Logger Performance Report ${id || '1'}`,
        generatedAt: new Date().toISOString(),
        data: {
          loggerId: id || 'logger1',
          name: 'John Logger',
          matchesLogged: 25,
          eventsLogged: 120,
          accuracy: '95%',
          activity: [
            { date: '2023-09-01', matches: 2, events: 15 },
            { date: '2023-09-02', matches: 1, events: 8 },
            { date: '2023-09-03', matches: 3, events: 22 },
            { date: '2023-09-04', matches: 0, events: 0 },
            { date: '2023-09-05', matches: 2, events: 18 }
          ]
        }
      };
    default:
      return {
        id: 'report4',
        type: 'system',
        title: 'System Report',
        generatedAt: new Date().toISOString(),
        data: {
          totalLoggers: 12,
          activeLoggers: 8,
          totalMatches: 120,
          matchesToday: 8,
          eventsLogged: 480,
          systemHealth: 'Good'
        }
      };
  }
};

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

    // Generate sample reports
    const reports = [
      generateReportData('match', 'match1'),
      generateReportData('competition', 'comp1'),
      generateReportData('logger', 'logger1'),
      generateReportData('system')
    ];

    return NextResponse.json({ 
      success: true, 
      data: reports 
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch reports' 
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
    
    // Generate report based on type
    const report = generateReportData(type, id);
    
    return NextResponse.json({ 
      success: true, 
      data: report,
      message: 'Report generated successfully'
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate report' 
    }, { status: 500 });
  }
}