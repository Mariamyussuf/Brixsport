import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import MessagingService from '@/services/messagingService';

// POST /api/messages/conversations/[id]/participants - Add participant to conversation
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const conversationId = params.id;
    const { participantId } = await req.json();

    // Validate required fields
    if (!participantId) {
      return NextResponse.json({ 
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Participant ID is required' 
        } 
      }, { status: 400 });
    }

    const result = await MessagingService.addParticipant(
      session.user.id,
      conversationId,
      participantId
    );

    if (!result.success) {
      if (result.error?.code === 'FORBIDDEN') {
        return NextResponse.json({ 
          error: { 
            code: 'FORBIDDEN', 
            message: 'Insufficient permissions to add participants' 
          } 
        }, { status: 403 });
      }
      
      if (result.error?.code === 'NOT_FOUND') {
        return NextResponse.json({ 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Conversation not found' 
          } 
        }, { status: 404 });
      }
      
      if (result.error?.code === 'CONFLICT') {
        return NextResponse.json({ 
          error: { 
            code: 'CONFLICT', 
            message: 'User is already a participant' 
          } 
        }, { status: 409 });
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while adding the participant' 
      } 
    }, { status: 500 });
  }
}