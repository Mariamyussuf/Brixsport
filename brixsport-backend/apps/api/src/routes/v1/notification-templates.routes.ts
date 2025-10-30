import { Router, Request, Response } from 'express';
import { notificationTemplatesController } from '@controllers/notification-templates.controller';
import { authenticate } from '@middleware/auth.middleware';
import { requireAdmin } from '@middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @openapi
 * /api/v1/notification-templates:
 *   get:
 *     tags:
 *       - Notification Templates
 *     summary: Get all notification templates
 *     description: Retrieve all notification templates with filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
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
 *         description: Successfully retrieved notification templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 templates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/NotificationTemplate'
 *                 total:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', requireAdmin, (req: Request, res: Response) => {
  return notificationTemplatesController.getAllTemplates(req, res);
});

/**
 * @openapi
 * /api/v1/notification-templates/{id}:
 *   get:
 *     tags:
 *       - Notification Templates
 *     summary: Get notification template by ID
 *     description: Retrieve a specific notification template by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved notification template
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/NotificationTemplate'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Template not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', requireAdmin, (req: Request, res: Response) => {
  return notificationTemplatesController.getTemplate(req, res);
});

/**
 * @openapi
 * /api/v1/notification-templates:
 *   post:
 *     tags:
 *       - Notification Templates
 *     summary: Create notification template
 *     description: Create a new notification template
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotificationTemplateDto'
 *     responses:
 *       201:
 *         description: Notification template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/NotificationTemplate'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', requireAdmin, (req: Request, res: Response) => {
  return notificationTemplatesController.createTemplate(req, res);
});

/**
 * @openapi
 * /api/v1/notification-templates/{id}:
 *   put:
 *     tags:
 *       - Notification Templates
 *     summary: Update notification template
 *     description: Update an existing notification template
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
 *             $ref: '#/components/schemas/UpdateNotificationTemplateDto'
 *     responses:
 *       200:
 *         description: Notification template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/NotificationTemplate'
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
router.put('/:id', requireAdmin, (req: Request, res: Response) => {
  return notificationTemplatesController.updateTemplate(req, res);
});

/**
 * @openapi
 * /api/v1/notification-templates/{id}:
 *   delete:
 *     tags:
 *       - Notification Templates
 *     summary: Delete notification template
 *     description: Delete a notification template by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification template deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Template not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', requireAdmin, (req: Request, res: Response) => {
  return notificationTemplatesController.deleteTemplate(req, res);
});

export { router as notificationTemplatesRoutes };