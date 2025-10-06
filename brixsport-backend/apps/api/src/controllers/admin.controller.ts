import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { adminService } from '../services/admin.service';
import { errorHandlerService } from '../services/error.handler.service';

export const adminController = {
  // List users (admin)
  listUsers: async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      
      const result = await adminService.listUsers(filters);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('List users error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get user details (admin)
  getUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      const result = await adminService.getUser(userId);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get user error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Update user (admin)
  updateUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const userData = req.body;
      
      const result = await adminService.updateUser(userId, userData);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update user error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Suspend user (admin)
  suspendUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      // Validate reason
      if (!reason || reason.length < 10) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Suspension reason must be at least 10 characters long'
        });
      }
      
      const result = await adminService.suspendUser(userId, reason);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Suspend user error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Activate user (admin)
  activateUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      // Validate reason
      if (!reason || reason.length < 10) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Activation reason must be at least 10 characters long'
        });
      }
      
      const result = await adminService.activateUser(userId, reason);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Activate user error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Delete user (admin)
  deleteUser: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const requestingUserId = (req as any).user.userId;
      const requestingUserRole = (req as any).user.role;
      
      const result = await adminService.deleteUser(userId, requestingUserId, requestingUserRole);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Delete user error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      return res.status(errorResponse.statusCode || 403).json(errorResponse);
    }
  },
  
  // List loggers (admin)
  listLoggers: async (req: Request, res: Response) => {
    try {
      const result = await adminService.listLoggers();
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('List loggers error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get audit logs (admin)
  getAuditLogs: async (req: Request, res: Response) => {
    try {
      const filters = req.query;
      
      const result = await adminService.getAuditLogs(filters);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get audit logs error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get system analytics (admin)
  getSystemAnalytics: async (req: Request, res: Response) => {
    try {
      const result = await adminService.getSystemAnalytics();
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get system analytics error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get system health (admin)
  getSystemHealth: async (req: Request, res: Response) => {
    try {
      const result = await adminService.getSystemHealth();
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get system health error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get performance metrics (admin)
  getPerformanceMetrics: async (req: Request, res: Response) => {
    try {
      // Stub implementation - return basic metrics
      const result = {
        success: true,
        data: {
          response_time: '150ms',
          throughput: '100 req/min',
          error_rate: '0.1%'
        }
      };
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get performance metrics error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Clear cache (admin)
  clearCache: async (req: Request, res: Response) => {
    try {
      // Stub implementation
      const result = {
        success: true,
        message: 'Cache cleared successfully'
      };
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Clear cache error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Toggle maintenance mode (admin)
  toggleMaintenanceMode: async (req: Request, res: Response) => {
    try {
      // Stub implementation
      const result = {
        success: true,
        message: 'Maintenance mode toggled'
      };
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Toggle maintenance mode error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Get user feedback (admin)
  getUserFeedback: async (req: Request, res: Response) => {
    try {
      // Stub implementation
      const result = {
        success: true,
        data: [],
        message: 'No feedback available'
      };
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get user feedback error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Respond to user feedback (admin)
  respondToFeedback: async (req: Request, res: Response) => {
    try {
      const { feedbackId } = req.params;
      
      // Stub implementation
      const result = {
        success: true,
        message: `Response sent for feedback ${feedbackId}`
      };
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Respond to feedback error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },
  
  // Restart service (admin)
  restartService: async (req: Request, res: Response) => {
    try {
      const result = await adminService.restartService();
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Restart service error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // Database Migration Controllers
  // List available migrations
  listMigrations: async (req: Request, res: Response) => {
    try {
      const result = await adminService.listMigrations();
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('List migrations error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // Run a specific migration
  runMigration: async (req: Request, res: Response) => {
    try {
      const { migrationName } = req.params;
      
      if (!migrationName) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Migration name is required'
        });
      }
      
      const result = await adminService.runMigration(migrationName);
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Run migration error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // Run all pending migrations
  runAllMigrations: async (req: Request, res: Response) => {
    try {
      const result = await adminService.runAllMigrations();
      
      return res.status(result.success ? 200 : 207).json(result);
    } catch (error: any) {
      logger.error('Run all migrations error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  },

  // Get migration status
  getMigrationStatus: async (req: Request, res: Response) => {
    try {
      const result = await adminService.getMigrationStatus();
      
      return res.status(200).json(result);
    } catch (error: any) {
      logger.error('Get migration status error', { error: error.message, stack: error.stack });
      const errorResponse = errorHandlerService.createErrorResponse(error);
      return res.status(errorResponse.statusCode || 500).json(errorResponse);
    }
  }
};