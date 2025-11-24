import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the backend API URL from environment variables
    const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    
    console.log('Attempting to connect to backend:', `${backendApiUrl}/api/v1/auth/signup`);
    
    // Log the request body for debugging
    const requestBody = await req.text();
    console.log('Request body:', requestBody);
    
    // Forward the request to the backend API
    const backendResponse = await fetch(`${backendApiUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
    }).catch(error => {
      console.error('Network error when connecting to backend:', error);
      throw new Error(`Failed to connect to authentication service: ${error.message}`);
    });

    console.log('Backend response status:', backendResponse.status);
    
    // Get the response data
    const data = await backendResponse.json();
    console.log('Backend response data:', data);

    // Return the backend response
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error: any) {
    console.error('Registration API error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return a more detailed error message
    let errorMessage = 'Service temporarily unavailable. Please try again later.';
    let errorCode = 'SERVER_ERROR';
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      errorMessage = 'Unable to connect to authentication service. Please check your network connection and try again.';
      errorCode = 'NETWORK_ERROR';
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: errorMessage,
          code: errorCode
        }
      },
      { status: 503 }
    );
  }
}