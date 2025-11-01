import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// GET /api/admin/logger-competitions - Get competitions that can be assigned to loggers
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

    // Check if admin has permission to manage loggers
    if (!hasAdminPermission(adminUser, 'manage_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    // Fetch competitions from database that can be assigned to loggers
    const competitions = await dbService.getCompetitions();
    
    // Fetch all loggers to determine assignment counts
    const loggers = await dbService.getAllLoggers();
    
    // Filter competitions to only include active ones that can be assigned to loggers
    const assignableCompetitions = competitions.filter(competition => 
      competition.status === 'upcoming' || competition.status === 'ongoing'
    );
    
    // Add assignment counts to competitions by counting how many loggers have each competition assigned
    const competitionsWithDetails = assignableCompetitions.map(competition => {
      // Count how many loggers have this competition assigned
      const assignmentCount = loggers.filter(logger => 
        logger.assignedCompetitions && logger.assignedCompetitions.includes(String(competition.id))
      ).length;
      
      return {
        ...competition,
        displayName: `${competition.name} (${competition.category})`,
        assignmentCount
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      data: competitionsWithDetails
    });
  } catch (error) {
    console.error('Error fetching logger competitions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch logger competitions' 
    }, { status: 500 });
  }
}