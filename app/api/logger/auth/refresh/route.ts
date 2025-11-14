import { NextRequest, NextResponse } from 'next/server';
import { dbService } from '@/lib/databaseService';
import { generateLoggerToken } from '@/lib/loggerAuthService';
import { LoggerUser } from '@/lib/loggerAuth';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    
    // Validate refresh token
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    // Find logger with matching refresh token
    // Note: In production, you might want to use Redis or a separate table for storing refresh tokens
    const { data: loggers, error } = await supabase
      .from('Logger')
      .select('*')
      .eq('refreshToken', refreshToken);
    
    if (error || !loggers || loggers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }
    
    const dbLogger = loggers[0];
    
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
    
    // Generate new access token
    const newAccessToken = await generateLoggerToken(loggerUser);
    
    // Generate new refresh token
    const newRefreshToken = nanoid(32);
    
    // Update refresh token in database
    await supabase
      .from('Logger')
      .update({ 
        refreshToken: newRefreshToken
      })
      .eq('id', loggerUser.id);
    
    // Set token expiration times
    const accessTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Return success response with new tokens
    return NextResponse.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
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
    console.error('Logger refresh token error:', error);
    return NextResponse.json(
      { error: 'An error occurred while refreshing tokens' },
      { status: 500 }
    );
  }
}