import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import MessagingService from '@/services/messagingService';

// POST /api/messages/read - Mark messages as read
export async function POST(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { conversationId } = await req.json();

    // Validate required fields
    if (!conversationId) {
      return NextResponse.json({ 
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Conversation ID is required' 
        } 
      }, { status: 400 });
    }

    const result = await MessagingService.markMessagesRead(
      session.user.id,
      conversationId
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Conversation not found' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while marking messages as read' 
      } 
    }, { status: 500 });
  }
}