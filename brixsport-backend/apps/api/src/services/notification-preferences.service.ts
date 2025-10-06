import { logger } from '../utils/logger';
import { supabase } from './supabase.service';
import { 
  NotificationPreferences, 
  UpdateNotificationPreferencesDto,
  NotificationDeliveryMethods,
  NotificationCategories
} from '../types/notification.types';

interface DatabaseNotificationPreferences {
  id: number;
  user_id: string;
  delivery_methods: NotificationDeliveryMethods;
  categories: NotificationCategories;
  email_frequency: 'INSTANT' | 'DAILY' | 'WEEKLY' | 'NEVER';
  quiet_hours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  created_at: string;
  updated_at: string;
}

class NotificationPreferencesService {
  // Default delivery methods
  private defaultDeliveryMethods: NotificationDeliveryMethods = {
    push: true,
    email: true,
    sms: false,
    inApp: true
  };

  // Default categories
  private defaultCategories: NotificationCategories = {
    matchUpdates: true,
    teamNews: true,
    competitionNews: true,
    marketing: false,
    systemAlerts: true
  };

  // Default quiet hours
  private defaultQuietHours = {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  };

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      logger.info('Fetching notification preferences', { userId });
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single<DatabaseNotificationPreferences>();
      
      if (error) {
        // Check if it's a "no rows" error (which is expected if no preferences exist yet)
        const errorMessage = error.message || 'Unknown error';
        const errorCode = (error as any).code || 'UNKNOWN_ERROR';
        
        if (errorCode !== 'PGRST116') { // PGRST116 = no rows returned
          logger.error('Database error fetching notification preferences', { 
            error: errorMessage, 
            errorCode,
            userId 
          });
          throw new Error(`Failed to fetch notification preferences: ${errorMessage}`);
        }
        
        // For no rows, return default preferences
        logger.info('No existing notification preferences found, returning defaults', { userId });
        return this.createDefaultPreferences(userId);
      }
      
      // If we have data, map it to our preferences object
      if (data) {
        return this.mapDbToPreferences(data);
      }
      
      // Fallback to default preferences if no data
      return this.createDefaultPreferences(userId);
    } catch (error) {
      logger.error('Get notification preferences error', { error });
      throw error;
    }
  }
  
  /**
   * Update user notification preferences
   */
  async updateUserPreferences(
    userId: string, 
    updateDto: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreferences> {
    try {
      logger.info('Updating notification preferences', { userId, updateDto });
      
      // Get existing preferences or create default ones
      const existingPrefs = await this.getUserPreferences(userId);
      
      // Merge existing preferences with updates
      const updatedPrefs: NotificationPreferences = {
        ...existingPrefs,
        deliveryMethods: {
          ...existingPrefs.deliveryMethods,
          ...(updateDto.deliveryMethods || {})
        },
        categories: {
          ...existingPrefs.categories,
          ...(updateDto.categories || {})
        },
        emailFrequency: updateDto.emailFrequency || existingPrefs.emailFrequency,
        quietHours: updateDto.quietHours 
          ? { 
              ...(existingPrefs.quietHours || this.defaultQuietHours), 
              ...updateDto.quietHours 
            }
          : existingPrefs.quietHours,
        updatedAt: new Date().toISOString()
      };
      
      // Prepare the data for upsert
      const upsertData = {
        user_id: userId,
        delivery_methods: updatedPrefs.deliveryMethods,
        categories: updatedPrefs.categories,
        email_frequency: updatedPrefs.emailFrequency,
        quiet_hours: updatedPrefs.quietHours,
        created_at: existingPrefs.createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // First try to update
      const updateResult = await supabase
        .from('notification_preferences')
        .update(upsertData)
        .eq('user_id', userId);

      // If update didn't affect any rows, try to insert
      if (updateResult.status !== 200 || updateResult.count === 0) {
        const insertResult = await supabase
          .from('notification_preferences')
          .insert(upsertData)
          .select()
          .single<DatabaseNotificationPreferences>();
        
        if (insertResult.error) {
          throw new Error(`Failed to create notification preferences: ${insertResult.error.message}`);
        }
        
        if (insertResult.data) {
          return this.mapDbToPreferences(insertResult.data);
        }
      } else if (updateResult.error) {
        throw new Error(`Failed to update notification preferences: ${updateResult.error.message}`);
      }
      
      // If we got here, the update was successful, fetch the updated record
      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single<DatabaseNotificationPreferences>();
      
      if (fetchError || !data) {
        throw new Error('Failed to fetch updated notification preferences');
      }
      
      return this.mapDbToPreferences(data);
    } catch (error) {
      logger.error('Update notification preferences error', { error });
      throw error;
    }
  }
  
  /**
   * Create default notification preferences
   */
  private createDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      deliveryMethods: { ...this.defaultDeliveryMethods },
      categories: { ...this.defaultCategories },
      emailFrequency: 'DAILY',
      quietHours: { ...this.defaultQuietHours },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
  
  /**
   * Map database row to NotificationPreferences
   */
  private mapDbToPreferences(dbRow: DatabaseNotificationPreferences): NotificationPreferences {
    const deliveryMethods: NotificationDeliveryMethods = {
      push: dbRow.delivery_methods?.push ?? true,
      email: dbRow.delivery_methods?.email ?? true,
      sms: dbRow.delivery_methods?.sms ?? false,
      inApp: dbRow.delivery_methods?.inApp ?? true
    };

    const categories: NotificationCategories = {
      matchUpdates: dbRow.categories?.matchUpdates ?? true,
      teamNews: dbRow.categories?.teamNews ?? true,
      competitionNews: dbRow.categories?.competitionNews ?? true,
      marketing: dbRow.categories?.marketing ?? false,
      systemAlerts: dbRow.categories?.systemAlerts ?? true
    };

    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      deliveryMethods,
      categories,
      emailFrequency: dbRow.email_frequency || 'DAILY',
      quietHours: dbRow.quiet_hours || { ...this.defaultQuietHours },
      createdAt: dbRow.created_at || new Date().toISOString(),
      updatedAt: dbRow.updated_at || new Date().toISOString()
    };
  }
}

// Create and export a singleton instance of the service
const notificationPreferencesService = new NotificationPreferencesService();

export { notificationPreferencesService };
export default notificationPreferencesService;
