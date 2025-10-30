import { Request, Response } from 'express';
import { notificationTemplatesService } from '../services/notification-templates.service';
import { logger } from '../utils/logger';

// Extend the Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id?: string;
    role?: string;
    [key: string]: any;
  };
}

class NotificationTemplatesController {
  // Get all notification templates
  async getAllTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const filters = {
        activeOnly: req.query.activeOnly === 'true'
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? Math.min(parseInt(req.query.limit as string), 100) : 20
      };

      const result = await notificationTemplatesService.getAllTemplates({
        activeOnly: filters.activeOnly,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit
      });
      
      return res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      logger.error('Get all templates error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notification templates' 
      });
    }
  }

  // Get notification template by ID
  async getTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: templateId } = req.params;
      
      const template = await notificationTemplatesService.getTemplate(templateId);
      
      if (!template) {
        return res.status(404).json({ 
          success: false, 
          error: 'Template not found' 
        });
      }
      
      return res.json({
        success: true,
        data: template
      });
    } catch (error: any) {
      logger.error('Get template error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notification template' 
      });
    }
  }

  // Create notification template
  async createTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const templateData = req.body;
      
      const newTemplate = await notificationTemplatesService.createTemplate(templateData);
      
      return res.status(201).json({
        success: true,
        data: newTemplate
      });
    } catch (error: any) {
      logger.error('Create template error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create notification template' 
      });
    }
  }

  // Update notification template
  async updateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: templateId } = req.params;
      const updateData = req.body;
      
      const updatedTemplate = await notificationTemplatesService.updateTemplate(templateId, updateData);
      
      if (!updatedTemplate) {
        return res.status(404).json({ 
          success: false, 
          error: 'Template not found' 
        });
      }
      
      return res.json({
        success: true,
        data: updatedTemplate
      });
    } catch (error: any) {
      logger.error('Update template error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to update notification template' 
      });
    }
  }

  // Delete notification template
  async deleteTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: templateId } = req.params;
      
      const result = await notificationTemplatesService.deleteTemplate(templateId);
      
      if (!result) {
        return res.status(404).json({ 
          success: false, 
          error: 'Template not found' 
        });
      }
      
      return res.json({
        success: true
      });
    } catch (error: any) {
      logger.error('Delete template error', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to delete notification template' 
      });
    }
  }
}

// Create and export a singleton instance of the controller
const notificationTemplatesController = new NotificationTemplatesController();

export { notificationTemplatesController };