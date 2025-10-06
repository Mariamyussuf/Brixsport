import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/databaseService';

// GET /api/competitions - List all competitions
export async function GET(request: NextRequest) {
  try {
    // Fetch competitions directly from the database service
    const competitions = await databaseService.getCompetitions();
    
    return NextResponse.json({
      success: true,
      data: competitions
    });
  } catch (error) {
    console.error('Failed to fetch competitions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch competitions'
      },
      { status: 500 }
    );
  }
}

// POST /api/competitions - Create a new competition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In a real implementation, this would create a competition in the database
    // For now, we'll return a success response with the data
    // TODO: Implement real database creation
    console.log('Creating competition:', body);
    
    return NextResponse.json({
      success: true,
      data: {
        id: Date.now(),
        ...body,
        created_at: new Date().toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create competition:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create competition'
      },
      { status: 500 }
    );
  }
}