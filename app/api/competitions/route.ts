import { NextRequest, NextResponse } from 'next/server';
import { loggerService } from '@/lib/loggerService';

// GET /api/competitions - List all competitions
export async function GET(request: NextRequest) {
  try {
    // Fetch competitions from the logger service
    const response = await loggerService.getCompetitions();
    
    if (!response.success) {
      return NextResponse.json(
        { 
          success: false,
          error: response.error || 'Failed to fetch competitions'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: response.data
    });
  } catch (error) {
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
    
    // Create competition through the logger service
    const response = await loggerService.createCompetition(body);
    
    if (!response.success) {
      return NextResponse.json(
        { 
          success: false,
          error: response.error || 'Failed to create competition'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create competition'
      },
      { status: 500 }
    );
  }
}