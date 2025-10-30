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
    
    // Filter competitions to only include active ones that can be assigned to loggers
    const assignableCompetitions = competitions.filter(competition => 
      competition.status === 'upcoming' || competition.status === 'ongoing'
    );
    
    // Add additional data for logger assignment UI
    const competitionsWithDetails = assignableCompetitions.map(competition => ({
      ...competition,
      displayName: `${competition.name} (${competition.category})`,
      assignmentCount: 0 // This would be populated with actual data in a real implementation
    }));
    
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