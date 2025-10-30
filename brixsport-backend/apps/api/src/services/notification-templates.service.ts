import { logger } from '../utils/logger';
import { supabase } from './supabase.service';
import { NotificationTemplate } from '../types/notification.types';

interface DatabaseNotificationTemplate {
  id: string;
  name: string;
  type: string;
  title_template: string;
  message_template: string;
  default_priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
  default_category: string;
  variables: string[];
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

class NotificationTemplatesService {
  // Get all notification templates
  async getAllTemplates(options: { 
    activeOnly?: boolean; 
    limit?: number; 
    offset?: number 
  } = {}): Promise<{ 
    templates: NotificationTemplate[]; 
    total: number; 
    totalPages: number 
  }> {
    try {
      logger.info('Fetching notification templates', { options });
      
      let query = supabase
        .from('notification_templates')
        .select('*');
      
      // Filter by active status if requested
      if (options.activeOnly) {
        query = query.eq('is_active', true);
      }
      
      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }
      
      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });
      
      const { data, error, count } = await query;
      
      if (error) {
        logger.error('Database error fetching notification templates', { error: error.message });
        throw new Error(`Failed to fetch notification templates: ${error.message}`);
      }
      
      // Map database rows to NotificationTemplate objects
      const templates = (data || []).map(this.mapDbToTemplate);
      
      const total = count || templates.length;
      const totalPages = options.limit ? Math.ceil(total / options.limit) : 1;
      
      return {
        templates,
        total,
        totalPages
      };
    } catch (error: any) {
      logger.error('Get all templates error', error);
      throw error;
    }
  }
  
  // Get notification template by ID
  async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    try {
      logger.info('Fetching notification template', { templateId });
      
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('id', templateId)
        .single<DatabaseNotificationTemplate>();
      
      if (error) {
        // Check if it's a "no rows" error
        if ((error as any).code === 'PGRST116') {
          return null;
        }
        
        logger.error('Database error fetching notification template', { error: error.message, templateId });
        throw new Error(`Failed to fetch notification template: ${error.message}`);
      }
      
      if (!data) {
        return null;
      }
      
      return this.mapDbToTemplate(data);
    } catch (error: any) {
      logger.error('Get template error', error);
      throw error;
    }
  }
  
  // Create notification template
  async createTemplate(templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotificationTemplate> {
    try {
      logger.info('Creating notification template', { templateData });
      
      const dbTemplate: Omit<DatabaseNotificationTemplate, 'id' | 'created_at' | 'updated_at'> = {
        name: templateData.name,
        type: templateData.type,
        title_template: templateData.titleTemplate,
        message_template: templateData.messageTemplate,
        default_priority: templateData.defaultPriority,
        default_category: templateData.defaultCategory,
        variables: templateData.variables,
        is_active: templateData.isActive,
        metadata: templateData.metadata
      };
      
      const { data, error } = await supabase
        .from('notification_templates')
        .insert([dbTemplate])
        .select()
        .single<DatabaseNotificationTemplate>();
      
      if (error) {
        logger.error('Database error creating notification template', { error: error.message });
        throw new Error(`Failed to create notification template: ${error.message}`);
      }
      
      return this.mapDbToTemplate(data);
    } catch (error: any) {
      logger.error('Create template error', error);
      throw error;
    }
  }
  
  // Update notification template
  async updateTemplate(templateId: string, updateData: Partial<NotificationTemplate>): Promise<NotificationTemplate | null> {
    try {
      logger.info('Updating notification template', { templateId, updateData });
      
      // Prepare the data for update
      const dbUpdateData: Partial<DatabaseNotificationTemplate> = {};
      
      if (updateData.name !== undefined) dbUpdateData.name = updateData.name;
      if (updateData.type !== undefined) dbUpdateData.type = updateData.type;
      if (updateData.titleTemplate !== undefined) dbUpdateData.title_template = updateData.titleTemplate;
      if (updateData.messageTemplate !== undefined) dbUpdateData.message_template = updateData.messageTemplate;
      if (updateData.defaultPriority !== undefined) dbUpdateData.default_priority = updateData.defaultPriority;
      if (updateData.defaultCategory !== undefined) dbUpdateData.default_category = updateData.defaultCategory;
      if (updateData.variables !== undefined) dbUpdateData.variables = updateData.variables;
      if (updateData.isActive !== undefined) dbUpdateData.is_active = updateData.isActive;
      if (updateData.metadata !== undefined) dbUpdateData.metadata = updateData.metadata;
      
      dbUpdateData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('notification_templates')
        .update(dbUpdateData)
        .eq('id', templateId)
        .select()
        .single<DatabaseNotificationTemplate>();
      
      if (error) {
        // Check if it's a "no rows" error
        if ((error as any).code === 'PGRST116') {
          return null;
        }
        
        logger.error('Database error updating notification template', { error: error.message, templateId });
        throw new Error(`Failed to update notification template: ${error.message}`);
      }
      
      if (!data) {
        return null;
      }
      
      return this.mapDbToTemplate(data);
    } catch (error: any) {
      logger.error('Update template error', error);
      throw error;
    }
  }
  
  // Delete notification template
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      logger.info('Deleting notification template', { templateId });
      
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', templateId);
      
      if (error) {
        logger.error('Database error deleting notification template', { error: error.message, templateId });
        throw new Error(`Failed to delete notification template: ${error.message}`);
      }
      
      return true;
    } catch (error: any) {
      logger.error('Delete template error', error);
      throw error;
    }
  }
  
  // Map database row to NotificationTemplate
  private mapDbToTemplate(dbRow: DatabaseNotificationTemplate): NotificationTemplate {
    return {
      id: dbRow.id,
      name: dbRow.name,
      type: dbRow.type,
      titleTemplate: dbRow.title_template,
      messageTemplate: dbRow.message_template,
      defaultPriority: dbRow.default_priority,
      defaultCategory: dbRow.default_category,
      variables: dbRow.variables,
      isActive: dbRow.is_active,
      metadata: dbRow.metadata,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at
    };
  }
}

// Create and export a singleton instance of the service
const notificationTemplatesService = new NotificationTemplatesService();

export { notificationTemplatesService };