import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';

// Simple cookie parser from header
function getCookieFromHeader(name: string, cookieHeader: string | null): string | undefined {
  if (!cookieHeader) return undefined;
  const cookies = cookieHeader.split(';');
  for (const c of cookies) {
    const [k, ...rest] = c.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

// In-memory storage for admins (in production, this would be a database)
let admins = [
  {
    id: '1',
    name: 'John Admin',
    email: 'john.admin@example.com',
    password: '$2a$10$abcdefghijklmnopqrstuvwx hashed password', // In production, use proper password hashing
    role: 'admin',
    managedLoggers: ['logger1', 'logger2'],
    adminLevel: 'basic',
    permissions: ['manage_loggers', 'view_reports'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Sarah SuperAdmin',
    email: 'sarah.super@example.com',
    password: '$2a$10$abcdefghijklmnopqrstuvwx hashed password', // In production, use proper password hashing
    role: 'super-admin',
    managedLoggers: [],
    adminLevel: 'super',
    permissions: ['*'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper function to hash passwords (in production, use bcrypt or similar)
function hashPassword(password: string): string {
  // This is a placeholder - in production, use proper password hashing
  return `hashed_${password}`;
}

// GET /api/admin/profile - Get admin profile
export async function GET(request: Request) {
  try {
    // Verify admin token
    const token = getCookieFromHeader('admin_token', request.headers.get('cookie'));

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

    // Return admin profile (password is not included in the token for security)
    return NextResponse.json({ 
      success: true, 
      data: adminUser 
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch admin profile' 
    }, { status: 500 });
  }
}

// PUT /api/admin/profile - Update admin profile
export async function PUT(request: Request) {
  try {
    // Verify admin token
    const token = getCookieFromHeader('admin_token', request.headers.get('cookie'));
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

    const body = await request.json();
    
    // Find admin to update
    const adminIndex = admins.findIndex(admin => admin.id === adminUser.id);
    if (adminIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin not found' 
      }, { status: 404 });
    }
    
    // Update admin profile (prevent changing admin level and permissions)
    const updates: any = { ...body };
    delete updates.adminLevel;
    delete updates.permissions;
    delete updates.role;
    
    // If password is being updated, hash it
    if (updates.password) {
      updates.password = hashPassword(updates.password);
    }
    
    admins[adminIndex] = {
      ...admins[adminIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Return updated admin without password
    const { password, ...adminWithoutPassword } = admins[adminIndex];
    
    return NextResponse.json({ 
      success: true, 
      data: adminWithoutPassword 
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update admin profile' 
    }, { status: 500 });
  }
}