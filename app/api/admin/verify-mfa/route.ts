import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/adminAuthService';

// POST /api/admin/verify-mfa - Verify MFA code during login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.mfaToken || !body.code) {
      return NextResponse.json({ 
        success: false, 
        error: 'MFA token and code are required' 
      }, { status: 400 });
    }
    
    // Get device info from request
    const deviceInfo = {
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    };
    
    // Verify MFA code
    const result = await adminAuthService.verifyMfaCode(
      body.mfaToken,
      body.code,
      deviceInfo
    );
    
    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }
    
    // Set cookie with refresh token
    const response = NextResponse.json({
      success: true,
      data: {
        admin: result.data?.admin,
        token: result.data?.token,
      },
    });
    
    if (result.data?.refreshToken) {
      const host = req.headers.get('host') || '';
      let cookieDomain: string | undefined = undefined;
      
      if (process.env.NODE_ENV === 'production') {
        if (host.includes('brixsport.vercel.app')) {
          cookieDomain = '.brixsport.vercel.app';
        } else if (host.includes('brixsports.com')) {
          cookieDomain = '.brixsports.com';
        }
      }
      
      response.cookies.set('admin_refresh_token', result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
        sameSite: 'lax',
        domain: cookieDomain,
      });
    }
    
    return response;
  } catch (error) {
    console.error('MFA verification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'MFA verification failed' 
    }, { status: 500 });
  }
}
