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
    
    // Create competition using the database service
    const competition = await databaseService.createCompetition(body);
    
    return NextResponse.json({
      success: true,
      data: competition
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create competition:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create competition'
      },
      { status: 500 }
    );
  }
}