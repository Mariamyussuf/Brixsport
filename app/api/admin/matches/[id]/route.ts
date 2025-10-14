import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// PUT /api/admin/matches/:id - Update a match
export async function PUT(request: Request, { params }: { params: Promise<{}> }) {
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
    const { id } = await params as { id: string };
    
    // Update match with real database operation
    const matchData = {
      ...(body.competitionId && { competitionId: body.competitionId }),
      ...(body.homeTeamId && { homeTeamId: body.homeTeamId }),
      ...(body.awayTeamId && { awayTeamId: body.awayTeamId }),
      ...(body.startTime && { startTime: body.startTime }),
      ...(body.status && { status: body.status }),
      ...(body.homeScore !== undefined && { homeScore: body.homeScore }),
      ...(body.awayScore !== undefined && { awayScore: body.awayScore }),
      ...(body.currentMinute !== undefined && { currentMinute: body.currentMinute }),
      ...(body.period && { period: body.period }),
      ...(body.venue && { venue: body.venue }),
    };
    
    // Make API call to update match
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
    const adminToken = (await cookies()).get('admin_token')?.value;
    
    const response = await fetch(`${API_BASE_URL}/v1/matches/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(matchData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return NextResponse.json({ 
          success: false, 
          error: 'Match not found' 
        }, { status: 404 });
      }
      throw new Error(errorData.error || `API call failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return NextResponse.json({ 
      success: true, 
      data: result.data 
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
export async function DELETE(request: Request, { params }: { params: Promise<{}> }) {
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

    const { id } = await params as { id: string };
    
    // Delete match with real database operation
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
    const adminToken = (await cookies()).get('admin_token')?.value;
    
    const response = await fetch(`${API_BASE_URL}/v1/matches/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        return NextResponse.json({ 
          success: false, 
          error: 'Match not found' 
        }, { status: 404 });
      }
      throw new Error(errorData.error || `API call failed: ${response.status} ${response.statusText}`);
    }
    
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