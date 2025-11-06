import { NextResponse } from 'next/server';
import { verifyUnifiedToken } from '@/lib/authService';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    // Extract token from cookies
    const cookieHeader = request.headers.get('cookie');
    const token = cookieHeader
      ?.split(';')
      .find(c => c.trim().startsWith('auth-token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify token directly
    const user = await verifyUnifiedToken(token);
    
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get fresh user data from Supabase
    const { data: userData, error } = await supabase
      .from('User')
      .select('id, name, email, role, createdAt, updatedAt')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Return the authenticated user data
    return NextResponse.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}