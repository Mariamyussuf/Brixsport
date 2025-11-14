import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/adminAuthService';

// POST /api/admin/login - Admin login with MFA support
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 });
    }
    
    // Get device info from request
    const deviceInfo = {
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    };
    
    // Attempt login
    const result = await adminAuthService.login(
      body.email,
      body.password,
      deviceInfo
    );
    
    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }
    
    // If MFA is required, return MFA token
    if (result.data?.requiresMfa) {
      return NextResponse.json({
        success: true,
        data: {
          requiresMfa: true,
          mfaToken: result.data.mfaToken,
          admin: result.data.admin,
        },
      });
    }
    
    // Set cookie with refresh token (if provided)
    if (result.data?.refreshToken) {
      const response = NextResponse.json({
        success: true,
        data: {
          admin: result.data.admin,
          token: result.data.token,
        },
      });
      
      // Determine the domain for the cookie
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
    console.error('Admin login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Login failed' 
    }, { status: 500 });
  }
}