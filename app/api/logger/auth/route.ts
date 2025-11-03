import { NextRequest, NextResponse } from 'next/server';
import { generateLoggerToken, getLoggerAuth, LoggerAuthRoles } from '@/lib/loggerAuthService';
import { dbService } from '@/lib/databaseService';
import { LoggerUser } from '@/lib/loggerAuth';

// Logger user interface for login
interface LoggerLoginData {
  email: string;
  password: string;
}

// Logger login endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password }: LoggerLoginData = await request.json();
    
    // Get the logger user from the database
    const dbLogger = await dbService.getLoggerByEmail(email);
    
    // For now, we'll check a simple password field, but in production this should be properly hashed
    // Note: The current Logger type doesn't include a password field, so we're using a workaround
    const loggerUser = dbLogger && (dbLogger as any).password === password ? {
      id: dbLogger.id.toString(),
      name: dbLogger.name || '',
      email: dbLogger.email,
      role: dbLogger.role || 'logger',
      assignedCompetitions: dbLogger.assignedCompetitions || [],
      permissions: ['log_matches', 'log_events', 'view_players', 'view_teams', 'view_competitions'],
      lastLogin: dbLogger.lastActive || new Date().toISOString()
    } as LoggerUser : undefined;
    
    // If we don't have a proper password field, let's properly handle authentication
    if (!loggerUser) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate JWT token for the logger user
    const token = await generateLoggerToken(loggerUser);
    
    // Update last login time
    const updatedUser = {
      ...loggerUser,
      lastLogin: new Date().toISOString()
    };
    
    // Update last login in database
    await dbService.updateLogger(loggerUser.id, { lastActive: updatedUser.lastLogin });
    
    // Return success response with token
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          assignedCompetitions: updatedUser.assignedCompetitions,
          permissions: updatedUser.permissions,
          lastLogin: updatedUser.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Logger login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

// Logger profile endpoint
export async function GET(request: NextRequest) {
  try {
    const session = await getLoggerAuth(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Return logger profile data
    return NextResponse.json({
      success: true,
      data: {
        user: session.user
      }
    });
  } catch (error) {
    console.error('Logger profile error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching profile' },
      { status: 500 }
    );
  }
}