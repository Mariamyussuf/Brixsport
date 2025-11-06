import { NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabaseClient';

// POST /api/admin/alerts/:id/resolve - Resolve a security alert
export async function POST(request: Request, { params }: { params: Promise<{}> }) {
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

    // Check if admin has permission to manage security alerts
    if (!hasAdminPermission(adminUser, 'manage_security')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const { id } = await params as { id: string };
    const alertId = parseInt(id, 10);
    
    // Validate alert ID
    if (isNaN(alertId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid alert ID' 
      }, { status: 400 });
    }
    
    // Update the alert in Supabase to mark it as resolved
    const { data, error } = await supabase
      .from('SecurityAlert')
      .update({ 
        status: 'resolved',
        resolvedBy: adminUser.id,
        resolvedAt: new Date().toISOString()
      })
      .eq('id', alertId)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          error: 'Alert not found' 
        }, { status: 404 });
      }
      throw new Error(`Database error: ${error.message}`);
    }
    
    return NextResponse.json({ 
      success: true,
      data
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to resolve alert' 
    }, { status: 500 });
  }
}