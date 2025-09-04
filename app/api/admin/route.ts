import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT } from 'jose';

// Secret key for JWT verification - in production, use environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin_secret_key_for_development'
);

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

// Helper function to verify passwords (in production, use bcrypt or similar)
function verifyPassword(password: string, hash: string): boolean {
  // This is a placeholder - in production, use proper password verification
  return hash === `hashed_${password}`;
}

// GET /api/admin - Get all admins
export async function GET(request: Request) {
  try {
    // Verify admin token
    const token = cookies().get('admin_token')?.value;
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

    // Only super admins can see all admins
    if (adminUser.adminLevel !== 'super') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    // Return admins without passwords
    const adminsWithoutPasswords = admins.map(({ password, ...admin }) => admin);
    
    return NextResponse.json({ 
      success: true, 
      data: adminsWithoutPasswords 
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch admins' 
    }, { status: 500 });
  }
}

// POST /api/admin - Create a new admin
export async function POST(request: Request) {
  try {
    // Verify admin token
    const token = cookies().get('admin_token')?.value;
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

    // Only super admins can create new admins
    if (adminUser.adminLevel !== 'super') {
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
    
    // Check if admin already exists
    const existingAdmin = admins.find(admin => admin.email === body.email);
    if (existingAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin with this email already exists' 
      }, { status: 400 });
    }
    
    // Create new admin
    const newAdmin = {
      id: `${admins.length + 1}`,
      name: body.name,
      email: body.email,
      password: hashPassword(body.password),
      role: body.role || 'admin',
      managedLoggers: body.managedLoggers || [],
      adminLevel: body.adminLevel || 'basic',
      permissions: body.permissions || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    admins.push(newAdmin);
    
    // Return admin without password
    const { password, ...adminWithoutPassword } = newAdmin;
    
    return NextResponse.json({ 
      success: true, 
      data: adminWithoutPassword 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create admin' 
    }, { status: 500 });
  }
}

// PUT /api/admin/:id - Update an admin
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin token
    const token = cookies().get('admin_token')?.value;
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
    const { id } = await params;
    
    // Find admin to update
    const adminIndex = admins.findIndex(admin => admin.id === id);
    if (adminIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin not found' 
      }, { status: 404 });
    }
    
    // Check permissions - super admins can update anyone, regular admins can only update themselves
    if (adminUser.adminLevel !== 'super' && adminUser.id !== id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }
    
    // Prevent non-super admins from changing admin levels or permissions
    if (adminUser.adminLevel !== 'super') {
      delete body.adminLevel;
      delete body.permissions;
      delete body.role;
    }
    
    // Update admin
    admins[adminIndex] = {
      ...admins[adminIndex],
      ...body,
      password: body.password ? hashPassword(body.password) : admins[adminIndex].password,
      updatedAt: new Date().toISOString()
    };
    
    // Return admin without password
    const { password, ...adminWithoutPassword } = admins[adminIndex];
    
    return NextResponse.json({ 
      success: true, 
      data: adminWithoutPassword 
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update admin' 
    }, { status: 500 });
  }
}

// DELETE /api/admin/:id - Delete an admin
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify admin token
    const token = cookies().get('admin_token')?.value;
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

    // Only super admins can delete admins
    if (adminUser.adminLevel !== 'super') {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }
    
    const { id } = await params;
    
    // Prevent admins from deleting themselves
    if (adminUser.id === id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot delete yourself' 
      }, { status: 400 });
    }
    
    // Find admin to delete
    const adminIndex = admins.findIndex(admin => admin.id === id);
    if (adminIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin not found' 
      }, { status: 404 });
    }
    
    // Remove admin
    admins.splice(adminIndex, 1);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete admin' 
    }, { status: 500 });
  }
}