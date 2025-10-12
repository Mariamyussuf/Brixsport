import { Router, Request, Response } from 'express';
import { notificationPreferencesController } from '../../controllers/notification-preferences.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { 
  updateNotificationPreferencesSchema 
} from '../../validation/notification-preferences.validation';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @openapi
 * /api/v1/notification-preferences:
 *   get:
 *     tags:
 *       - Notification Preferences
 *     summary: Get user's notification preferences
 *     description: Retrieve the current user's notification preferences
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved notification preferences
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationPreferences'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', (req: Request, res: Response) => {
  return notificationPreferencesController.getPreferences(req, res);
});

/**
 * @openapi
 * /api/v1/notification-preferences:
 *   put:
 *     tags:
 *       - Notification Preferences
 *     summary: Update user's notification preferences
 *     description: Update the current user's notification preferences
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNotificationPreferencesDto'
 *     responses:
 *       200:
 *         description: Successfully updated notification preferences
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationPreferences'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put(
  '/', 
  validate(updateNotificationPreferencesSchema),
  (req: Request, res: Response) => {
    return notificationPreferencesController.updatePreferences(req, res);
  }
);

export { router as notificationPreferencesRoutes };