import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Check Supabase connection
    const { data, error } = await supabase
      .from('Match')
      .select('id')
      .limit(1);
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Supabase connection failed',
          details: error.message,
          code: error.code
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Check if we can fetch matches
    const matchesResponse = await supabase
      .from('Match')
      .select('*')
      .limit(5);
    
    if (matchesResponse.error) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Failed to fetch matches from Supabase',
          details: matchesResponse.error.message,
          code: matchesResponse.error.code
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        supabase: 'connected',
        matches: matchesResponse.data.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Health check failed',
        stack: error instanceof Error ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}