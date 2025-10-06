import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { NotificationService } from '@/services/notificationService';

// PATCH /api/notifications/batch - Batch update notifications
export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { notificationIds, status } = await req.json();

    const updatedCount = await NotificationService.batchUpdateNotifications(
      session.user.id,
      notificationIds,
      status
    );

    return NextResponse.json({
      updated: updatedCount,
      message: 'Notifications updated successfully'
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while updating notifications' 
      } 
    }, { status: 500 });
  }
}
