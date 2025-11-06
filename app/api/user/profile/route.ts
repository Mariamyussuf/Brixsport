import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

// GET /api/user/profile - Get current user profile
export async function GET(request: Request) {
  try {
    // Get the authentication session
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user profile from Supabase
    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, email, role, createdAt, updatedAt')
      .eq('id', session.user.id)
      .single();
    
    if (error || !user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/user/profile - Update current user profile
export async function PATCH(request: Request) {
  try {
    // Get the authentication session
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate that we're not trying to change sensitive fields
    if (body.id || body.email) {
      return NextResponse.json({ message: 'Cannot change ID or email' }, { status: 400 });
    }
    
    // Update user profile in Supabase
    const { data: updatedUser, error } = await supabase
      .from('User')
      .update({
        ...body,
        updatedAt: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select('id, name, email, role, createdAt, updatedAt')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      throw new Error(`Database error: ${error.message}`);
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}