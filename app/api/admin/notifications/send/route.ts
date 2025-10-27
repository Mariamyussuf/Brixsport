import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { NotificationService } from '@/services/notificationService';

// POST /api/admin/notifications/send - Send a notification to one or more users
export async function POST(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }, { status: 403 });
    }

    const { recipients, notification } = await req.json();

    const result = await NotificationService.sendNotification(
      session.user.role,
      recipients,
      notification
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while sending notifications' 
      } 
    }, { status: 500 });
  }
}