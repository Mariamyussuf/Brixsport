import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import MessagingService from '@/services/messagingService';

// GET /api/admin/messages/announcements - List system announcements
export async function GET(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const result = await MessagingService.getAnnouncements(
      session.user.id,
      {
        page,
        limit
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching announcements' 
      } 
    }, { status: 500 });
  }
}