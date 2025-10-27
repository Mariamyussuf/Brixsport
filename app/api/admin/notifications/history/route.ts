import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { NotificationService } from '@/services/notificationService';
import { DeliveryStatus, DeliveryMethod } from '@/types/notifications';

// GET /api/admin/notifications/history - Retrieve notification delivery history
export async function GET(req: NextRequest) {
  try {
    const session = await getAuth(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Forbidden' } }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status');
    const deliveryMethod = searchParams.get('deliveryMethod');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate status parameter against DeliveryStatus type
    const validStatuses: DeliveryStatus[] = ['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'CLICKED'];
    const validatedStatus = status && validStatuses.includes(status as DeliveryStatus) 
      ? (status as DeliveryStatus) 
      : undefined;

    // Validate deliveryMethod parameter against DeliveryMethod type
    const validDeliveryMethods: DeliveryMethod[] = ['PUSH', 'EMAIL', 'SMS', 'IN_APP'];
    const validatedDeliveryMethod = deliveryMethod && validDeliveryMethods.includes(deliveryMethod as DeliveryMethod)
      ? (deliveryMethod as DeliveryMethod)
      : undefined;

    const result = await NotificationService.getNotificationHistory(
      {
        status: validatedStatus,
        deliveryMethod: validatedDeliveryMethod,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      },
      {
        page,
        limit
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return NextResponse.json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching notification history' 
      } 
    }, { status: 500 });
  }
}