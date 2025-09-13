import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '../../../src/lib/auth';
import { dbService } from '@/lib/databaseService';

// Logger API route - only accessible from logger.brixsports.com
export async function GET(request: NextRequest) {
  const host = request.headers.get('host');
  
  // Only allow access from logger domain
  const allowedHosts = [
    process.env.NEXT_PUBLIC_LOGGER_DOMAIN || 'logger.brixsports.com', 
    process.env.NEXT_PUBLIC_LOGGER_VERCEL_DOMAIN || 'logger.brixsport.vercel.app', 
    process.env.NEXT_PUBLIC_MAIN_VERCEL_DOMAIN || 'brixsport.vercel.app'
  ];
  if (!allowedHosts.includes(host || '') && !host?.includes('localhost')) {
    return NextResponse.json(
      { error: 'Unauthorized access' },
      { status: 403 }
    );
  }
  
  const session = await getAuth(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  if (!session.user.role.startsWith('logger') && session.user.role !== 'admin' && session.user.role !== 'super-admin') {
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

async function saveLoggerData(data: any, userId: string) {
  
  try {
    // Example of what this might look like with a real database:
     await dbService.saveMatchEvents(data.matchEvents, userId);
     await dbService.updateMatchScores(data.matchScores, userId);
     await dbService.logUserActivity(userId, 'data_submitted', data);
    
    // For now, we'll just log that we received the data
    console.log('Logger data saved for user:', userId, data);
    return { success: true, message: 'Data saved successfully' };
  } catch (error) {
    console.error('Error saving logger data:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const host = request.headers.get('host');
  
  // Only allow access from logger domain
  const allowedHosts = [
    process.env.NEXT_PUBLIC_LOGGER_DOMAIN || 'logger.brixsports.com', 
    process.env.NEXT_PUBLIC_LOGGER_VERCEL_DOMAIN || 'logger.brixsport.vercel.app', 
    process.env.NEXT_PUBLIC_MAIN_VERCEL_DOMAIN || 'brixsport.vercel.app'
  ];
  if (!allowedHosts.includes(host || '') && !host?.includes('localhost')) {
    return NextResponse.json(
      { error: 'Unauthorized access' },
      { status: 403 }
    );
  }
  
  const session = await getAuth(request);
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  if (!session.user.role.startsWith('logger') && session.user.role !== 'admin' && session.user.role !== 'super-admin') {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }
  
  try {
    // Process logger data
    const data = await request.json();
    
    // Save the data to the database
    const result = await saveLoggerData(data, session.user.id);
    
    return NextResponse.json({
      message: 'Logger data saved successfully',
      data,
      user: session.user,
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error('Error processing logger data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process logger data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}