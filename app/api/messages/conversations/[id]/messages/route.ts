import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import MessagingService from '@/services/messagingService';

// GET /api/messages/conversations/[id]/messages - Get messages in conversation
export async function GET(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: conversationId } = await params as { id: string };
    
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const before = searchParams.get('before');
    const after = searchParams.get('after');

    const result = await MessagingService.getMessages(
      session.user.id,
      conversationId,
      {
        page,
        limit,
        before: before || undefined,
        after: after || undefined
      }
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Conversation not found or access denied' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching messages' 
      } 
    }, { status: 500 });
  }
}

// POST /api/messages/conversations/[id]/messages - Send system message (admin only)
export async function POST(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: conversationId } = await params as { id: string };

    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user is admin (in a real implementation, you would check admin permissions)
    // For now, we'll assume this check is done in the service layer

    const { content, type, attachments, replyTo } = await req.json();

    // Validate required fields
    if (!content || !type) {
      return NextResponse.json({ 
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Content and type are required' 
        } 
      }, { status: 400 });
    }

    // Validate message type (only system types allowed)
    if (type !== 'system' && type !== 'announcement' && type !== 'broadcast') {
      return NextResponse.json({ 
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Only system, announcement, and broadcast message types are allowed' 
        } 
      }, { status: 400 });
    }

    const result = await MessagingService.sendMessage(
      session.user.id,
      conversationId,
      {
        content,
        type,
        attachments,
        replyTo
      }
    );

    if (!result.success) {
      if (result.error?.code === 'FORBIDDEN') {
        return NextResponse.json({ 
          error: { 
            code: 'FORBIDDEN', 
            message: 'Only administrators can send system messages' 
          } 
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Conversation not found or access denied' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error sending system message:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while sending the system message' 
      } 
    }, { status: 500 });
  }
}