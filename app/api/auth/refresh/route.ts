import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyUnifiedToken, generateUnifiedToken } from '@/lib/authService';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    // In this implementation, we'll simplify by just verifying the existing token
    // and generating a new one since we're not using refresh tokens in the same way
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      const response = NextResponse.json(
        { success: false, error: { message: 'No token provided' } },
        { status: 401 }
      );
      
      response.cookies.delete('auth-token');
      return response;
    }

    try {
      // Verify the existing token
      const user = await verifyUnifiedToken(token);
      
      if (!user) {
        const response = NextResponse.json(
          { success: false, error: { message: 'Invalid token' } },
          { status: 401 }
        );
        
        response.cookies.delete('auth-token');
        return response;
      }

      // Check if user still exists in database
      const { data: existingUser, error } = await supabase
        .from('User')
        .select('id, name, email, role')
        .eq('id', user.id)
        .single();

      if (error || !existingUser) {
        const response = NextResponse.json(
          { success: false, error: { message: 'User not found' } },
          { status: 401 }
        );
        
        response.cookies.delete('auth-token');
        return response;
      }

      // Generate new token
      const newToken = await generateUnifiedToken({
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role as any
      });

      // Set new cookie for authentication
      const response = NextResponse.json({
        success: true,
        data: {
          user: existingUser,
          token: newToken
        }
      }, { status: 200 });

      // Set new auth cookie
      response.cookies.set('auth-token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60, // 1 hour
        path: '/',
      });

      return response;
    } catch (error) {
      console.error('Token verification error:', error);
      
      const response = NextResponse.json(
        { success: false, error: { message: 'Invalid token' } },
        { status: 401 }
      );
      
      response.cookies.delete('auth-token');
      return response;
    }
  } catch (error) {
    console.error('Refresh API error:', error);
    
    const response = NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
    
    response.cookies.delete('auth-token');
    return response;
  }
}