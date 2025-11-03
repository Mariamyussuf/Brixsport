import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

// Secret key for JWT verification - use environment variables
const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);

// Fetch admins from database
import { dbService } from '@/lib/databaseService';

let adminsCache: any[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to hash passwords
import bcrypt from 'bcrypt';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Helper function to verify passwords
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// POST /api/admin/login - Admin login
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
    
    // Fetch admins from database if cache is invalid
    if (!adminsCache || !cacheTimestamp || (Date.now() - cacheTimestamp) > CACHE_DURATION) {
      // Fetch all users and filter for admins
      const allUsers = await dbService.getUsers();
      adminsCache = allUsers.filter(user => user.role === 'admin' || user.role === 'super-admin');
      cacheTimestamp = Date.now();
    }
    
    // Find admin by email
    const admin = adminsCache.find(a => a.email === body.email);
    if (!admin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }
    
    // Verify password
    const passwordValid = await verifyPassword(body.password, admin.password);
    if (!passwordValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }
    
    // Generate JWT token
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 60 * 60; // 1 hour expiration
    
    const token = await new SignJWT({ 
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      managedLoggers: admin.managedLoggers,
      adminLevel: admin.adminLevel,
      permissions: admin.permissions
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .sign(JWT_SECRET);
    
    // Set cookie with token and domain-specific settings
    const cookieStore = await cookies();
    const host = req.headers.get('host') || '';
    
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
    
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
      sameSite: 'lax',
      domain: cookieDomain,
    });
    
    // Return admin without password
    const { password: _, ...adminWithoutPassword } = admin;
    
    return NextResponse.json({ 
      success: true, 
      data: adminWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Login failed' 
    }, { status: 500 });
  }
}