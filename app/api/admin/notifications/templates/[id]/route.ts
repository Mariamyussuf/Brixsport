import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { NotificationService } from '@/services/notificationService';

// GET /api/admin/notifications/templates/:id - Retrieve a specific notification template
export async function GET(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: templateId } = await params as { id: string };

    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }, { status: 403 });
    }

    const template = await NotificationService.getTemplate(templateId);
    
    if (!template) {
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Template not found' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json({
      template
    });
  } catch (error) {
    console.error('Error fetching notification template:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching the notification template' 
      } 
    }, { status: 500 });
  }
}

// PUT /api/admin/notifications/templates/:id - Update a notification template
export async function PUT(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: templateId } = await params as { id: string };

    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }, { status: 403 });
    }

    const updatedData = await req.json();

    const template = await NotificationService.updateTemplate(templateId, updatedData);
    
    if (!template) {
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Template not found' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json({
      template
    });
  } catch (error) {
    console.error('Error updating notification template:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while updating the notification template' 
      } 
    }, { status: 500 });
  }
}

// DELETE /api/admin/notifications/templates/:id - Delete a notification template
export async function DELETE(req: Request, { params }: { params: Promise<{}> }) {
  try {
    const { id: templateId } = await params as { id: string };

    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }, { status: 403 });
    }

    const deleted = await NotificationService.deleteTemplate(templateId);
    
    if (!deleted) {
      return NextResponse.json({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Template not found' 
        } 
      }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification template:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while deleting the notification template' 
      } 
    }, { status: 500 });
  }
}