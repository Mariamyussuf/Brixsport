import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { io } from 'socket.io-client';

// POST /api/logger/matches/[id]/broadcast - Broadcast event to WebSocket server
export async function POST(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: matchId } = await params as { id: string };

    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user is a logger
    if (session.user.role !== 'logger') {
      return NextResponse.json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Only loggers can broadcast events' 
        } 
      }, { status: 403 });
    }

    const { event } = await req.json();

    // Connect to WebSocket server
    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001');
    
    // Wait for connection
    await new Promise((resolve) => {
      if (socket.connected) {
        resolve(null);
      } else {
        socket.on('connect', resolve);
      }
    });
    
    // Broadcast event to all users in match room
    socket.emit('match:event', {
      matchId,
      ...event
    });
    
    // Disconnect
    socket.disconnect();

    return NextResponse.json({
      success: true,
      message: 'Event broadcast successfully'
    });
  } catch (error) {
    console.error('Error broadcasting event:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while broadcasting event' 
      } 
    }, { status: 500 });
  }
}