import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Get the backend API URL from environment variables
    // Try multiple sources: server-side env var, then NEXT_PUBLIC_, then fallback
    const backendApiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://brixsport-backend-again-production.up.railway.app';

    console.log('='.repeat(60));
    console.log('SIGNUP API ROUTE - Environment Check:');
    console.log('API_URL:', process.env.API_URL || 'NOT SET');
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'NOT SET');
    console.log('Using backendApiUrl:', backendApiUrl);
    console.log('Full endpoint:', `${backendApiUrl}/api/v1/auth/signup`);
    console.log('='.repeat(60));

    // Parse the request body as JSON
    const requestBody = await req.json();
    console.log('Request body:', {
      name: requestBody.name,
      email: requestBody.email,
      hasPassword: !!requestBody.password
    });

    // Validate that we have the required fields
    if (!requestBody.name || !requestBody.email || !requestBody.password) {
      console.error('Missing required fields in request body');
      return NextResponse.json({
        success: false,
        error: {
          message: 'Name, email, and password are required',
          code: 'VALIDATION_ERROR'
        }
      }, { status: 400 });
    }

    // Forward the request to the backend API
    console.log('Forwarding request to Railway backend...');
    const backendResponse = await fetch(`${backendApiUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }).catch(error => {
      console.error('Network error when connecting to backend:', error);
      throw new Error(`Failed to connect to authentication service: ${error.message}`);
    });

    console.log('Backend response status:', backendResponse.status);
    console.log('Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));

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

    // Handle JSON parsing errors
    if (error.name === 'SyntaxError') {
      errorMessage = 'Invalid request format. Please check your input and try again.';
      errorCode = 'INVALID_FORMAT';
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