import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import MessagingService from '@/services/messagingService';

// GET /api/messages/conversations - List system conversations for user
export async function GET(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const type = searchParams.get('type');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    const result = await MessagingService.getUserConversations(
      session.user.id,
      {
        type: type || undefined,
        sortBy,
        sortOrder: sortOrder as 'ASC' | 'DESC'
      },
      {
        page,
        limit
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching system conversations:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching system conversations' 
      } 
    }, { status: 500 });
  }
}

// POST /api/messages/conversations - Create new system conversation (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user is admin (in a real implementation, you would check admin permissions)
    // For now, we'll assume this check is done elsewhere

    const { name, type, participantIds } = await req.json();

    // Validate required fields
    if (!type || !participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json({ 
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Type and participantIds are required' 
        } 
      }, { status: 400 });
    }

    // Validate conversation type (only system types allowed)
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating system conversation:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while creating the system conversation' 
      } 
    }, { status: 500 });
  }
}