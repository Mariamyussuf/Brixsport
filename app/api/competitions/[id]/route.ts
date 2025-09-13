import { NextRequest, NextResponse } from 'next/server';
import { loggerService } from '@/lib/loggerService';

// GET /api/competitions/[id] - Get a specific competition by ID
export async function GET(request: NextRequest, context: { params: any }) {
  try {
    // `context.params` may be a Promise in the generated Next types — await it
    const params = await context.params;
    const { id } = params as { id: string };
    
    // Fetch specific competition from the logger service
    const response = await loggerService.getCompetitionById(id);
    
    if (!response.success) {
      return NextResponse.json(
        { 
          success: false,
          error: response.error || 'Competition not found'
        },
        { status: 404 }
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
        error: 'Failed to fetch competition'
      },
      { status: 500 }
    );
  }
}