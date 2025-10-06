import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import MessagingService from '@/services/messagingService';

// POST /api/admin/messages/broadcast - Send broadcast message to all users or specific groups
export async function POST(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user has admin role (simplified check for now)
    // In a real implementation, you would check against your admin service
    if (session.user.role !== 'admin') {
      return NextResponse.json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions' 
        } 
      }, { status: 403 });
    }

    const { title, content, type, priority, recipients, scheduledAt, tags } = await req.json();

    // Validate required fields
    if (!title || !content || !type || !priority || !recipients) {
      return NextResponse.json({ 
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Title, content, type, priority, and recipients are required' 
        } 
      }, { status: 400 });
    }

    const result = await MessagingService.sendBroadcastMessage(
      session.user.id,
      {
        title,
        content,
        type,
        priority,
        recipients,
        scheduledAt,
        tags
      }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error sending broadcast message:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while sending the broadcast message' 
      } 
    }, { status: 500 });
  }
}