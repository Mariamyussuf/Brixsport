import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';

// Mock data for reports (in production, this would be generated from database)
const generateReportData = (matchId: string) => {
  return {
    id: `report-${matchId}`,
    matchId: matchId,
    type: 'match',
    title: `Match Report for ${matchId}`,
    generatedAt: new Date().toISOString(),
    data: {
      matchId: matchId,
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
};

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
    
    // Generate report based on matchId
    const report = generateReportData(matchId);
    
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