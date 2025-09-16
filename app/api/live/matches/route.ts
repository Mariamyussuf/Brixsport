import { NextResponse } from 'next/server';
import { getLiveMatches } from '@/lib/homeService';

export async function GET() {
  try {
    // Call the service function to get live matches
    const response = await getLiveMatches();
    
    // Return the response as JSON
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in live matches API route:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Failed to fetch live matches' 
        } 
      },
      { status: 500 }
    );
  }
}