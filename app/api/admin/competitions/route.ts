import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService as databaseService } from '@/lib/databaseService';

// GET /api/admin/competitions - Get all competitions
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

    // Check if admin has permission to view competitions
    if (!hasAdminPermission(adminUser, 'view_competitions')) {
      // All admins should be able to view competitions
      // Add this permission if it doesn't exist
    }

    // Fetch competitions from database
    const competitions = await databaseService.getAllCompetitions();
    
    return NextResponse.json({ 
      success: true, 
      data: competitions 
    });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch competitions' 
    }, { status: 500 });
  }
}

// POST /api/admin/competitions - Create a new competition
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

    // Check if admin has permission to manage competitions
    if (!hasAdminPermission(adminUser, 'manage_competitions')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.sport || !body.startDate || !body.endDate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, sport, start date, and end date are required' 
      }, { status: 400 });
    }
    
    // Create new competition in database
    const newCompetition = await databaseService.createCompetition({
      name: body.name,
      sport: body.sport,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status || 'upcoming',
      assignedLoggers: body.assignedLoggers || [],
      location: body.location || ''
    });
    
    return NextResponse.json({ 
      success: true, 
      data: newCompetition 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating competition:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create competition' 
    }, { status: 500 });
  }
}

// PUT /api/admin/competitions/:id - Update a competition
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if admin has permission to manage competitions
    if (!hasAdminPermission(adminUser, 'manage_competitions')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { id } = await params;
    
    // Update competition in database
    const updatedCompetition = await databaseService.updateCompetition(id, body);
    
    if (!updatedCompetition) {
      return NextResponse.json({ 
        success: false, 
        error: 'Competition not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedCompetition 
    });
  } catch (error) {
    console.error('Error updating competition:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update competition' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/competitions/:id - Delete a competition
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Check if admin has permission to manage competitions
    if (!hasAdminPermission(adminUser, 'manage_competitions')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const { id } = await params;
    
    // Delete competition from database
    const deletedCompetition = await databaseService.deleteCompetition(id);
    
    if (!deletedCompetition) {
      return NextResponse.json({ 
        success: false, 
        error: 'Competition not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Competition deleted successfully',
      data: deletedCompetition
    });
  } catch (error) {
    console.error('Error deleting competition:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete competition' 
    }, { status: 500 });
  }
}