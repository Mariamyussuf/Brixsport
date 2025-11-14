import { NextRequest, NextResponse } from 'next/server';
import { generateLoggerToken, getLoggerAuth, LoggerAuthRoles } from '@/lib/loggerAuthService';
import { dbService } from '@/lib/databaseService';
import { LoggerUser } from '@/lib/loggerAuth';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { Logger } from '@/lib/databaseService';
import { supabase } from '@/lib/supabaseClient';

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
    
    // If no logger found, return error
    if (!dbLogger) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, dbLogger.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create logger user object
    const loggerUser: LoggerUser = {
      id: dbLogger.id.toString(),
      name: dbLogger.name || '',
      email: dbLogger.email,
      role: (dbLogger.role as 'logger') || 'logger',
      assignedCompetitions: dbLogger.assignedCompetitions || [],
      permissions: dbLogger.permissions || ['log_matches', 'log_events', 'view_players', 'view_teams', 'view_competitions'],
      lastLogin: dbLogger.lastActive || new Date().toISOString()
    };
    
    // Generate access token
    const accessToken = await generateLoggerToken(loggerUser);
    
    // Generate refresh token
    const refreshToken = nanoid(32);
    
    // Store refresh token in database (in production, you might want to use Redis or similar)
    // For now, we'll store it in the logger record
    await supabase
      .from('Logger')
      .update({ 
        lastActive: new Date().toISOString(),
        refreshToken: refreshToken
      })
      .eq('id', loggerUser.id);
    
    // Set token expiration times
    const accessTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Return success response with tokens
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        accessTokenExpiry: accessTokenExpiry.toISOString(),
        refreshTokenExpiry: refreshTokenExpiry.toISOString(),
        user: {
          id: loggerUser.id,
          name: loggerUser.name,
          email: loggerUser.email,
          role: loggerUser.role,
          assignedCompetitions: loggerUser.assignedCompetitions,
          permissions: loggerUser.permissions,
          lastLogin: loggerUser.lastLogin
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