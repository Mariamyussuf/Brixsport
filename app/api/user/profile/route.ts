import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';

// GET /api/user/profile - Get current user profile
export async function GET(request: Request) {
  try {
    // Get the authentication session
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Make API call to get user profile
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
    
    const response = await fetch(`${API_BASE_URL}/v1/users/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      if (response.status === 404) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      console.error('Error fetching user profile from backend:', errorData);
      throw new Error(errorData.error || `API call failed: ${response.status} ${response.statusText}`);
    }

    const user = await response.json();
    
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
    
    // Make API call to update user profile
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
    
    const response = await fetch(`${API_BASE_URL}/v1/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 400) {
        return NextResponse.json({ message: errorData.message || 'Invalid data provided' }, { status: 400 });
      }
      if (response.status === 401) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      if (response.status === 404) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      console.error('Error updating user profile in backend:', errorData);
      throw new Error(errorData.error || `API call failed: ${response.status} ${response.statusText}`);
    }

    const updatedUser = await response.json();
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}