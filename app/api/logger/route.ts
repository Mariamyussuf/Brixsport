import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '../../../src/lib/auth';

// Logger API route - only accessible from logger.brixsports.com
export async function GET(request: NextRequest) {
  const host = request.headers.get('host');
  
  // Only allow access from logger domain
  if (host !== 'logger.brixsports.com' && !host?.includes('localhost:3000')) {
    return NextResponse.json(
      { error: 'Unauthorized access' },
      { status: 403 }
    );
  }
  
  // Check authentication
  const session = await getAuth(request);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Check if user has logger role
  if (session.user.role !== 'logger') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }
  
  // Return logger data
  return NextResponse.json({
    message: 'Logger data accessed successfully',
    user: session.user,
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host');
  
  // Only allow access from logger domain
  if (host !== 'logger.brixsports.com' && !host?.includes('localhost:3000')) {
    return NextResponse.json(
      { error: 'Unauthorized access' },
      { status: 403 }
    );
  }
  
  // Check authentication
  const session = await getAuth(request);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  // Check if user has logger role
  if (session.user.role !== 'logger') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }
  
  // Process logger data
  const data = await request.json();
  
  // In a real implementation, you would save this data to your database
  // For now, we'll just return a success message
  return NextResponse.json({
    message: 'Logger data saved successfully',
    data,
    user: session.user,
    timestamp: new Date().toISOString()
  });
}