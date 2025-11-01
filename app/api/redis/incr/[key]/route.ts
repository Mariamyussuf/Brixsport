import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redisClient';

// POST /api/redis/incr/[key] - Increment a value in Redis
export async function POST(request: Request, { params }: { params: { key: string } }) {
  try {
    const client = await getRedisClient();
    const key = decodeURIComponent(params.key);
    
    // Check if key exists and is a number
    const currentValue = await client.get(key);
    
    if (currentValue !== null) {
      // Try to parse current value as number
      const numValue = parseFloat(currentValue);
      if (isNaN(numValue)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Value is not a number' 
          },
          { status: 400 }
        );
      }
    }
    
    // Increment the value
    const newValue = await client.incr(key);
    
    return NextResponse.json({
      success: true,
      data: newValue
    });
  } catch (error) {
    console.error('Error incrementing Redis value:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to increment value in Redis' 
      },
      { status: 500 }
    );
  }
}