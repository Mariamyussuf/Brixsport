import { NextResponse } from 'next/server';
import { adminAuthService } from '@/lib/adminAuthService';

// POST /api/admin/enable-mfa - Enable MFA for admin account
export async function POST(req: Request) {
  try {
    // Get admin ID from auth token (you'll need to implement auth middleware)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const payload = await adminAuthService.verifyToken(token);
    
    if (!payload || !payload.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 });
    }
    
    // Enable MFA
    const mfaSetup = await adminAuthService.enableMfa(payload.id as string);
    
    if (!mfaSetup) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to enable MFA' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: mfaSetup,
    });
  } catch (error) {
    console.error('Enable MFA error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to enable MFA' 
    }, { status: 500 });
  }
}
