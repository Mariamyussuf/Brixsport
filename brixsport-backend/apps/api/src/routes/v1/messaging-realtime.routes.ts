import { Router, Request, Response } from 'express';
import messagingRealtimeService from '../../services/messaging-realtime.service';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * @openapi
 * /api/v1/messaging/typing/{conversationId}:
 *   post:
 *     tags:
 *       - Messaging Realtime
 *     summary: Update typing indicator
 *     description: Set or update typing indicator for a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Typing indicator updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/typing/:conversationId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { conversationId } = req.params;

    await messagingRealtimeService.updateTypingIndicator(conversationId, userId);

    return res.json({ success: true, message: 'Typing indicator updated' });
  } catch (error: any) {
    logger.error('Update typing indicator error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/typing/{conversationId}:
 *   delete:
 *     tags:
 *       - Messaging Realtime
 *     summary: Stop typing indicator
 *     description: Remove typing indicator for a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Typing indicator stopped
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/typing/:conversationId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { conversationId } = req.params;

    await messagingRealtimeService.stopTypingIndicator(conversationId, userId);

    return res.json({ success: true, message: 'Typing indicator stopped' });
  } catch (error: any) {
    logger.error('Stop typing indicator error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/typing/{conversationId}:
 *   get:
 *     tags:
 *       - Messaging Realtime
 *     summary: Get typing users
 *     description: Get list of users currently typing in a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: List of typing users
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/typing/:conversationId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { conversationId } = req.params;

    const typingUsers = await messagingRealtimeService.getTypingUsers(conversationId);

    return res.json({ success: true, data: typingUsers });
  } catch (error: any) {
    logger.error('Get typing users error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/messages/{messageId}/delivery:
 *   post:
 *     tags:
 *       - Messaging Realtime
 *     summary: Track message delivery
 *     description: Update message delivery status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [sent, delivered, failed]
 *     responses:
 *       200:
 *         description: Delivery status updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/messages/:messageId/delivery', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { messageId } = req.params;
    const { status } = req.body;

    await messagingRealtimeService.trackMessageDelivery(messageId, userId, status);

    return res.json({ success: true, message: 'Delivery status updated' });
  } catch (error: any) {
    logger.error('Track message delivery error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/messages/{messageId}/delivery:
 *   get:
 *     tags:
 *       - Messaging Realtime
 *     summary: Get message delivery status
 *     description: Get delivery status for a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message delivery status
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/messages/:messageId/delivery', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { messageId } = req.params;

    const deliveryStatus = await messagingRealtimeService.getMessageDeliveryStatus(messageId);

    return res.json({ success: true, data: deliveryStatus });
  } catch (error: any) {
    logger.error('Get message delivery status error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/messages/{messageId}/reactions:
 *   post:
 *     tags:
 *       - Messaging Realtime
 *     summary: Add message reaction
 *     description: Add a reaction to a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *                 description: Emoji to react with
 *     responses:
 *       201:
 *         description: Reaction added
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/messages/:messageId/reactions', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Emoji is required' } });
    }

    const reaction = await messagingRealtimeService.addMessageReaction(messageId, userId, emoji);

    return res.status(201).json({ success: true, data: reaction });
  } catch (error: any) {
    logger.error('Add message reaction error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/messages/{messageId}/reactions:
 *   delete:
 *     tags:
 *       - Messaging Realtime
 *     summary: Remove message reaction
 *     description: Remove a reaction from a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emoji
 *             properties:
 *               emoji:
 *                 type: string
 *                 description: Emoji to remove
 *     responses:
 *       200:
 *         description: Reaction removed
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/messages/:messageId/reactions', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Emoji is required' } });
    }

    await messagingRealtimeService.removeMessageReaction(messageId, userId, emoji);

    return res.json({ success: true, message: 'Reaction removed' });
  } catch (error: any) {
    logger.error('Remove message reaction error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/messages/{messageId}/reactions:
 *   get:
 *     tags:
 *       - Messaging Realtime
 *     summary: Get message reactions
 *     description: Get all reactions for a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message reactions
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/messages/:messageId/reactions', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { messageId } = req.params;

    const reactions = await messagingRealtimeService.getMessageReactions(messageId);

    return res.json({ success: true, data: reactions });
  } catch (error: any) {
    logger.error('Get message reactions error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/messages/{messageId}/read:
 *   post:
 *     tags:
 *       - Messaging Realtime
 *     summary: Mark message as read
 *     description: Mark a message as read and update read receipts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as read
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/messages/:messageId/read', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { messageId } = req.params;

    await messagingRealtimeService.markMessageRead(messageId, userId);

    return res.json({ success: true, message: 'Message marked as read' });
  } catch (error: any) {
    logger.error('Mark message read error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/messages/{messageId}/receipts:
 *   get:
 *     tags:
 *       - Messaging Realtime
 *     summary: Get message read receipts
 *     description: Get read receipts for a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message read receipts
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/messages/:messageId/receipts', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { messageId } = req.params;

    const receipts = await messagingRealtimeService.getMessageReadReceipts(messageId);

    return res.json({ success: true, data: receipts });
  } catch (error: any) {
    logger.error('Get message read receipts error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/announcements:
 *   post:
 *     tags:
 *       - Messaging Realtime
 *     summary: Create announcement
 *     description: Create a system announcement (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent, critical]
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               scheduled_at:
 *                 type: string
 *                 format: date-time
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *               is_pinned:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Announcement created
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/announcements', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { title, content, priority, category, tags, scheduled_at, expires_at, is_pinned } = req.body;

    if (!title || !content || !priority) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'INVALID_REQUEST', message: 'Title, content, and priority are required' } 
      });
    }

    const announcement = await messagingRealtimeService.createAnnouncement(userId, {
      title,
      content,
      priority,
      category,
      tags,
      scheduled_at,
      expires_at,
      is_pinned
    });

    return res.status(201).json({ success: true, data: announcement });
  } catch (error: any) {
    logger.error('Create announcement error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/announcements:
 *   get:
 *     tags:
 *       - Messaging Realtime
 *     summary: Get announcements
 *     description: Get list of announcements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of announcements
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/announcements', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { status, priority, category, page = 1, limit = 50 } = req.query;

    const result = await messagingRealtimeService.getAnnouncements(
      userId,
      {
        status: status as string,
        priority: priority as string,
        category: category as string
      },
      {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100)
      }
    );

    return res.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Get announcements error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/announcements/{id}:
 *   put:
 *     tags:
 *       - Messaging Realtime
 *     summary: Update announcement
 *     description: Update an announcement (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *               is_pinned:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Announcement updated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/announcements/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { id } = req.params;
    const updates = req.body;

    const announcement = await messagingRealtimeService.updateAnnouncement(userId, id, updates);

    return res.json({ success: true, data: announcement });
  } catch (error: any) {
    logger.error('Update announcement error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

/**
 * @openapi
 * /api/v1/messaging/announcements/{id}:
 *   delete:
 *     tags:
 *       - Messaging Realtime
 *     summary: Delete announcement
 *     description: Delete an announcement (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/announcements/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const { id } = req.params;

    await messagingRealtimeService.deleteAnnouncement(userId, id);

    return res.json({ success: true, message: 'Announcement deleted' });
  } catch (error: any) {
    logger.error('Delete announcement error', { error: error.message });
    return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  }
});

export { router as messagingRealtimeRoutes };