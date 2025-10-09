import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService as databaseService } from '@/lib/databaseService';

// Define the Competition interface locally to match the database service
interface Competition {
  id: number;
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
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
    
    // Convert id to number
    const competitionId = parseInt(id, 10);
    if (isNaN(competitionId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid competition ID' 
      }, { status: 400 });
    }
    
    // Update competition in database
    const updatedCompetition = await databaseService.updateCompetition(competitionId, body);
    
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
    
    // Convert id to number
    const competitionId = parseInt(id, 10);
    if (isNaN(competitionId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid competition ID' 
      }, { status: 400 });
    }
    
    // Delete competition from database
    const isDeleted = await databaseService.deleteCompetition(competitionId);
    
    if (!isDeleted) {
      return NextResponse.json({ 
        success: false, 
        error: 'Competition not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Competition deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting competition:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete competition' 
    }, { status: 500 });
  }
}