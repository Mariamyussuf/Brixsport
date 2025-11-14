import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/adminAuthService';
import { cookies } from 'next/headers';

// POST /api/admin/logout - Logout admin and revoke tokens
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const refreshTokenCookie = cookieStore.get('admin_refresh_token');
    
    if (refreshTokenCookie?.value) {
      await adminAuthService.logout(refreshTokenCookie.value);
    }
    
    // Clear all admin cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
    
    response.cookies.delete('admin_refresh_token');
    response.cookies.delete('admin_token');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Logout failed' 
    }, { status: 500 });
  }
}
