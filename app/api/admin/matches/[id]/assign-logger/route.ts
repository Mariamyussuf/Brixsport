import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

// POST /api/admin/matches/:id/assign-logger - Assign a logger to a match
export async function POST(request: Request, { params }: { params: Promise<{}> }) {
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
    const { loggerId } = body;
    
    // Validate match ID
    const matchId = parseInt(id, 10);
    if (isNaN(matchId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid match ID' 
      }, { status: 400 });
    }
    
    // Validate logger ID
    if (!loggerId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Logger ID is required' 
      }, { status: 400 });
    }
    
    // Check if the logger exists
    const { data: logger, error: loggerError } = await supabase
      .from('Logger')
      .select('id, name')
      .eq('id', loggerId)
      .single();
    
    if (loggerError || !logger) {
      return NextResponse.json({ 
        success: false, 
        error: 'Logger not found' 
      }, { status: 404 });
    }
    
    // Check if the match exists
    const { data: match, error: matchError } = await supabase
      .from('Match')
      .select('id')
      .eq('id', matchId)
      .single();
    
    if (matchError || !match) {
      return NextResponse.json({ 
        success: false, 
        error: 'Match not found' 
      }, { status: 404 });
    }
    
    // Assign the logger to the match
    const { data: updatedMatch, error: updateError } = await supabase
      .from('Match')
      .update({ loggerId })
      .eq('id', matchId)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to assign logger to match: ${updateError.message}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedMatch,
      message: `Logger ${logger.name} assigned to match successfully`
    });
  } catch (error) {
    console.error('Error assigning logger to match:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to assign logger to match' 
    }, { status: 500 });
  }
}