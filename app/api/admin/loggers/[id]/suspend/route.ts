import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission, canManageLogger } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';

// POST /api/admin/loggers/:id/suspend - Suspend a logger
export async function POST(request: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id } = await params as { id: string };

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

    // Find logger to update
    const logger = await dbService.getLoggerById(id);
    if (!logger) {
      return NextResponse.json({ 
        success: false, 
        error: 'Logger not found' 
      }, { status: 404 });
    }

    // Check if admin can manage this specific logger
    if (adminUser.adminLevel !== 'super' && !canManageLogger(adminUser, id)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    // Update logger status
    const updatedLogger = await dbService.updateLogger(id, {
      status: 'suspended',
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedLogger,
      message: 'Logger suspended successfully'
    });
  } catch (error) {
    console.error('Error suspending logger:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to suspend logger' 
    }, { status: 500 });
  }
}