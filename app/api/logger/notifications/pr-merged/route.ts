import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { NotificationService } from '@/services/notificationService';

// POST /api/logger/notifications/pr-merged - Specialized endpoint for PR merge notifications
export async function POST(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user has logger role
    if (session.user.role !== 'logger') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }, { status: 403 });
    }

    const { prNumber, prTitle, author, repository, branch, mergedBy, changes, recipients } = await req.json();

    const result = await NotificationService.sendPrMergedNotification(
      recipients,
      {
        prNumber,
        prTitle,
        author,
        repository,
        branch,
        mergedBy,
        changes
      }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error sending PR merge notification:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while sending PR merge notification' 
      } 
    }, { status: 500 });
  }
}