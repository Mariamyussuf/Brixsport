import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';

// POST /api/admin/alerts - Resolve an alert
export async function POST(request: Request) {
  try {
    // Verify admin token
    const token = (await cookies()).get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Check if admin has permission to resolve alerts
    if (!hasAdminPermission(adminUser, 'resolve_alerts')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { alertId } = body;
    
    if (!alertId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Alert ID is required' 
      }, { status: 400 });
    }
    
    // Call the backend service to resolve the alert
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
    
    const response = await fetch(`${API_BASE_URL}/v1/security-alerts/${alertId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ resolvedBy: adminUser.id })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ 
        success: false, 
        error: errorData.error || 'Failed to resolve alert in backend service'
      }, { status: response.status });
    }
    
    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error resolving alert:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to resolve alert' 
    }, { status: 500 });
  }
}