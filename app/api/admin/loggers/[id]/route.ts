import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission, canManageLogger } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// PUT /api/admin/loggers/:id - Update a logger
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

    // Check if admin has permission to manage loggers
    if (!hasAdminPermission(adminUser, 'manage_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { id } = await params;
    
    // Check if admin can manage this specific logger
    if (adminUser.adminLevel !== 'super' && !canManageLogger(adminUser, id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }
    
    // Update logger in database
    const updatedLogger = await dbService.updateLogger(id, body);
    
    if (!updatedLogger) {
      return NextResponse.json({ 
        success: false, 
        error: 'Logger not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: updatedLogger 
    });
  } catch (error) {
    console.error('Error updating logger:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update logger' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/loggers/:id - Delete a logger
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

    // Check if admin has permission to manage loggers
    if (!hasAdminPermission(adminUser, 'manage_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const { id } = await params;
    
    // Check if admin can manage this specific logger
    if (adminUser.adminLevel !== 'super' && !canManageLogger(adminUser, id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }
    
    // Delete logger from database
    const deletedLogger = await dbService.deleteLogger(id);
    
    if (!deletedLogger) {
      return NextResponse.json({ 
        success: false, 
        error: 'Logger not found' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Logger deleted successfully',
      data: deletedLogger
    });
  } catch (error) {
    console.error('Error deleting logger:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete logger' 
    }, { status: 500 });
  }
}