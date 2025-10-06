import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/admin/logout - Admin logout
export async function POST(request: Request) {
  try {
    // Clear admin token cookie with domain-specific settings
    const cookieStore = await cookies();
    const host = request.headers.get('host') || '';
    
    // Determine the domain for the cookie
    let cookieDomain = undefined;
    if (process.env.NODE_ENV === 'production') {
      // For production, set domain to admin subdomain
      if (host.includes('brixsport.vercel.app')) {
        cookieDomain = '.brixsport.vercel.app';
      } else if (host.includes('brixsports.com')) {
        cookieDomain = '.brixsports.com';
      }
    }
    
    cookieStore.delete('admin_token');
    
    // Return response with redirect URL based on domain
    let redirectUrl = '/admin/login';
    if (process.env.NODE_ENV === 'production') {
      if (host.includes('brixsport.vercel.app')) {
        redirectUrl = 'https://admin.brixsport.vercel.app/admin/login';
      } else if (host.includes('brixsports.com')) {
        redirectUrl = 'https://admin.brixsports.com/admin/login';
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Logged out successfully',
      redirectUrl
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Logout failed' 
    }, { status: 500 });
  }
}