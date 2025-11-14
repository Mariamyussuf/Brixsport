import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission, canManageLogger } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';
import bcrypt from 'bcrypt';

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
    // Generate a temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);
    
    // Create new logger in database with credentials
    const newLogger = await dbService.createLoggerWithCredentials({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: 'logger',
      status: body.status || 'inactive',
      assignedCompetitions: body.assignedCompetitions || [],
      permissions: body.permissions || [],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
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