import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/adminAuthService';
import { cookies } from 'next/headers';

// POST /api/admin/refresh - Refresh access token
export async function POST(req: Request) {
  try {
    // Get refresh token from cookie
    const cookieStore = await cookies();
    const refreshTokenCookie = cookieStore.get('admin_refresh_token');
    
    if (!refreshTokenCookie?.value) {
      return NextResponse.json({ 
        success: false, 
        error: 'No refresh token provided' 
      }, { status: 401 });
    }
    
    // Refresh the access token
    const result = await adminAuthService.refreshAccessToken(refreshTokenCookie.value);
    
    if (!result.success) {
      // Clear invalid cookie
      const response = NextResponse.json(result, { status: 401 });
      response.cookies.delete('admin_refresh_token');
      return response;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        admin: result.data?.admin,
        token: result.data?.token,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Token refresh failed' 
    }, { status: 500 });
  }
}
