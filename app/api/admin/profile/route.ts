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

// GET /api/admin/profile - Get admin profile
export async function GET(request: Request) {
  try {
    // In a real implementation, you would verify the admin token
    // const token = cookies().get('token')?.value;
    // const adminUser = await verifyAdminToken(token);
    // 
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // For demo purposes, return the first admin
    const adminUser = mockAdmins[0];
    
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
    // In a real implementation, you would verify the admin token
    // const token = cookies().get('token')?.value;
    // const adminUser = await verifyAdminToken(token);
    // 
    // if (!adminUser) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    const body = await request.json();
    
    // For demo purposes, update the first admin
    const adminIndex = 0;
    
    // Update admin profile
    mockAdmins[adminIndex] = {
      ...mockAdmins[adminIndex],
      ...body
    };
    
    return NextResponse.json({ 
      success: true, 
      data: mockAdmins[adminIndex] 
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update admin profile' 
    }, { status: 500 });
  }
}