import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';
import { NotificationService } from '@/services/notificationService';

// GET /api/admin/assign-logger/:id - Get a specific assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check permissions
    if (!hasAdminPermission(adminUser, 'manage_loggers') && !hasAdminPermission(adminUser, 'view_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const { id } = await params;
    
    // Fetch assignment
    const assignment = await dbService.getLoggerAssignmentById(id);
    
    if (!assignment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Assignment not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: assignment
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch assignment' 
    }, { status: 500 });
  }
}

// PUT /api/admin/assign-logger/:id - Update an assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check permissions
    if (!hasAdminPermission(adminUser, 'manage_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Insufficient permissions to update assignments' 
      }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes } = body;
    
    // Validate input
    if (status && !['active', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid status. Must be one of: active, completed, cancelled' 
      }, { status: 400 });
    }
    
    // Update assignment
    const updates: any = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    
    const updatedAssignment = await dbService.updateLoggerAssignment(id, updates);
    
    if (!updatedAssignment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Assignment not found' 
      }, { status: 404 });
    }
    
    // Log the admin action
    await dbService.logUserActivity(
      adminUser.id,
      'logger_assignment_updated',
      {
        assignmentId: id,
        updates
      }
    );
    
    // Send notification if status changed to cancelled
    if (status === 'cancelled' && updatedAssignment.logger_id) {
      try {
        await NotificationService.createNotification({
          userId: updatedAssignment.logger_id,
          type: 'ADMIN_NOTICE',
          title: 'Assignment Cancelled',
          message: 'One of your assignments has been cancelled by an administrator.',
          priority: 'NORMAL',
          source: 'SYSTEM'
        });
      } catch (notificationError) {
        console.error('Error sending cancellation notification:', notificationError);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedAssignment,
      message: 'Assignment updated successfully'
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update assignment' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/assign-logger/:id - Unassign a logger (delete assignment)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check permissions
    if (!hasAdminPermission(adminUser, 'manage_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: Insufficient permissions to delete assignments' 
      }, { status: 403 });
    }

    const { id } = await params;
    
    // Get assignment details before deleting (for notification)
    const assignment = await dbService.getLoggerAssignmentById(id);
    
    if (!assignment) {
      return NextResponse.json({ 
        success: false, 
        error: 'Assignment not found' 
      }, { status: 404 });
    }
    
    // Delete the assignment
    const deleted = await dbService.deleteLoggerAssignment(id);
    
    if (!deleted) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete assignment' 
      }, { status: 500 });
    }
    
    // Send notification to logger
    if (assignment.logger_id && assignment.status === 'active') {
      try {
        await NotificationService.createNotification({
          userId: assignment.logger_id,
          type: 'ADMIN_NOTICE',
          title: 'Assignment Removed',
          message: 'You have been unassigned from a competition/match by an administrator.',
          priority: 'NORMAL',
          source: 'SYSTEM'
        });
      } catch (notificationError) {
        console.error('Error sending unassignment notification:', notificationError);
      }
    }
    
    // Log the admin action
    await dbService.logUserActivity(
      adminUser.id,
      'logger_unassigned',
      {
        assignmentId: id,
        loggerId: assignment.logger_id,
        competitionId: assignment.competition_id,
        matchId: assignment.match_id
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'Logger unassigned successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete assignment' 
    }, { status: 500 });
  }
}
