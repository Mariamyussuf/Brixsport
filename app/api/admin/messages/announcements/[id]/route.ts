import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import MessagingService from '@/services/messagingService';

// DELETE /api/admin/messages/announcements/[id] - Remove system announcement
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

    const { id: announcementId } = params;

    const result = await MessagingService.deleteAnnouncement(
      session.user.id,
      announcementId
    );

    if (!result.success) {
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Announcement not found' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while deleting the announcement' 
      } 
    }, { status: 500 });
  }
}