// Logger Permissions System
// Define and manage permissions for different logger roles

// Define permission types
export type LoggerPermission = 
  // Match logging permissions
  | 'log_matches'
  | 'edit_matches'
  | 'delete_matches'
  | 'view_all_matches'
  
  // Event logging permissions
  | 'log_events'
  | 'edit_events'
  | 'delete_events'
  | 'view_all_events'
  
  // Player management permissions
  | 'manage_players'
  | 'edit_players'
  | 'view_players'
  
  // Competition management permissions
  | 'manage_competitions'
  | 'assign_competitions'
  | 'view_competitions'
  
  // Team management permissions
  | 'manage_teams'
  | 'edit_teams'
  | 'view_teams'
  
  // Reporting permissions
  | 'view_reports'
  | 'export_reports'
  | 'generate_reports'
  
  // System permissions
  | 'view_system_logs'
  | 'manage_settings'
  | 'view_audit_trail';

// Define roles and their permissions
export const ROLE_PERMISSIONS: Record<string, LoggerPermission[]> = {
  'logger': [
    'log_matches',
    'log_events',
    'view_players',
    'view_teams',
    'view_competitions'
  ],
  
  'senior-logger': [
    'log_matches',
    'edit_matches',
    'log_events',
    'edit_events',
    'view_all_matches',
    'view_players',
    'edit_players',
    'view_teams',
    'edit_teams',
    'view_competitions',
    'assign_competitions'
  ],
  
  'logger-admin': [
    'log_matches',
    'edit_matches',
    'delete_matches',
    'view_all_matches',
    'log_events',
    'edit_events',
    'delete_events',
    'view_all_events',
    'manage_players',
    'edit_players',
    'view_players',
    'manage_teams',
    'edit_teams',
    'view_teams',
    'manage_competitions',
    'assign_competitions',
    'view_competitions',
    'view_reports',
    'generate_reports',
    'view_system_logs'
  ],
  
  'admin': [
    'log_matches',
    'edit_matches',
    'delete_matches',
    'view_all_matches',
    'log_events',
    'edit_events',
    'delete_events',
    'view_all_events',
    'manage_players',
    'edit_players',
    'view_players',
    'manage_teams',
    'edit_teams',
    'view_teams',
    'manage_competitions',
    'assign_competitions',
    'view_competitions',
    'view_reports',
    'export_reports',
    'generate_reports',
    'view_system_logs',
    'manage_settings',
    'view_audit_trail'
  ],
  
  'super-admin': [
    'log_matches',
    'edit_matches',
    'delete_matches',
    'view_all_matches',
    'log_events',
    'edit_events',
    'delete_events',
    'view_all_events',
    'manage_players',
    'edit_players',
    'view_players',
    'manage_teams',
    'edit_teams',
    'view_teams',
    'manage_competitions',
    'assign_competitions',
    'view_competitions',
    'view_reports',
    'export_reports',
    'generate_reports',
    'view_system_logs',
    'manage_settings',
    'view_audit_trail'
  ]
};

// Permission categories for UI organization
export const PERMISSION_CATEGORIES = [
  {
    id: 'matches',
    name: 'Match Management',
    permissions: ['log_matches', 'edit_matches', 'delete_matches', 'view_all_matches']
  },
  {
    id: 'events',
    name: 'Event Logging',
    permissions: ['log_events', 'edit_events', 'delete_events', 'view_all_events']
  },
  {
    id: 'players',
    name: 'Player Management',
    permissions: ['manage_players', 'edit_players', 'view_players']
  },
  {
    id: 'teams',
    name: 'Team Management',
    permissions: ['manage_teams', 'edit_teams', 'view_teams']
  },
  {
    id: 'competitions',
    name: 'Competition Management',
    permissions: ['manage_competitions', 'assign_competitions', 'view_competitions']
  },
  {
    id: 'reports',
    name: 'Reporting',
    permissions: ['view_reports', 'export_reports', 'generate_reports']
  },
  {
    id: 'system',
    name: 'System',
    permissions: ['view_system_logs', 'manage_settings', 'view_audit_trail']
  }
];

// Check if a role has a specific permission
export function hasPermission(role: string, permission: LoggerPermission | string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  // If permission is a string, cast it to LoggerPermission for type checking
  return permissions.includes(permission as LoggerPermission);
}

// Get all permissions for a role
export function getRolePermissions(role: string): LoggerPermission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Get permissions by category
export function getPermissionsByCategory(role: string): Record<string, LoggerPermission[]> {
  const rolePermissions = getRolePermissions(role);
  const categorized: Record<string, LoggerPermission[]> = {};
  
  PERMISSION_CATEGORIES.forEach(category => {
    const categoryPermissions = category.permissions.filter(permission => 
      rolePermissions.includes(permission as LoggerPermission)
    );
    if (categoryPermissions.length > 0) {
      categorized[category.id] = categoryPermissions as LoggerPermission[];
    }
  });
  
  return categorized;
}

// Check if a role has any permissions in a category
export function hasCategoryPermissions(role: string, categoryId: string): boolean {
  const category = PERMISSION_CATEGORIES.find(cat => cat.id === categoryId);
  if (!category) return false;
  
  const rolePermissions = getRolePermissions(role);
  return category.permissions.some(permission => 
    rolePermissions.includes(permission as LoggerPermission)
  );
}

export default {
  ROLE_PERMISSIONS,
  PERMISSION_CATEGORIES,
  hasPermission,
  getRolePermissions,
  getPermissionsByCategory,
  hasCategoryPermissions
};