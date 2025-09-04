import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/admin/logout - Admin logout
export async function POST(request: Request) {
  try {
    // Clear admin token cookie
    (await cookies()).delete('admin_token');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Logout failed' 
    }, { status: 500 });
  }
}