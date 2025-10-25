import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import MessagingService from '@/services/messagingService';
import AdminService from '@/services/AdminService';

// PUT /api/messages/messages/[id] - Update message (admin only)
export async function PUT(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: messageId } = await params as { id: string };

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
          message: 'Only administrators can update messages' 
        } 
      }, { status: 403 });
    }

    const { content } = await req.json();

    // Validate required fields
    if (!content) {
      return NextResponse.json({ 
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Content is required' 
        } 
      }, { status: 400 });
    }

    const result = await MessagingService.updateMessage(
      session.user.id,
      messageId,
      content
    );

    if (!result.success) {
      if (result.error?.code === 'FORBIDDEN') {
        return NextResponse.json({ 
          error: { 
            code: 'FORBIDDEN', 
            message: 'Only administrators can update messages' 
          } 
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Message not found' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while updating the message' 
      } 
    }, { status: 500 });
  }
}

// DELETE /api/messages/messages/[id] - Delete message (admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: messageId } = await params as { id: string };

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
          message: 'Only administrators can delete messages' 
        } 
      }, { status: 403 });
    }

    const result = await MessagingService.deleteMessage(
      session.user.id,
      messageId
    );

    if (!result.success) {
      if (result.error?.code === 'FORBIDDEN') {
        return NextResponse.json({ 
          error: { 
            code: 'FORBIDDEN', 
            message: 'Only administrators can delete messages' 
          } 
        }, { status: 403 });
      }
      
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Message not found' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while deleting the message' 
      } 
    }, { status: 500 });
  }
}