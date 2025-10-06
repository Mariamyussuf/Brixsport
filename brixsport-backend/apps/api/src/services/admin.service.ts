import { logger } from '../utils/logger';
import { userRules } from './userRules.service';
import { supabaseService } from './supabase.service';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend PrismaClient to include raw SQL access for migrations
interface ExtendedPrismaClient extends PrismaClient {
  migration_history: any;
}

const extendedPrisma = prisma as ExtendedPrismaClient;

export const adminService = {
  // List users (admin)
  listUsers: async (filters: any) => {
    try {
      logger.info('Listing users', { filters });
      
      // Set default pagination values
      const page = parseInt(filters.page as string) || 1;
      const limit = parseInt(filters.limit as string) || 10;
      const search = filters.search as string || '';
      
      // Prepare filters for Supabase
      const supabaseFilters: any = {
        page,
        limit
      };
      
      // Add search filter if provided
      if (search) {
        supabaseFilters.email = search;
      }
      
      // Fetch users from Supabase
      const result = await supabaseService.listUsers(supabaseFilters);
      
      // Calculate pagination
      const total = result.count;
      const pages = Math.ceil(total / limit);
      
      // Remove sensitive information
      const users = result.data.map((user: any) => {
        const { password, ...publicUser } = user;
        return publicUser;
      });
      
      return {
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          pages
        }
      };
    } catch (error: any) {
      logger.error('List users error', error);
      throw error;
    }
  },
  
  // Get user details (admin)
  getUser: async (userId: string) => {
    try {
      logger.info('Fetching user details', { userId });
      
      const user = await supabaseService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Remove sensitive information
      const { password, ...publicUser } = user;
      
      return {
        success: true,
        data: publicUser
      };
    } catch (error: any) {
      logger.error('Get user error', error);
      throw error;
    }
  },
  
  // Update user (admin)
  updateUser: async (userId: string, userData: any) => {
    try {
      logger.info('Updating user', { userId, userData });
      
      // Remove sensitive fields that shouldn't be updated by admin
      const { password, ...updateData } = userData;
      
      // Validate user data if role is being updated
      if (userData.role) {
        const validationErrors = userRules.validateRoleAssignment({ role: userData.role });
        if (validationErrors.length > 0) {
          throw new Error(`Role validation failed: ${validationErrors.join(', ')}`);
        }
      }
      
      const updatedUser = await supabaseService.updateUser(userId, updateData);
      
      if (!updatedUser) {
        throw new Error('User not found');
      }
      
      // Log the admin action
      await supabaseService.createAuditLog({
        userId: userId,
        action: 'user_update',
        entity: 'User',
        entityId: userId,
        oldValues: null,
        newValues: updateData,
        reason: 'Admin user update',
        timestamp: new Date()
      });
      
      // Remove sensitive information
      const { password: removedPassword, ...publicUser } = updatedUser;
      
      return {
        success: true,
        data: publicUser
      };
    } catch (error: any) {
      logger.error('Update user error', error);
      throw error;
    }
  },
  
  // Suspend user (admin)
  suspendUser: async (userId: string, reason: string) => {
    try {
      // Validate reason
      if (!reason || reason.length < 10) {
        throw new Error('Suspension reason must be at least 10 characters long');
      }
      
      logger.info('Suspending user', { userId, reason });
      
      const suspendedUser = await supabaseService.suspendUser(userId, reason);
      
      if (!suspendedUser) {
        throw new Error('User not found');
      }
      
      // Log the admin action
      await supabaseService.createAuditLog({
        userId: userId,
        action: 'user_suspend',
        entity: 'User',
        entityId: userId,
        oldValues: null,
        newValues: { suspended: true, suspensionReason: reason },
        reason: reason,
        timestamp: new Date()
      });
      
      // Remove sensitive information
      const { password, ...publicUser } = suspendedUser;
      
      return {
        success: true,
        data: publicUser
      };
    } catch (error: any) {
      logger.error('Suspend user error', error);
      throw error;
    }
  },
  
  // Activate user (admin)
  activateUser: async (userId: string, reason: string) => {
    try {
      // Validate reason
      if (!reason || reason.length < 10) {
        throw new Error('Activation reason must be at least 10 characters long');
      }
      
      logger.info('Activating user', { userId, reason });
      
      const activatedUser = await supabaseService.activateUser(userId, reason);
      
      if (!activatedUser) {
        throw new Error('User not found');
      }
      
      // Log the admin action
      await supabaseService.createAuditLog({
        userId: userId,
        action: 'user_activate',
        entity: 'User',
        entityId: userId,
        oldValues: null,
        newValues: { suspended: false, activationReason: reason },
        reason: reason,
        timestamp: new Date()
      });
      
      // Remove sensitive information
      const { password, ...publicUser } = activatedUser;
      
      return {
        success: true,
        data: publicUser
      };
    } catch (error: any) {
      logger.error('Activate user error', error);
      throw error;
    }
  },
  
  // Delete user (admin)
  deleteUser: async (userId: string, requestingUserId: string, requestingUserRole: string) => {
    try {
      // Validate deletion permissions
      const validationErrors = userRules.canDeleteUser(userId, requestingUserId, requestingUserRole);
      if (validationErrors.length > 0) {
        throw new Error(`Deletion validation failed: ${validationErrors.join(', ')}`);
      }
      
      logger.info('Deleting user', { userId });
      
      const result = await supabaseService.deleteUser(userId);
      
      if (!result) {
        throw new Error('User not found');
      }
      
      // Log the admin action
      await supabaseService.createAuditLog({
        userId: requestingUserId,
        action: 'user_delete',
        entity: 'User',
        entityId: userId,
        oldValues: null,
        newValues: null,
        reason: 'User deleted by admin',
        timestamp: new Date()
      });
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error: any) {
      logger.error('Delete user error', error);
      throw error;
    }
  },
  
  // List loggers (admin)
  listLoggers: async () => {
    try {
      logger.info('Listing loggers');
      
      const result = await supabaseService.listLoggers();
      
      return {
        success: true,
        data: result
      };
    } catch (error: any) {
      logger.error('List loggers error', error);
      throw error;
    }
  },
  
  // Get audit logs (admin)
  getAuditLogs: async (filters: any = {}) => {
    try {
      logger.info('Fetching audit logs', { filters });
      
      const result = await supabaseService.getAuditLogs(filters);
      
      return {
        success: true,
        data: result.data,
        count: result.count
      };
    } catch (error: any) {
      logger.error('Get audit logs error', error);
      throw error;
    }
  },
  
  // Get system analytics (admin)
  getSystemAnalytics: async () => {
    try {
      logger.info('Fetching system analytics');
      
      const systemMetricsResult = await supabaseService.getSystemMetrics();
      
      if (!systemMetricsResult.success || !systemMetricsResult.data) {
        throw new Error(systemMetricsResult.error || 'Failed to fetch system metrics');
      }
      
      return {
        success: true,
        data: {
          userCount: systemMetricsResult.data.totalUsers,
          activeUsers: systemMetricsResult.data.activeUsers,
          matchCount: systemMetricsResult.data.totalMatches,
          eventCount: systemMetricsResult.data.totalEvents
        }
      };
    } catch (error: any) {
      logger.error('Get system analytics error', error);
      throw error;
    }
  },
  
  // Get system health (admin)
  getSystemHealth: async () => {
    try {
      logger.info('Checking system health');
      
      const systemHealth = await supabaseService.getSystemHealthData();
      
      return {
        success: true,
        data: {
          status: systemHealth.status,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          database: systemHealth.database,
          lastChecked: systemHealth.lastChecked
        }
      };
    } catch (error: any) {
      logger.error('Get system health error', error);
      throw error;
    }
  },
  
  // Toggle maintenance mode (admin)
  toggleMaintenanceMode: async (enabled: boolean, reason: string) => {
    try {
      // Validate reason
      if (!reason || reason.length < 10) {
        throw new Error('Maintenance mode reason must be at least 10 characters long');
      }
      
      logger.info('Toggling maintenance mode', { enabled, reason });
      
      // Set maintenance mode setting
      await supabaseService.setSystemSetting('maintenance_mode', enabled);
      await supabaseService.setSystemSetting('maintenance_reason', reason);
      await supabaseService.setSystemSetting('maintenance_toggled_at', new Date().toISOString());
      
      // Log the admin action
      await supabaseService.createAuditLog({
        userId: 'system',
        action: 'maintenance_toggle',
        entity: 'System',
        entityId: 'system',
        oldValues: null,
        newValues: { maintenanceMode: enabled, reason },
        reason: reason,
        timestamp: new Date()
      });
      
      return {
        success: true,
        data: {
          maintenanceMode: enabled,
          toggledAt: new Date()
        }
      };
    } catch (error: any) {
      logger.error('Toggle maintenance mode error', error);
      throw error;
    }
  },
  
  // Get user feedback (admin)
  getUserFeedback: async (filters: any = {}) => {
    try {
      logger.info('Fetching user feedback', { filters });
      
      const result = await supabaseService.getFeedback(filters);
      
      return {
        success: true,
        data: result.data,
        count: result.count
      };
    } catch (error: any) {
      logger.error('Get user feedback error', error);
      throw error;
    }
  },
  
  // Respond to user feedback (admin)
  respondToFeedback: async (feedbackId: string, response: string, responderId: string) => {
    try {
      // Validate response
      if (!response || response.length < 10) {
        throw new Error('Response must be at least 10 characters long');
      }
      
      logger.info('Responding to user feedback', { feedbackId, response });
      
      const result = await supabaseService.updateFeedback(feedbackId, {
        status: 'responded',
        response: response,
        respondedAt: new Date(),
        respondedBy: responderId
      });
      
      // Log the admin action
      await supabaseService.createAuditLog({
        userId: responderId,
        action: 'feedback_respond',
        entity: 'Feedback',
        entityId: feedbackId,
        oldValues: null,
        newValues: { status: 'responded', response },
        reason: 'Admin responded to feedback',
        timestamp: new Date()
      });
      
      return {
        success: true,
        data: result.data
      };
    } catch (error: any) {
      logger.error('Respond to feedback error', error);
      throw error;
    }
  },
  listMigrations: async () => {
    try {
      logger.info('Listing available migrations');

      const migrationsDir = path.join(__dirname, '../../../packages/database/migrations');
      const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql') && file !== 'run_migrations.sql')
        .sort();

      // Check which migrations have been run
      const migrationHistory = await extendedPrisma.migration_history.findMany({
        orderBy: { migration_name: 'asc' }
      });

      const completedMigrations = new Set(
        migrationHistory.map((m: any) => m.migration_name)
      );

      const migrations = files.map(filename => ({
        name: filename,
        status: completedMigrations.has(filename.replace('.sql', '')) ? 'completed' : 'pending',
        executed_at: migrationHistory.find((m: any) => m.migration_name === filename.replace('.sql', ''))?.executed_at || null
      }));

      return {
        success: true,
        data: migrations,
        summary: {
          total: migrations.length,
          completed: migrations.filter(m => m.status === 'completed').length,
          pending: migrations.filter(m => m.status === 'pending').length
        }
      };
    } catch (error: any) {
      logger.error('List migrations error', error);
      throw error;
    }
  },

  // Run a specific migration
  runMigration: async (migrationName: string) => {
    try {
      logger.info('Running migration', { migrationName });

      // Check if migration has already been run
      const existing = await extendedPrisma.migration_history.findUnique({
        where: { migration_name: migrationName }
      });

      if (existing) {
        return {
          success: true,
          message: `Migration ${migrationName} has already been executed`,
          data: existing
        };
      }

      // Read migration file
      const migrationPath = path.join(__dirname, '../../../packages/database/migrations', `${migrationName}.sql`);
      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Migration file ${migrationName}.sql not found`);
      }

      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

      // Execute migration
      const startTime = Date.now();
      await prisma.$executeRawUnsafe(migrationSQL);
      const executionTime = Date.now() - startTime;

      // Record migration execution
      const record = await extendedPrisma.migration_history.create({
        data: {
          migration_name: migrationName,
          execution_time_ms: executionTime,
          success: true
        }
      });

      logger.info('Migration completed successfully', {
        migrationName,
        executionTime
      });

      return {
        success: true,
        message: `Migration ${migrationName} executed successfully`,
        data: {
          migration_name: record.migration_name,
          executed_at: record.executed_at,
          execution_time_ms: record.execution_time_ms
        }
      };
    } catch (error: any) {
      logger.error('Run migration error', { migrationName, error: error.message });

      // Record failed migration
      try {
        await extendedPrisma.migration_history.create({
          data: {
            migration_name: migrationName,
            success: false,
            error_message: (error as Error).message
          }
        });
      } catch (recordError) {
        logger.error('Failed to record migration error', recordError);
      }

      throw error;
    }
  },

  // Run all pending migrations
  runAllMigrations: async () => {
    try {
      logger.info('Running all pending migrations');

      const migrationsDir = path.join(__dirname, '../../../packages/database/migrations');
      const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql') && file !== 'run_migrations.sql')
        .sort();

      // Check which migrations have been run
      const migrationHistory = await extendedPrisma.migration_history.findMany();
      const completedMigrations = new Set(
        migrationHistory.map((m: any) => m.migration_name)
      );

      const pendingMigrations = files
        .filter(filename => !completedMigrations.has(filename.replace('.sql', '')))
        .map(filename => filename.replace('.sql', ''));

      if (pendingMigrations.length === 0) {
        return {
          success: true,
          message: 'All migrations have already been executed',
          data: { executed: 0, pending: 0 }
        };
      }

      logger.info(`Executing ${pendingMigrations.length} pending migrations`);

      const results = [];
      for (const migrationName of pendingMigrations) {
        try {
          const result = await adminService.runMigration(migrationName);
          results.push(result);
        } catch (error) {
          logger.error(`Migration ${migrationName} failed`, error);
          results.push({
            success: false,
            migration: migrationName,
            error: (error as Error).message
          });
          break; // Stop on first failure
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        success: failed === 0,
        message: `Executed ${successful} migrations successfully${failed > 0 ? `, ${failed} failed` : ''}`,
        data: {
          executed: successful,
          failed,
          total: pendingMigrations.length,
          results
        }
      };
    } catch (error: any) {
      logger.error('Run all migrations error', error);
      throw error;
    }
  },

  // Get migration status
  getMigrationStatus: async () => {
    try {
      logger.info('Getting migration status');

      const migrations = await extendedPrisma.migration_history.findMany({
        orderBy: { executed_at: 'desc' }
      });

      const stats = await extendedPrisma.migration_history.aggregate({
        _count: { id: true },
        where: { success: true }
      });

      return {
        success: true,
        data: {
          history: migrations,
          summary: {
            total_executed: stats._count.id,
            last_migration: migrations[0] || null
          }
        }
      };
    } catch (error: any) {
      logger.error('Get migration status error', error);
      throw error;
    }
  },

  // Restart service (admin)
  restartService: async () => {
    try {
      logger.info('Restarting service');

      // Stub implementation - in a real app this would restart the service
      return {
        success: true,
        message: 'Service restart initiated',
        estimated_downtime: '30 seconds'
      };
    } catch (error: any) {
      logger.error('Restart service error', error);
      throw error;
    }
  },

  // Get user retention analytics (admin)
  getUserRetention: async () => {
    try {
      logger.info('Fetching user retention data');

      const retentionDataResult = await supabaseService.getUserRetention();

      if (!retentionDataResult.success || !retentionDataResult.data) {
        throw new Error('Failed to fetch user retention data');
      }

      // Transform the raw data { [key: string]: number } to the required UserRetention type
      const rawData = retentionDataResult.data;
      const userRetention = {
        day1: rawData.day1 || rawData['day1'] || 0,
        day7: rawData.day7 || rawData['day7'] || 0,
        day30: rawData.day30 || rawData['day30'] || 0,
        day90: rawData.day90 || rawData['day90'] || 0
      };

      return {
        success: true,
        data: userRetention
      };
    } catch (error: any) {
      logger.error('Get user retention error', error);
      throw error;
    }
  },

  // Get resource utilization analytics (admin)
  getResourceUtilization: async () => {
    try {
      logger.info('Fetching resource utilization data');

      const resourceDataResult = await supabaseService.getResourceUtilizationData();

      if (!resourceDataResult.success || !resourceDataResult.data) {
        throw new Error('Failed to fetch resource utilization data');
      }

      // Transform each resource item from { resource, usage, timestamp }
      // to { resourceName, currentUsage, maxCapacity, utilizationPercentage }
      const resourceUtilization = resourceDataResult.data.map((item: any) => {
        // Assume max capacity based on resource type (this would be configurable in a real system)
        let maxCapacity = 100; // Default

        if (item.resource === 'Memory') {
          maxCapacity = 100; // Percentage
        } else if (item.resource === 'CPU') {
          maxCapacity = 100; // Percentage
        } else if (item.resource === 'Uptime') {
          maxCapacity = 86400; // 24 hours in seconds
        }

        // Calculate utilization percentage
        const currentUsage = typeof item.usage === 'number' ? item.usage : parseFloat(item.usage) || 0;
        const utilizationPercentage = maxCapacity > 0 ? Math.min(100, Math.max(0, (currentUsage / maxCapacity) * 100)) : 0;

        return {
          resourceName: item.resource,
          currentUsage: currentUsage,
          maxCapacity: maxCapacity,
          utilizationPercentage: Math.round(utilizationPercentage * 100) / 100 // Round to 2 decimal places
        };
      });

      return {
        success: true,
        data: resourceUtilization
      };
    } catch (error: any) {
      logger.error('Get resource utilization error', error);
      throw error;
    }
  },

  // Get system alerts (admin)
  getSystemAlerts: async () => {
    try {
      logger.info('Fetching system alerts');

      const alertsDataResult = await supabaseService.getSystemAlertsData();

      if (!alertsDataResult.success || !alertsDataResult.data) {
        throw new Error('Failed to fetch system alerts data');
      }

      // Transform each alert from { id, type, severity, message, status, createdAt, resolvedAt }
      // to { id, type, severity, message, status, timestamp, resolved }
      const systemAlerts = alertsDataResult.data.map((alert: any) => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        status: alert.status,
        timestamp: alert.createdAt, // Map createdAt to timestamp
        resolved: alert.resolvedAt ? new Date(alert.resolvedAt).toISOString() : null // Map resolvedAt to resolved and ensure it's a proper date string
      }));

      return {
        success: true,
        data: systemAlerts
      };
    } catch (error: any) {
      logger.error('Get system alerts error', error);
      throw error;
    }
  }
};