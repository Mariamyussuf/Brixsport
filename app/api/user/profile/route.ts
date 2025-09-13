import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';

// Mock user database - in a real application, this would be a real database
const users = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    image: 'https://example.com/avatar1.jpg',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'admin',
    image: 'https://example.com/avatar2.jpg',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z'
  }
];

// GET /api/user/profile - Get current user profile
export async function GET(request: Request) {
  try {
    // Get the authentication session
    const session = await getAuth(request);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Find the user in our mock database
    const user = users.find(u => u.id === session.user.id);
    
    if (!user) {
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
    
    // Find the user in our mock database
    const userIndex = users.findIndex(u => u.id === session.user.id);
    
    if (userIndex === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Update the user with the new data
    const updatedUser = {
      ...users[userIndex],
      ...body,
      id: users[userIndex].id, // Don't allow changing the ID
      email: users[userIndex].email, // Don't allow changing the email in this example
      updatedAt: new Date().toISOString()
    };
    
    // Update the user in our mock database
    users[userIndex] = updatedUser;
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}