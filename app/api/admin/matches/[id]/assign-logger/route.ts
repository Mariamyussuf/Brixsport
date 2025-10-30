import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

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
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        success: false, 
        error: 'Valid match ID is required' 
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
    const logger = await dbService.getLoggerById(loggerId);
    if (!logger) {
      return NextResponse.json({ 
        success: false, 
        error: 'Logger not found' 
      }, { status: 404 });
    }
    
    // Check if the match exists
    // Make API call to get match
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
    const adminToken = (await cookies()).get('admin_token')?.value;
    
    const matchResponse = await fetch(`${API_BASE_URL}/v1/matches/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (!matchResponse.ok) {
      if (matchResponse.status === 404) {
        return NextResponse.json({ 
          success: false, 
          error: 'Match not found' 
        }, { status: 404 });
      }
      throw new Error(`Failed to fetch match: ${matchResponse.status} ${matchResponse.statusText}`);
    }
    
    // Assign the logger to the match
    // In a real implementation, you would update the match record in the database
    // to include the loggerId field
    const updateResponse = await fetch(`${API_BASE_URL}/v1/matches/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ loggerId })
    });
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json().catch(() => ({}));
      if (updateResponse.status === 401) {
        return NextResponse.json({ 
          success: false, 
          error: 'Unauthorized' 
        }, { status: 401 });
      }
      if (updateResponse.status === 403) {
        return NextResponse.json({ 
          success: false, 
          error: 'Forbidden' 
        }, { status: 403 });
      }
      if (updateResponse.status === 404) {
        return NextResponse.json({ 
          success: false, 
          error: 'Match not found' 
        }, { status: 404 });
      }
      throw new Error(errorData.error || `Failed to assign logger to match: ${updateResponse.status} ${updateResponse.statusText}`);
    }
    
    const result = await updateResponse.json();
    
    return NextResponse.json({ 
      success: true, 
      data: result.data,
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