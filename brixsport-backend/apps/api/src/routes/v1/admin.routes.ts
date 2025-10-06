import { Router } from 'express';
import { adminController } from '../../controllers/admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { hasPermission } from '../../middleware/rbac.middleware';
import { 
  listUsersSchema,
  updateUserSchema,
  suspendUserSchema,
  activateUserSchema,
  validate
} from '../../validation/user.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List users (admin)
router.get('/users', hasPermission('admin:access'), validate(listUsersSchema), adminController.listUsers);

// Get user details (admin)
router.get('/users/:userId', hasPermission('admin:access'), adminController.getUser);

// Update user (admin)
router.put('/users/:userId', hasPermission('admin:access'), validate(updateUserSchema), adminController.updateUser);

// Suspend user (admin)
router.post('/users/:userId/suspend', hasPermission('admin:access'), validate(suspendUserSchema), adminController.suspendUser);

// Activate user (admin)
router.post('/users/:userId/activate', hasPermission('admin:access'), validate(activateUserSchema), adminController.activateUser);

// Delete user (admin)
router.delete('/users/:userId', hasPermission('admin:access'), adminController.deleteUser);

// List loggers (admin)
router.get('/loggers', hasPermission('admin:access'), adminController.listLoggers);

// Get audit logs (admin)
router.get('/audit-logs', hasPermission('admin:access'), adminController.getAuditLogs);

// Get system analytics (admin)
router.get('/analytics', hasPermission('admin:access'), adminController.getSystemAnalytics);

// Get system health (admin)
router.get('/health', hasPermission('admin:access'), adminController.getSystemHealth);

// Toggle maintenance mode (admin)
router.post('/maintenance', hasPermission('admin:access'), adminController.toggleMaintenanceMode);

// Get user feedback (admin)
router.get('/feedback', hasPermission('admin:access'), adminController.getUserFeedback);

// Respond to user feedback (admin)
router.post('/feedback/:feedbackId/respond', hasPermission('admin:access'), adminController.respondToFeedback);

// Database Migration Routes
// List available migrations
router.get('/migrations', hasPermission('admin:access'), adminController.listMigrations);

// Run a specific migration
router.post('/migrations/:migrationName/run', hasPermission('admin:access'), adminController.runMigration);

// Run all pending migrations
router.post('/migrations/run-all', hasPermission('admin:access'), adminController.runAllMigrations);

// Get migration status
router.get('/migrations/status', hasPermission('admin:access'), adminController.getMigrationStatus);

export default router;