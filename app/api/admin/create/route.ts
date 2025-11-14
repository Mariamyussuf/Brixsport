import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/adminAuthService';
import { authenticateAdmin, requireSuperAdmin } from '@/middleware/adminAuth';
import { supabase } from '@/lib/supabaseClient';

// POST /api/admin/create - Create new admin (super admin only)
export async function POST(req: Request) {
  try {
    // Check super admin authorization
    const authCheck = await requireSuperAdmin(req);
    if (authCheck) return authCheck;
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.email || !body.name || !body.password) {
      return NextResponse.json({
        success: false,
        error: 'Email, name, and password are required',
      }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
      }, { status: 400 });
    }
    
    // Validate password strength
    if (body.password.length < 12) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 12 characters long',
      }, { status: 400 });
    }
    
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(body.password)) {
      return NextResponse.json({
        success: false,
        error: 'Password must contain uppercase, lowercase, number, and special character',
      }, { status: 400 });
    }
    
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('Admin')
      .select('id')
      .eq('email', body.email)
      .single();
    
    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin with this email already exists',
      }, { status: 409 });
    }
    
    // Hash password
    const passwordHash = await adminAuthService.hashPassword(body.password);
    
    // Determine role and admin level
    const role = body.role || 'admin';
    const adminLevel = role === 'super-admin' ? 'super' : 'basic';
    
    // Set default permissions based on role
    let permissions: string[] = [];
    if (role === 'super-admin') {
      permissions = ['*'];
    } else if (body.permissions && Array.isArray(body.permissions)) {
      permissions = body.permissions;
    } else {
      // Default admin permissions
      permissions = [
        'admin.view',
        'users.view',
        'loggers.view',
        'matches.view',
        'matches.edit',
        'competitions.view',
        'analytics.view',
      ];
    }
    
    // Get authenticated admin (creator)
    const authResult = await authenticateAdmin(req);
    const creatorId = authResult.admin?.id;
    
    // Create admin
    const { data: newAdmin, error } = await supabase
      .from('Admin')
      .insert({
        email: body.email,
        name: body.name,
        password_hash: passwordHash,
        role,
        admin_level: adminLevel,
        permissions,
        is_active: true,
        created_by: creatorId,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating admin:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create admin',
      }, { status: 500 });
    }
    
    // Log audit event
    await adminAuthService.logAuditEvent(
      creatorId || null,
      'admin_created',
      { newAdminId: newAdmin.id, email: newAdmin.email },
      'high',
      'success',
      req
    );
    
    // Return sanitized admin data
    const sanitizedAdmin = adminAuthService.sanitizeAdmin(newAdmin);
    
    return NextResponse.json({
      success: true,
      data: sanitizedAdmin,
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create admin',
    }, { status: 500 });
  }
}
