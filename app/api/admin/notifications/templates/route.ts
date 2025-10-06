import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { NotificationService } from '@/services/notificationService';

// GET /api/admin/notifications/templates - Retrieve all notification templates
export async function GET(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const result = await NotificationService.getAllTemplates(
      {
        activeOnly: activeOnly || undefined
      },
      {
        page,
        limit
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching notification templates:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching notification templates' 
      } 
    }, { status: 500 });
  }
}

// POST /api/admin/notifications/templates - Create a new notification template
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

    const templateData = await req.json();

    const template = await NotificationService.createTemplate(templateData);

    return NextResponse.json({
      template
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification template:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while creating the notification template' 
      } 
    }, { status: 500 });
  }
}