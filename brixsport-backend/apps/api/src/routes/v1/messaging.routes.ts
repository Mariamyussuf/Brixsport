import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';
import { messagingService } from '../../services/messaging.service';
import { logger } from '../../utils/logger';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @openapi
 * /api/v1/messaging/conversations:
 *   get:
 *     tags:
 *       - Messaging
 *     summary: List user conversations
 *     description: Get a list of conversations the user is participating in
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter conversations by type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved conversations
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
 *                     $ref: '#/components/schemas/Conversation'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { type, page = 1, limit = 50 } = req.query;

    const result = await messagingService.getUserConversations(
      userId,
      {
        type: type as string,
        sortBy: 'updated_at',
        sortOrder: 'DESC'
      },
      {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100)
      }
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    logger.error('Error fetching conversations', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching conversations' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/conversations:
 *   post:
 *     tags:
 *       - Messaging
 *     summary: Create a new conversation
 *     description: Create a new conversation (admin only for announcement/broadcast types)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - participantIds
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [announcement, broadcast, direct, group, channel]
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Bad request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { type, name, description, participantIds } = req.body;

    // Validate required fields
    if (!type || !participantIds) {
      return res.status(400).json({ 
        success: false,
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Type and participantIds are required' 
        } 
      });
    }

    // Check if user is admin for announcement/broadcast types
    if ((type === 'announcement' || type === 'broadcast') && !(req as any).user?.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Only administrators can create announcement/broadcast conversations' 
        } 
      });
    }

    const conversation = await messagingService.createConversation(userId, {
      type,
      name,
      description,
      participantIds
    });

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error: any) {
    logger.error('Error creating conversation', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while creating the conversation' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/conversations/{id}:
 *   get:
 *     tags:
 *       - Messaging
 *     summary: Get conversation details
 *     description: Get details of a specific conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Successfully retrieved conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Conversation'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Conversation not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;

    const conversation = await messagingService.getConversationDetails(userId, conversationId);

    if (!conversation) {
      return res.status(404).json({ 
        success: false,
        error: { 
          code: 'NOT_FOUND', 
          message: 'Conversation not found' 
        } 
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error: any) {
    logger.error('Error fetching conversation', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching the conversation' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/conversations/{id}:
 *   put:
 *     tags:
 *       - Messaging
 *     summary: Update conversation
 *     description: Update conversation settings (owner/admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               avatar_url:
 *                 type: string
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Conversation updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Conversation'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Conversation not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;
    const { name, description, avatar_url, settings } = req.body;

    const conversation = await messagingService.updateConversation(userId, conversationId, {
      name,
      description,
      avatar_url,
      settings
    });

    res.json({
      success: true,
      data: conversation
    });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions to update conversation') {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions to update conversation' 
        } 
      });
    }
    
    logger.error('Error updating conversation', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while updating the conversation' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/conversations/{id}:
 *   delete:
 *     tags:
 *       - Messaging
 *     summary: Delete conversation
 *     description: Delete a conversation (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Conversation not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;

    await messagingService.deleteConversation(userId, conversationId);

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions to delete conversation') {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions to delete conversation' 
        } 
      });
    }
    
    logger.error('Error deleting conversation', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while deleting the conversation' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/conversations/{id}/participants:
 *   post:
 *     tags:
 *       - Messaging
 *     summary: Add participant to conversation
 *     description: Add a participant to a conversation (owner/admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantId
 *             properties:
 *               participantId:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, moderator, member]
 *     responses:
 *       201:
 *         description: Participant added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ConversationParticipant'
 *       400:
 *         description: Bad request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Conversation not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/conversations/:id/participants', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;
    const { participantId, role } = req.body;

    // Validate required fields
    if (!participantId) {
      return res.status(400).json({ 
        success: false,
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Participant ID is required' 
        } 
      });
    }

    const participant = await messagingService.addParticipant(
      userId,
      conversationId,
      participantId,
      role
    );

    res.status(201).json({
      success: true,
      data: participant
    });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions to add participant') {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions to add participant' 
        } 
      });
    }
    
    if (error.message === 'Participant already in conversation') {
      return res.status(400).json({ 
        success: false,
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Participant already in conversation' 
        } 
      });
    }
    
    logger.error('Error adding participant', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while adding the participant' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/conversations/{id}/participants/{participantId}:
 *   delete:
 *     tags:
 *       - Messaging
 *     summary: Remove participant from conversation
 *     description: Remove a participant from a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *       - in: path
 *         name: participantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Participant ID
 *     responses:
 *       200:
 *         description: Participant removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Conversation or participant not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/conversations/:id/participants/:participantId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: conversationId, participantId } = req.params;

    await messagingService.removeParticipant(userId, conversationId, participantId);

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions to remove participant') {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions to remove participant' 
        } 
      });
    }
    
    if (error.message === 'Insufficient permissions to remove other participants') {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions to remove other participants' 
        } 
      });
    }
    
    logger.error('Error removing participant', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while removing the participant' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/conversations/{id}/participants/{participantId}/role:
 *   put:
 *     tags:
 *       - Messaging
 *     summary: Update participant role
 *     description: Update a participant's role in a conversation (owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *       - in: path
 *         name: participantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Participant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, moderator, member]
 *     responses:
 *       200:
 *         description: Participant role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ConversationParticipant'
 *       400:
 *         description: Bad request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Conversation or participant not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/conversations/:id/participants/:participantId/role', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: conversationId, participantId } = req.params;
    const { role } = req.body;

    // Validate required fields
    if (!role) {
      return res.status(400).json({ 
        success: false,
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Role is required' 
        } 
      });
    }

    const participant = await messagingService.updateParticipantRole(
      userId,
      conversationId,
      participantId,
      role
    );

    res.json({
      success: true,
      data: participant
    });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions to update participant role') {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions to update participant role' 
        } 
      });
    }
    
    if (error.message === 'Cannot change owner role') {
      return res.status(400).json({ 
        success: false,
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Cannot change owner role' 
        } 
      });
    }
    
    logger.error('Error updating participant role', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while updating the participant role' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/conversations/{id}/messages:
 *   get:
 *     tags:
 *       - Messaging
 *     summary: Get messages in conversation
 *     description: Get messages in a conversation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Get messages before this timestamp
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *         description: Get messages after this timestamp
 *     responses:
 *       200:
 *         description: Successfully retrieved messages
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
 *                     $ref: '#/components/schemas/Message'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Conversation not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;
    const { page = 1, limit = 50, before, after } = req.query;

    const result = await messagingService.getMessages(
      userId,
      conversationId,
      {
        page: parseInt(page as string),
        limit: Math.min(parseInt(limit as string), 100),
        before: before as string,
        after: after as string
      }
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    if (error.message === 'Access denied to conversation') {
      return res.status(404).json({ 
        success: false,
        error: { 
          code: 'NOT_FOUND', 
          message: 'Conversation not found or access denied' 
        } 
      });
    }
    
    logger.error('Error fetching messages', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while fetching messages' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/conversations/{id}/messages:
 *   post:
 *     tags:
 *       - Messaging
 *     summary: Send message
 *     description: Send a message in a conversation (admin only for system messages)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               content_type:
 *                 type: string
 *                 enum: [text, image, file, system, poll, rich_text]
 *               parent_message_id:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [image, video, document, audio]
 *                     url:
 *                       type: string
 *                     name:
 *                       type: string
 *                     size:
 *                       type: integer
 *                     mimeType:
 *                       type: string
 *               mention_user_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Bad request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Conversation not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;
    const { content, content_type, parent_message_id, attachments, mention_user_ids } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({ 
        success: false,
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Content is required' 
        } 
      });
    }

    // Check if user is admin for system messages
    if (content_type === 'system' && !(req as any).user?.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Only administrators can send system messages' 
        } 
      });
    }

    const message = await messagingService.sendMessage(userId, conversationId, {
      content,
      content_type,
      parent_message_id,
      attachments,
      mention_user_ids
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error: any) {
    if (error.message === 'Access denied to conversation') {
      return res.status(404).json({ 
        success: false,
        error: { 
          code: 'NOT_FOUND', 
          message: 'Conversation not found or access denied' 
        } 
      });
    }
    
    logger.error('Error sending message', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while sending the message' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/messages/{id}:
 *   put:
 *     tags:
 *       - Messaging
 *     summary: Update message
 *     description: Update a message (sender only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Bad request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Message not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/messages/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: messageId } = req.params;
    const { content } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({ 
        success: false,
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Content is required' 
        } 
      });
    }

    const message = await messagingService.updateMessage(userId, messageId, content);

    res.json({
      success: true,
      data: message
    });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions to update message') {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions to update message' 
        } 
      });
    }
    
    logger.error('Error updating message', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while updating the message' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/messages/{id}:
 *   delete:
 *     tags:
 *       - Messaging
 *     summary: Delete message
 *     description: Delete a message (sender or admin/owner only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Message not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/messages/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: messageId } = req.params;

    await messagingService.deleteMessage(userId, messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error: any) {
    if (error.message === 'Insufficient permissions to delete message') {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions to delete message' 
        } 
      });
    }
    
    if (error.message === 'Message not found or already deleted') {
      return res.status(404).json({ 
        success: false,
        error: { 
          code: 'NOT_FOUND', 
          message: 'Message not found or already deleted' 
        } 
      });
    }
    
    logger.error('Error deleting message', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while deleting the message' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/messages/{id}/react:
 *   post:
 *     tags:
 *       - Messaging
 *     summary: Add reaction to message
 *     description: Add a reaction to a message
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *     responses:
 *       200:
 *         description: Reaction added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Bad request
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Message not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/messages/:id/react', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: messageId } = req.params;
    const { emoji } = req.body;

    // Validate required fields
    if (!emoji) {
      return res.status(400).json({ 
        success: false,
        error: { 
          code: 'INVALID_REQUEST', 
          message: 'Emoji is required' 
        } 
      });
    }

    const message = await messagingService.addReaction(userId, messageId, emoji);

    res.json({
      success: true,
      data: message
    });
  } catch (error: any) {
    if (error.message === 'Message not found or deleted') {
      return res.status(404).json({ 
        success: false,
        error: { 
          code: 'NOT_FOUND', 
          message: 'Message not found or deleted' 
        } 
      });
    }
    
    if (error.message === 'Access denied to conversation') {
      return res.status(404).json({ 
        success: false,
        error: { 
          code: 'NOT_FOUND', 
          message: 'Conversation not found or access denied' 
        } 
      });
    }
    
    logger.error('Error adding reaction', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while adding the reaction' 
      } 
    });
  }
});

/**
 * @openapi
 * /api/v1/messaging/conversations/{id}/read:
 *   post:
 *     tags:
 *       - Messaging
 *     summary: Mark messages as read
 *     description: Mark all messages in a conversation as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Conversation not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/conversations/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id: conversationId } = req.params;

    await messagingService.markMessagesRead(userId, conversationId);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error: any) {
    if (error.message === 'Access denied to conversation') {
      return res.status(404).json({ 
        success: false,
        error: { 
          code: 'NOT_FOUND', 
          message: 'Conversation not found or access denied' 
        } 
      });
    }
    
    logger.error('Error marking messages as read', { error: error.message });
    return res.status(500).json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'An error occurred while marking messages as read' 
      } 
    });
  }
});

export { router as messagingRoutes };