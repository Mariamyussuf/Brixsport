import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import MessagingService from '@/services/messagingService';
import AdminService from '@/services/AdminService';

// GET /api/messages/conversations - List conversations
export async function GET(req: Request) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const type = searchParams.get('type') || undefined;

    const result = await MessagingService.getUserConversations(
      session.user.id,
      {
        type,
        sortBy: 'updatedAt',
        sortOrder: 'DESC'
      },
      {
        page,
        limit
      }
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch conversations' 
        } 
      }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching conversations' 
      } 
    }, { status: 500 });
  }
}

// POST /api/messages/conversations - Create conversation (admin only)
export async function POST(req: Request) {
  try {
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
          message: 'Only administrators can create conversations' 
        } 
      }, { status: 403 });
    }

    const { name, type, participantIds } = await req.json();

    // Validate required fields
    if (!type || !participantIds) {
      return NextResponse.json({ 
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Type and participantIds are required' 
        } 
      }, { status: 400 });
    }

    // Validate conversation type
    if (type !== 'announcement' && type !== 'broadcast') {
      return NextResponse.json({ 
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Only announcement and broadcast conversation types are allowed' 
        } 
      }, { status: 400 });
    }

    const result = await MessagingService.createConversation(
      session.user.id,
      {
        name,
        type,
        participantIds
      }
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to create conversation' 
        } 
      }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while creating the conversation' 
      } 
    }, { status: 500 });
  }
}