// Logger Role-Based Access Control (RBAC)
// Dedicated RBAC system for logger users

import { LoggerUser } from './loggerAuth';
import { LoggerPermission } from './loggerPermissions';

// Logger role definitions
export type LoggerRole = 'logger';

// Define role hierarchies
const ROLE_HIERARCHY: Record<LoggerRole, number> = {
  'logger': 1
};

// Check if a role has sufficient privileges
export function hasRolePrivileges(userRole: LoggerRole, requiredRole: LoggerRole): boolean {
  return userRole === requiredRole;
}

// Check if a user has a specific permission
export function hasLoggerPermission(user: LoggerUser, permission: LoggerPermission): boolean {
  // Only logger role is supported
  if (user.role !== 'logger') {
    return false;
  }
  
  // Check if user has the specific permission
  if (user.permissions && user.permissions.includes(permission)) {
    return true;
  }
  
  // Loggers have basic permissions
  const loggerPermissions: LoggerPermission[] = [
    'log_matches',
    'log_events',
    'view_players',
    'view_teams',
    'view_competitions'
  ];
  return loggerPermissions.includes(permission);
}

// Check if a user can access a specific competition
export function canAccessCompetition(user: LoggerUser, competitionId: string): boolean {
  // Only logger role is supported
  if (user.role !== 'logger') {
    return false;
  }
  
  // Loggers can only access their assigned competitions
  if (user.assignedCompetitions && user.assignedCompetitions.length > 0) {
    return user.assignedCompetitions.includes(competitionId);
  }
  // If no specific competitions are assigned, deny access
  return false;
}

// Check if a user can manage other loggers
export function canManageLoggers(user: LoggerUser): boolean {
  return false; // Not supported for logger role
}

// Check if a user can create/edit competitions
export function canManageCompetitions(user: LoggerUser): boolean {
  return false; // Not supported for logger role
}

// Check if a user can create/edit teams
export function canManageTeams(user: LoggerUser): boolean {
  return false; // Not supported for logger role
}

// Check if a user can create/edit players
export function canManagePlayers(user: LoggerUser): boolean {
  return false; // Not supported for logger role
}

// Check if a user can generate reports
export function canGenerateReports(user: LoggerUser): boolean {
  return user.role === 'logger';
}

// Check if a user can view system logs
export function canViewSystemLogs(user: LoggerUser): boolean {
  return false; // Not supported for logger role
}

// Logger RBAC utilities
export const LoggerRBAC = {
  hasRolePrivileges,
  hasLoggerPermission,
  canAccessCompetition,
  canManageLoggers,
  canManageCompetitions,
  canManageTeams,
  canManagePlayers,
  canGenerateReports,
  canViewSystemLogs
};

export default LoggerRBAC;