import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { NotificationService } from '@/services/notificationService';

// PATCH /api/notifications/:id - Update notification status
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { status } = await req.json();
    const { id: notificationId } = params;

    const updatedNotification = await NotificationService.updateNotificationStatus(
      session.user.id,
      notificationId,
      status
    );
    
    if (!updatedNotification) {
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Notification not found' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json({
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while updating the notification' 
      } 
    }, { status: 500 });
  }
}

// DELETE /api/notifications/:id - Delete a notification
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id: notificationId } = params;

    const deleted = await NotificationService.deleteNotification(
      session.user.id,
      notificationId
    );
    
    if (!deleted) {
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Notification not found' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while deleting the notification' 
      } 
    }, { status: 500 });
  }
}