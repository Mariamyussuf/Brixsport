import { Router, Request, Response } from 'express';
import { cloudMessagingController } from '../../controllers/cloud-messaging.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @openapi
 * /api/v1/cloud-messaging/device-tokens:
 *   post:
 *     tags:
 *       - Cloud Messaging
 *     summary: Register a device token for push notifications
 *     description: Register a device token for receiving push notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - platform
 *             properties:
 *               token:
 *                 type: string
 *                 description: The FCM device token
 *               platform:
 *                 type: string
 *                 enum: [ios, android, web]
 *                 description: The device platform
 *     responses:
 *       200:
 *         description: Device token registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/device-tokens', (req: Request, res: Response) => {
  return cloudMessagingController.registerDeviceToken(req, res);
});

/**
 * @openapi
 * /api/v1/cloud-messaging/device-tokens:
 *   delete:
 *     tags:
 *       - Cloud Messaging
 *     summary: Remove a device token
 *     description: Remove a device token to stop receiving push notifications on that device
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: The FCM device token to remove
 *     responses:
 *       200:
 *         description: Device token removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/device-tokens', (req: Request, res: Response) => {
  return cloudMessagingController.removeDeviceToken(req, res);
});

/**
 * @openapi
 * /api/v1/cloud-messaging/device-tokens:
 *   get:
 *     tags:
 *       - Cloud Messaging
 *     summary: Get user's device tokens
 *     description: Retrieve all device tokens registered for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved device tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       token:
 *                         type: string
 *                       platform:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/device-tokens', (req: Request, res: Response) => {
  return cloudMessagingController.getUserDeviceTokens(req, res);
});

/**
 * @openapi
 * /api/v1/cloud-messaging/topics/subscribe:
 *   post:
 *     tags:
 *       - Cloud Messaging
 *     summary: Subscribe to a topic
 *     description: Subscribe the user's devices to a topic for receiving topic-based notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 description: The topic name to subscribe to
 *     responses:
 *       200:
 *         description: Successfully subscribed to topic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     successCount:
 *                       type: integer
 *                     failureCount:
 *                       type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/topics/subscribe', (req: Request, res: Response) => {
  return cloudMessagingController.subscribeToTopic(req, res);
});

/**
 * @openapi
 * /api/v1/cloud-messaging/topics/unsubscribe:
 *   post:
 *     tags:
 *       - Cloud Messaging
 *     summary: Unsubscribe from a topic
 *     description: Unsubscribe the user's devices from a topic
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *                 description: The topic name to unsubscribe from
 *     responses:
 *       200:
 *         description: Successfully unsubscribed from topic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     successCount:
 *                       type: integer
 *                     failureCount:
 *                       type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/topics/unsubscribe', (req: Request, res: Response) => {
  return cloudMessagingController.unsubscribeFromTopic(req, res);
});

export { router as cloudMessagingRoutes };