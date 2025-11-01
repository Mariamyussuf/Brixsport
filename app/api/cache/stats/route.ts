import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock cache statistics
    // In a real implementation, this would fetch actual cache stats from Redis or another caching system
    const hits = Math.floor(Math.random() * 10000) + 5000;
    const misses = Math.floor(Math.random() * 1000) + 100;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    
    const cacheStats = {
      hits,
      misses,
      hitRate: parseFloat(hitRate.toFixed(2)),
      memoryUsage: `${Math.floor(Math.random() * 100)} MB`,
      connectedClients: Math.floor(Math.random() * 50) + 10,
      opsPerSecond: Math.floor(Math.random() * 1000) + 100
    };

    return NextResponse.json(cacheStats);
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}