import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { NotificationService } from '@/services/notificationService';

// GET /api/notifications/preferences - Retrieve user's notification preferences
export async function GET(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const preferences = await NotificationService.getUserPreferences(session.user.id);

    return NextResponse.json({
      preferences
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching notification preferences' 
      } 
    }, { status: 500 });
  }
}

// PUT /api/notifications/preferences - Update user's notification preferences
export async function PUT(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const updatedPreferences = await req.json();

    const preferences = await NotificationService.updateUserPreferences(
      session.user.id,
      updatedPreferences
    );

    return NextResponse.json({
      preferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while updating notification preferences' 
      } 
    }, { status: 500 });
  }
}
