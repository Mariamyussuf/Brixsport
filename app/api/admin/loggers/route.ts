import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission, canManageLogger } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// GET /api/admin/loggers - Get all loggers
export async function GET(request: Request) {
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

    // Fetch loggers from database
    let loggers = await dbService.getAllLoggers();
    
    // Filter loggers based on admin permissions
    if (adminUser.adminLevel !== 'super') {
      // Regular admins can only see loggers they manage
      loggers = loggers.filter(logger => 
        canManageLogger(adminUser, logger.id)
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: loggers 
    });
  } catch (error) {
    console.error('Error fetching loggers:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch loggers' 
    }, { status: 500 });
  }
}

// POST /api/admin/loggers - Create a new logger
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

    // Check if admin has permission to manage loggers
    if (!hasAdminPermission(adminUser, 'manage_loggers')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name and email are required' 
      }, { status: 400 });
    }
    
    // Check if logger already exists
    const existingLogger = await dbService.getLoggerByEmail(body.email);
    if (existingLogger) {
      return NextResponse.json({ 
        success: false, 
        error: 'Logger with this email already exists' 
      }, { status: 400 });
    }
    
    // Create new logger in database
    const newLogger = await dbService.createLogger({
      name: body.name,
      email: body.email,
      role: 'logger',
      status: body.status || 'inactive',
      assignedCompetitions: body.assignedCompetitions || [],
    });
    
    return NextResponse.json({ 
      success: true, 
      data: newLogger 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating logger:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create logger' 
    }, { status: 500 });
  }
}

// PUT /api/admin/loggers/:id - Update a logger
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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