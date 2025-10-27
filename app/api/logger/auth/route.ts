import { NextRequest, NextResponse } from 'next/server';
import { generateLoggerToken, getLoggerAuth, LoggerAuthRoles } from '@/lib/loggerAuthService';
import { dbService } from '@/lib/databaseService';
import { LoggerUser } from '@/lib/loggerAuth';

// Logger user interface for login
interface LoggerLoginData {
  email: string;
  password: string;
}

// Mock logger users for testing - in production, this would be from a database
const MOCK_LOGGER_USERS = [
  {
    id: 'logger-1',
    name: 'John Logger',
    email: 'logger@example.com',
    password: 'logger123', // In production, this should be hashed
    role: 'logger',
    assignedCompetitions: ['comp-1', 'comp-2'],
    permissions: ['log_matches', 'log_events', 'view_players', 'view_teams', 'view_competitions']
  },
  {
    id: 'senior-logger-1',
    name: 'Senior Logger',
    email: 'senior@example.com',
    password: 'senior123', // In production, this should be hashed
    role: 'senior-logger',
    assignedCompetitions: ['comp-1', 'comp-2', 'comp-3'],
    permissions: [
      'log_matches', 'edit_matches', 'log_events', 'edit_events', 
      'view_all_matches', 'view_players', 'edit_players', 'view_teams', 
      'edit_teams', 'view_competitions', 'assign_competitions'
    ]
  },
  {
    id: 'admin-logger-1',
    name: 'Logger Admin',
    email: 'admin@example.com',
    password: 'admin123', // In production, this should be hashed
    role: 'logger-admin',
    assignedCompetitions: [],
    permissions: [
      'log_matches', 'edit_matches', 'delete_matches', 'view_all_matches',
      'log_events', 'edit_events', 'delete_events', 'view_all_events',
      'manage_players', 'edit_players', 'view_players',
      'manage_teams', 'edit_teams', 'view_teams',
      'manage_competitions', 'assign_competitions', 'view_competitions',
      'view_reports', 'generate_reports', 'view_system_logs'
    ]
  }
];

// Logger login endpoint
export async function POST(request: NextRequest) {
  try {
    const { email, password }: LoggerLoginData = await request.json();
    
    // Find the logger user - in production, this would query a database
    const mockUser = MOCK_LOGGER_USERS.find(
      user => user.email === email && user.password === password
    );
    
    // Cast to LoggerUser type
    const loggerUser = mockUser as LoggerUser | undefined;
    
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
    
    // Save to database in production
    // await dbService.updateUserLastLogin(loggerUser.id, updatedUser.lastLogin);
    
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