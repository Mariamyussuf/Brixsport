import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { NotificationService } from '@/services/notificationService';
import { NotificationStatus, NotificationType, NotificationPriority } from '@/types/notifications';

// GET /api/notifications - Retrieve user's notifications with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    
    // Get query parameters and validate them against the enum types
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');
    const priorityParam = searchParams.get('priority');
    
    // Validate status parameter
    let status: NotificationStatus | undefined;
    if (statusParam) {
      const validStatuses: NotificationStatus[] = ['UNREAD', 'READ', 'ARCHIVED', 'DELETED'];
      if (validStatuses.includes(statusParam as NotificationStatus)) {
        status = statusParam as NotificationStatus;
      }
    }
    
    // Validate type parameter
    let type: NotificationType | undefined;
    if (typeParam) {
      const validTypes: NotificationType[] = [
        'MATCH_UPDATE', 'SCORE_ALERT', 'FAVORITE_TEAM', 'COMPETITION_NEWS', 
        'SYSTEM_ALERT', 'REMINDER', 'ACHIEVEMENT', 'ADMIN_NOTICE', 'LOG_ALERT'
      ];
      if (validTypes.includes(typeParam as NotificationType)) {
        type = typeParam as NotificationType;
      }
    }
    
    // Validate priority parameter
    let priority: NotificationPriority | undefined;
    if (priorityParam) {
      const validPriorities: NotificationPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'];
      if (validPriorities.includes(priorityParam as NotificationPriority)) {
        priority = priorityParam as NotificationPriority;
      }
    }
    
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';

    const result = await NotificationService.getUserNotifications(
      session.user.id,
      {
        status,
        type,
        priority,
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
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching notifications' 
      } 
    }, { status: 500 });
  }
}

// PATCH /api/notifications/:id - Update notification status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { status } = await req.json();
    const notificationId = params.id;

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
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const notificationId = params.id;

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