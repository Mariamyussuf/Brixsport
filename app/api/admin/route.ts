import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { cookies } from 'next/headers';

// Mock data for demonstration
let mockAdmins = [
  {
    id: '1',
    name: 'John Admin',
    email: 'john.admin@example.com',
    role: 'admin',
    managedLoggers: ['logger1', 'logger2'],
    adminLevel: 'basic',
    permissions: ['manage_loggers', 'view_reports']
  },
  {
    id: '2',
    name: 'Sarah SuperAdmin',
    email: 'sarah.super@example.com',
    role: 'super-admin',
    managedLoggers: [],
    adminLevel: 'super',
    permissions: ['*']
  }
];

// GET /api/admin - Get all admins
export async function GET(request: Request) {
  try {
    // In a real implementation, you would verify the admin token
    // const token = cookies().get('token')?.value;
    // const adminUser = await verifyAdminToken(token);
    // 
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Return mock data
    return NextResponse.json({ 
      success: true, 
      data: mockAdmins 
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
    // In a real implementation, you would verify the admin token
    // const token = cookies().get('token')?.value;
    // const adminUser = await verifyAdminToken(token);
    // 
    // if (!adminUser || adminUser.adminLevel !== 'super') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, email, and password are required' 
      }, { status: 400 });
    }
    
    // Check if admin already exists
    const existingAdmin = mockAdmins.find(admin => admin.email === body.email);
    if (existingAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin with this email already exists' 
      }, { status: 400 });
    }
    
    // Create new admin
    const newAdmin = {
      id: `${mockAdmins.length + 1}`,
      name: body.name,
      email: body.email,
      role: body.role || 'admin',
      managedLoggers: body.managedLoggers || [],
      adminLevel: body.adminLevel || 'basic',
      permissions: body.permissions || []
    };
    
    mockAdmins.push(newAdmin);
    
    return NextResponse.json({ 
      success: true, 
      data: newAdmin 
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
    // In a real implementation, you would verify the admin token
    // const token = cookies().get('token')?.value;
    // const adminUser = await verifyAdminToken(token);
    // 
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const body = await request.json();
    const { id } = await params;
    
    // Find admin to update
    const adminIndex = mockAdmins.findIndex(admin => admin.id === id);
    if (adminIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin not found' 
      }, { status: 404 });
    }
    
    // Update admin
    mockAdmins[adminIndex] = {
      ...mockAdmins[adminIndex],
      ...body
    };
    
    return NextResponse.json({ 
      success: true, 
      data: mockAdmins[adminIndex] 
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
    // In a real implementation, you would verify the admin token
    // const token = cookies().get('token')?.value;
    // const adminUser = await verifyAdminToken(token);
    // 
    // if (!adminUser || adminUser.adminLevel !== 'super') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const { id } = await params;
    
    // Find admin to delete
    const adminIndex = mockAdmins.findIndex(admin => admin.id === id);
    if (adminIndex === -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin not found' 
      }, { status: 404 });
    }
    
    // Remove admin
    mockAdmins.splice(adminIndex, 1);
    
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