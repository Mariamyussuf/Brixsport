import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generateUnifiedToken } from '@/lib/authService';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Name, email, and password are required' } },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('User')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking existing user:', fetchError);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Database error occurred while checking user existence',
            code: 'DATABASE_ERROR'
          }
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'An account with this email already exists. Please use a different email or try logging in.',
            code: 'USER_EXISTS'
          }
        },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user in Supabase
    const { data: newUser, error: insertError } = await supabase
      .from('User')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: 'user', // Default role for new users
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Failed to create user account. Please try again later.',
            code: 'CREATE_USER_ERROR'
          }
        },
        { status: 500 }
      );
    }

    // Remove sensitive information
    const { password: _, ...publicUser } = newUser;

    // Generate authentication token
    const token = await generateUnifiedToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as any
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        user: publicUser,
        token
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration API error:', {
      message: error.message,
      stack: error.stack
    });
    
    // Return a user-friendly error message
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Service temporarily unavailable. Please try again later.',
          code: 'SERVER_ERROR'
        }
      },
      { status: 503 }
    );
  }
}