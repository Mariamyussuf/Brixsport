import { Router, Request, Response } from 'express';
import { notificationsController } from '@controllers/notifications.controller';
import { authenticate } from '@middleware/auth.middleware';
import { validate } from '@middleware/validation.middleware';
import { requireAdmin, requireLogger } from '@middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Get user notifications
 *     description: Retrieve notifications for the current user with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UNREAD, READ, ARCHIVED, DELETED]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, NORMAL, HIGH, URGENT, CRITICAL]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Successfully retrieved notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', (req: Request, res: Response) => {
  return notificationsController.getUserNotifications(req, res);
});

/**
 * @openapi
 * /api/v1/notifications:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Create a notification
 *     description: Create a new notification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotificationDto'
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', (req: Request, res: Response) => {
  return notificationsController.createNotification(req, res);
});

/**
 * @openapi
 * /api/v1/notifications/read-all:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Mark all notifications as read
 *     description: Mark all notifications for the current user as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully marked all notifications as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/read-all', (req: Request, res: Response) => {
  return notificationsController.markAllAsRead(req, res);
});

/**
 * @openapi
 * /api/v1/notifications/clear:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Clear all notifications
 *     description: Delete all notifications for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully cleared notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/clear', (req: Request, res: Response) => {
  return notificationsController.clearNotifications(req, res);
});

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully marked notification as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Notification not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id/read', (req: Request, res: Response) => {
  return notificationsController.markAsRead(req, res);
});

/**
 * @openapi
 * /api/v1/notifications/{id}/status:
 *   put:
 *     tags:
 *       - Notifications
 *     summary: Update notification status
 *     description: Update the status of a specific notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [UNREAD, READ, ARCHIVED, DELETED]
 *     responses:
 *       200:
 *         description: Successfully updated notification status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Notification not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id/status', (req: Request, res: Response) => {
  return notificationsController.updateNotificationStatus(req, res);
});

/**
 * @openapi
 * /api/v1/notifications/batch-update:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: Batch update notifications
 *     description: Update the status of multiple notifications at once
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [UNREAD, READ, ARCHIVED, DELETED]
 *     responses:
 *       200:
 *         description: Successfully updated notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updatedCount:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/batch-update', (req: Request, res: Response) => {
  return notificationsController.batchUpdateNotifications(req, res);
});

/**
 * @openapi
 * /api/v1/notifications/{id}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Delete notification
 *     description: Delete a specific notification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully deleted notification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Notification not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', (req: Request, res: Response) => {
  return notificationsController.deleteNotification(req, res);
});

// Admin routes
/**
 * @openapi
 * /api/v1/admin/notifications/send:
 *   post:
 *     tags:
 *       - Admin Notifications
 *     summary: Send notification to users
 *     description: Send a notification to specified recipients
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendNotificationPayload'
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *                 sentTo:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/admin/notifications/send', requireAdmin, (req: Request, res: Response) => {
  return notificationsController.sendNotification(req, res);
});

/**
 * @openapi
 * /api/v1/admin/notifications/send-template:
 *   post:
 *     tags:
 *       - Admin Notifications
 *     summary: Send notification using template
 *     description: Send a notification to specified recipients using a template
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendTemplatePayload'
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 sentTo:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Template not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/admin/notifications/send-template', requireAdmin, (req: Request, res: Response) => {
  return notificationsController.sendTemplateNotification(req, res);
});

/**
 * @openapi
 * /api/v1/admin/notifications/history:
 *   get:
 *     tags:
 *       - Admin Notifications
 *     summary: Get notification history
 *     description: Retrieve notification delivery history with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [QUEUED, SENT, DELIVERED, FAILED, CLICKED]
 *       - in: query
 *         name: deliveryMethod
 *         schema:
 *           type: string
 *           enum: [PUSH, EMAIL, SMS, IN_APP]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Successfully retrieved notification history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NotificationHistory'
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/admin/notifications/history', requireAdmin, (req: Request, res: Response) => {
  return notificationsController.getNotificationHistory(req, res);
});

// Logger routes
/**
 * @openapi
 * /api/v1/logger/notifications/send:
 *   post:
 *     tags:
 *       - Logger Notifications
 *     summary: Send logging notification
 *     description: Send a system logging notification to specified recipients
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendLoggingNotificationPayload'
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *                 sentTo:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/logger/notifications/send', requireLogger, (req: Request, res: Response) => {
  return notificationsController.sendLoggingNotification(req, res);
});

/**
 * @openapi
 * /api/v1/logger/notifications/send-pr-merged:
 *   post:
 *     tags:
 *       - Logger Notifications
 *     summary: Send PR merged notification
 *     description: Send a pull request merged notification to specified recipients
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendPrMergedPayload'
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *                 sentTo:
 *                   type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/logger/notifications/send-pr-merged', requireLogger, (req: Request, res: Response) => {
  return notificationsController.sendPrMergedNotification(req, res);
});

export { router as notificationsRoutes };