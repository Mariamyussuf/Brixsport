import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission, canManageLogger } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService } from '@/lib/databaseService';
import bcrypt from 'bcrypt';
// Import the email service
import { emailService } from '../../../../../brixsport-backend/apps/api/src/services/email.service';

// POST /api/admin/loggers/with-credentials - Create a new logger with credentials
export async function POST(request: NextRequest) {
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
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, email, and password are required' 
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
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(body.password, saltRounds);
    
    // Create new logger in database with hashed password
    const newLogger = await dbService.createLoggerWithCredentials({
      name: body.name,
      email: body.email,
      password: hashedPassword, // Store the hashed password
      role: body.role || 'logger',
      status: body.status || 'inactive',
      assignedCompetitions: body.assignedCompetitions || [],
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    });
    
    // Send credentials to the logger via secure email
    try {
      await emailService.sendLoggerCredentials(
        body.email,
        body.name,
        body.password // Send the original password (before hashing) to the logger
      );
    } catch (emailError) {
      console.error('Failed to send credentials email:', emailError);
      // We don't want to fail the entire operation if email sending fails
      // The admin can still see the credentials in the modal
    }
    
    // Remove password from response for security (casting to any to bypass type checking)
    const loggerWithoutPassword = { ...newLogger };
    delete (loggerWithoutPassword as any).password;
    
    return NextResponse.json({ 
      success: true, 
      data: loggerWithoutPassword
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating logger with credentials:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create logger with credentials' 
    }, { status: 500 });
  }
}