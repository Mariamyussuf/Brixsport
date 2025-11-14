import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/adminAuthService';

// POST /api/admin/password-reset - Request password reset
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    const result = await adminAuthService.requestPasswordReset(body.email);
    
    // Always return success to prevent email enumeration
    return NextResponse.json(result);
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process password reset request' 
    }, { status: 500 });
  }
}

// PUT /api/admin/password-reset - Reset password with token
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.token || !body.newPassword) {
      return NextResponse.json({ 
        success: false, 
        message: 'Reset token and new password are required' 
      }, { status: 400 });
    }
    
    const result = await adminAuthService.resetPassword(body.token, body.newPassword);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to reset password' 
    }, { status: 500 });
  }
}
