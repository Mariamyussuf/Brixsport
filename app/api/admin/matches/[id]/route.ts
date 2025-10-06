import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// PUT /api/admin/matches/:id - Update a match
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

    // Check if admin has permission to manage matches
    if (!hasAdminPermission(adminUser, 'manage_matches')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { id } = await params;
    
    // Update match (mock implementation)
    // TODO: Implement real database update
    console.log('Updating match:', id, body);
    
    // Get existing matches to simulate update
    const matches = await dbService.getMatches();
    const matchIndex = matches.findIndex(m => m.id === parseInt(id));
    
    if (matchIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match not found' 
      }, { status: 404 });
    }
    
    const updatedMatch = {
      ...matches[matchIndex],
      ...body,
      id: parseInt(id)
    };
    
    return NextResponse.json({ 
      success: true, 
      data: updatedMatch 
    });
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update match' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/matches/:id - Delete a match
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

    // Check if admin has permission to manage matches
    if (!hasAdminPermission(adminUser, 'manage_matches')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const { id } = await params;
    
    // Delete match (mock implementation)
    // TODO: Implement real database deletion
    console.log('Deleting match:', id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Match deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete match' 
    }, { status: 500 });
  }
}