import { NextResponse } from 'next/server';

// This route handler can be used for any API endpoints related to the admin-logger section
export async function GET() {
  return NextResponse.json({ 
    message: 'Admin/Logger platform API endpoint',
    timestamp: new Date().toISOString()
  });
}