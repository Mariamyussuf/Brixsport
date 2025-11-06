import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';
import { supabase } from '@/lib/supabaseClient';

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
    
    // Validate match ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid match ID is required' 
      }, { status: 400 });
    }
    
    // Validate data types if provided
    if (body.competitionId && isNaN(parseInt(body.competitionId))) {
      return NextResponse.json({ 
        success: false, 
        error: 'Competition ID must be a valid number' 
      }, { status: 400 });
    }
    
    if (body.homeTeamId && isNaN(parseInt(body.homeTeamId))) {
      return NextResponse.json({ 
        success: false, 
        error: 'Home team ID must be a valid number' 
      }, { status: 400 });
    }
    
    if (body.awayTeamId && isNaN(parseInt(body.awayTeamId))) {
      return NextResponse.json({ 
        success: false, 
        error: 'Away team ID must be a valid number' 
      }, { status: 400 });
    }
    
    // Prepare update data
    const updateData: any = {};
    
    if (body.competitionId) updateData.competition_id = parseInt(body.competitionId);
    if (body.homeTeamId) updateData.home_team_id = parseInt(body.homeTeamId);
    if (body.awayTeamId) updateData.away_team_id = parseInt(body.awayTeamId);
    if (body.startTime) updateData.match_date = body.startTime;
    if (body.status) updateData.status = body.status;
    if (body.homeScore !== undefined) updateData.home_score = parseInt(body.homeScore) || 0;
    if (body.awayScore !== undefined) updateData.away_score = parseInt(body.awayScore) || 0;
    if (body.currentMinute !== undefined) updateData.current_minute = parseInt(body.currentMinute) || 0;
    if (body.period) updateData.period = body.period;
    if (body.venue) updateData.venue = body.venue;
    
    // Update match using Supabase directly since databaseService doesn't have an update method
    const { data, error } = await supabase
      .from('Match')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          error: 'Match not found' 
        }, { status: 404 });
      }
      throw new Error(`Database error: ${error.message}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      data 
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
    
    // Validate match ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid match ID is required' 
      }, { status: 400 });
    }
    
    // Delete match using Supabase directly
    const { error } = await supabase
      .from('Match')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          error: 'Match not found' 
        }, { status: 404 });
      }
      throw new Error(`Database error: ${error.message}`);
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