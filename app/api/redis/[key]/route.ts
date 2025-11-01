import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redisClient';

// GET /api/redis/[key] - Get a value from Redis
export async function GET(request: Request, { params }: { params: Promise<{}> }) {
  try {
    const client = await getRedisClient();
    const { key } = await params as { key: string };
    const decodedKey = decodeURIComponent(key);
    
    const value = await client.get(decodedKey);
    
    if (value === null) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }
    
    // Try to parse as JSON, fallback to string
    try {
      const parsedValue = JSON.parse(value);
      return NextResponse.json({
        success: true,
        data: { value: parsedValue }
      });
    } catch {
      return NextResponse.json({
        success: true,
        data: { value }
      });
    }
  } catch (error) {
    console.error('Error getting Redis value:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get value from Redis' 
      },
      { status: 500 }
    );
  }
}

// POST /api/redis/[key] - Set a value in Redis
export async function POST(request: Request, { params }: { params: Promise<{}> }) {
  try {
    const client = await getRedisClient();
    const { key } = await params as { key: string };
    const decodedKey = decodeURIComponent(key);
    const body = await request.json();
    const { value, expireInSeconds } = body;
    
    // Convert value to string for Redis storage
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    if (expireInSeconds) {
      await client.setEx(decodedKey, expireInSeconds, stringValue);
    } else {
      await client.set(decodedKey, stringValue);
    }
    
    return NextResponse.json({
      success: true,
      data: true
    });
  } catch (error) {
    console.error('Error setting Redis value:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to set value in Redis' 
      },
      { status: 500 }
    );
  }
}

// DELETE /api/redis/[key] - Delete a value from Redis
export async function DELETE(request: Request, { params }: { params: Promise<{}> }) {
  try {
    const client = await getRedisClient();
    const { key } = await params as { key: string };
    const decodedKey = decodeURIComponent(key);
    
    const result = await client.del(decodedKey);
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error deleting Redis value:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete value from Redis' 
      },
      { status: 500 }
    );
  }
}