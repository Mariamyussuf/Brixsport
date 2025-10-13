import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

// Secret key for JWT verification - in production, use environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'admin_secret_key_for_development'
);

// In-memory storage for admins (in production, this would be a database)
let admins = [
  {
    id: '1',
    name: process.env.NEXT_PUBLIC_ADMIN_DEFAULT_NAME || 'John Admin',
    email: process.env.NEXT_PUBLIC_ADMIN_DEFAULT_EMAIL || 'john.admin@example.com',
    password: process.env.NEXT_PUBLIC_ADMIN_DEFAULT_HASHED_PASSWORD || 'hashed_admin_password_123', // In production, use proper password hashing
    role: 'admin',
    managedLoggers: ['logger1', 'logger2'],
    adminLevel: 'basic',
    permissions: ['manage_loggers', 'view_reports'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    name: process.env.NEXT_PUBLIC_ADMIN_SUPER_NAME || 'Sarah SuperAdmin',
    email: process.env.NEXT_PUBLIC_ADMIN_SUPER_EMAIL || 'sarah.super@example.com',
    password: process.env.NEXT_PUBLIC_ADMIN_SUPER_HASHED_PASSWORD || 'hashed_superadmin_password_123', // In production, use proper password hashing
    role: 'super-admin',
    managedLoggers: [],
    adminLevel: 'super',
    permissions: ['*'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper function to hash passwords (in production, use bcrypt or similar)
function hashPassword(password: string): string {
  // This is a placeholder - in production, use proper password hashing
  return `hashed_${password}`;
}

// Helper function to verify passwords (in production, use bcrypt or similar)
function verifyPassword(password: string, hash: string): boolean {
  // This is a placeholder - in production, use proper password verification
  return hash === `hashed_${password}`;
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
    
    // Find admin by email
    const admin = admins.find(a => a.email === body.email);
    if (!admin) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }
    
    // Verify password
    const passwordValid = verifyPassword(body.password, admin.password);
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