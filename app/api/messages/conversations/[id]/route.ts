import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import MessagingService from '@/services/messagingService';
import AdminService from '@/services/AdminService';

// GET /api/messages/conversations/[id] - Get conversation details
export async function GET(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: conversationId } = await params as { id: string };

    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const result = await MessagingService.getConversationDetails(
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
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching the conversation' 
      } 
    }, { status: 500 });
  }
}

// PUT /api/messages/conversations/[id] - Update conversation settings (admin only)
export async function PUT(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: conversationId } = await params as { id: string };

    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user is admin (real implementation with proper role verification)
    const isAdmin = await AdminService.checkAdminPermission(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions to update conversation' 
        } 
      }, { status: 403 });
    }

    const { name, isMuted, isArchived } = await req.json();

    const result = await MessagingService.updateConversation(
      session.user.id,
      conversationId,
      {
        name,
        isMuted,
        isArchived
      }
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
    console.error('Error updating conversation:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while updating the conversation' 
      } 
    }, { status: 500 });
  }
}

// DELETE /api/messages/conversations/[id] - Delete conversation (admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: conversationId } = await params as { id: string };

    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user is admin (real implementation with proper role verification)
    const isAdmin = await AdminService.checkAdminPermission(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions to delete conversation' 
        } 
      }, { status: 403 });
    }

    const result = await MessagingService.deleteConversation(
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
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while deleting the conversation' 
      } 
    }, { status: 500 });
  }
}