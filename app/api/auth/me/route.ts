import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { headers } = request;
  const authHeader = headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  // In a real application, you would verify the token against your authentication service
  // For now, we'll just check if the token exists
  if (token) {
    // Replace with actual user data from your database or authentication service
    const user = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      image: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    };
    return NextResponse.json(user);
  } else {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}
