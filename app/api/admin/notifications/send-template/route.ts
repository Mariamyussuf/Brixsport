import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { NotificationService } from '@/services/notificationService';

// POST /api/admin/notifications/send-template - Send a notification using a template
export async function POST(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }, { status: 403 });
    }

    const { templateId, recipients, variables, scheduledAt, expiresAt } = await req.json();

    const result = await NotificationService.sendTemplateNotification(
      session.user.role,
      templateId,
      recipients,
      variables,
      scheduledAt,
      expiresAt
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error sending template notifications:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while sending template notifications' 
      } 
    }, { status: 500 });
  }
}
