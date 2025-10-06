import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, hasAdminPermission } from '@/lib/adminAuth';
import { cookies } from 'next/headers';
import { dbService as databaseService } from '@/lib/databaseService';

// Define the Competition interface locally to match the database service
interface Competition {
  id: number;
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

// Define the competition data interface for creation
interface CreateCompetitionData {
  name: string;
  type: string;
  category: string;
  status: string;
  start_date: string;
  end_date: string;
}

// GET /api/admin/competitions - Get all competitions
export async function GET() {
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

    // Check if admin has permission to view competitions
    if (!hasAdminPermission(adminUser, 'view_competitions')) {
      // All admins should be able to view competitions
      // Add this permission if it doesn't exist
    }

    // Fetch competitions from database
    const competitions = await databaseService.getCompetitions();
    
    return NextResponse.json({ 
      success: true, 
      data: competitions 
    });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch competitions' 
    }, { status: 500 });
  }
}

// POST /api/admin/competitions - Create a new competition
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

    // Check if admin has permission to manage competitions
    if (!hasAdminPermission(adminUser, 'manage_competitions')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden' 
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.start_date || !body.end_date) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name, type, start date, and end date are required' 
      }, { status: 400 });
    }
    
    // Create new competition in database
    const competitionData = {
      name: body.name,
      type: body.type,
      category: body.category || 'school',
      status: 'upcoming', // Status is set by backend, not from request
      start_date: body.start_date,
      end_date: body.end_date
    };
    
    const newCompetition = await databaseService.createCompetition(competitionData as Omit<Competition, 'id' | 'created_at'>);
    
    return NextResponse.json({ 
      success: true, 
      data: newCompetition 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating competition:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create competition' 
    }, { status: 500 });
  }
}
