import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // In a real implementation, you would store these metrics in your analytics system
    // For now, we'll just log them and return success
    const data = await req.json();
    
    // Log the web vitals data (in production, you might send this to an analytics service)
    console.log('Web Vitals Metric Received:', {
      name: data.name,
      value: data.value,
      rating: data.rating,
      url: data.url,
      timestamp: new Date(data.timestamp).toISOString()
    });
    
    // Return success response
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Web vitals metric recorded' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error processing web vitals:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to process web vitals metric' 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}