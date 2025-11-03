import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getUserById } from '@/lib/userService';

// GET /api/user/[id] - Get user by ID
export async function GET(request: Request, { params }: { params: Promise<{}> }) {
  try {
    // Get the authentication session
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params as { id: string };
    
    // Get user from database
    const user = await getUserById(id);
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        message: 'User not found' 
      }, { status: 404 });
    }
    
    // Remove sensitive information before returning
    const { password, ...publicUser } = user as any;
    
    return NextResponse.json({ 
      success: true,
      data: publicUser
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ 
      success: false,
      message: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}