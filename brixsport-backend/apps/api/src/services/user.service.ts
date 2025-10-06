import { logger } from '../utils/logger';
import { userRules } from './userRules.service';
import { supabaseService } from './supabase.service';
import { supabase } from './supabase.service';

// Helper function to log user activity
const logUserActivity = async (userId: string, action: string, details?: any) => {
  try {
    const activityLog = {
      user_id: userId,
      action,
      details: details || {},
      ip_address: null, // Could be passed from request context
      user_agent: null, // Could be passed from request context
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_activity_logs')
      .insert([activityLog]);

    if (error) {
      logger.error('Failed to log user activity', { error: error.message, userId, action });
    }
  } catch (error: any) {
    logger.error('Error logging user activity', { error, userId, action });
  }
};

export const userService = {
  // Get user by email
  getUserByEmail: async (email: string) => {
    try {
      logger.info('Fetching user by email', { email });
      
      // Fetch user from Supabase
      const user = await supabaseService.getUserByEmail(email);
      
      return user;
    } catch (error: any) {
      logger.error('Get user by email error', error);
      throw error;
    }
  },
  
  // Create new user
  createUser: async (userData: any) => {
    try {
      logger.info('Creating new user', { userData });
      
      // Create user in Supabase
      const newUser = await supabaseService.createUser(userData);
      
      // Log the activity
      if (newUser && newUser.success && newUser.data) {
        await logUserActivity(newUser.data.id, 'user_created', {
          email: userData.email,
          role: userData.role || 'user'
        });
      }
      
      return newUser;
    } catch (error: any) {
      logger.error('Create user error', error);
      throw error;
    }
  },
  
  // Get current user profile
  getCurrentUser: async (userId: string) => {
    try {
      logger.info('Fetching current user profile', { userId });
      
      // Fetch user from Supabase
      const user = await supabaseService.getUserById(userId);
      
      if (user) {
        // Remove sensitive information
        const { password, ...publicUser } = user;
        
        return {
          success: true,
          data: publicUser
        };
      } else {
        throw new Error('User not found');
      }
    } catch (error: any) {
      logger.error('Get current user error', error);
      throw error;
    }
  },
  
  // Update profile with validation
  updateProfile: async (userId: string, profileData: any) => {
    try {
      logger.info('Updating user profile', { userId, profileData });
      
      // Validate profile data
      const validationErrors = userRules.validateProfileUpdate(profileData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }
      
      // Update user in Supabase
      const updatedUser = await supabaseService.updateUser(userId, profileData);
      
      if (updatedUser) {
        // Log the activity
        await logUserActivity(userId, 'profile_updated', {
          updatedFields: Object.keys(profileData)
        });
        
        // Remove sensitive information
        const { password, ...publicUser } = updatedUser;
        
        return {
          success: true,
          data: publicUser
        };
      } else {
        throw new Error('User not found');
      }
    } catch (error: any) {
      logger.error('Update profile error', error);
      throw error;
    }
  },
  
  // Upload profile picture
  uploadProfilePicture: async (userId: string, pictureData: any) => {
    try {
      logger.info('Uploading profile picture', { userId, pictureData });
      
      // Validate picture data
      if (!pictureData || !pictureData.url) {
        throw new Error('Picture URL is required');
      }
      
      // Update user avatar in Supabase
      const updatedUser = await supabaseService.updateUser(userId, { avatar: pictureData.url });
      
      if (updatedUser) {
        // Log the activity
        await logUserActivity(userId, 'profile_picture_uploaded', {
          avatarUrl: pictureData.url
        });
        
        return {
          success: true,
          data: {
            avatar: pictureData.url
          }
        };
      } else {
        throw new Error('User not found');
      }
    } catch (error: any) {
      logger.error('Upload profile picture error', error);
      throw error;
    }
  },
  
  // Remove profile picture
  removeProfilePicture: async (userId: string) => {
    try {
      logger.info('Removing profile picture', { userId });
      
      // Remove user avatar in Supabase
      const updatedUser = await supabaseService.updateUser(userId, { avatar: null });
      
      if (updatedUser) {
        // Log the activity
        await logUserActivity(userId, 'profile_picture_removed');
        
        return {
          success: true,
          data: {
            avatar: null
          }
        };
      } else {
        throw new Error('User not found');
      }
    } catch (error: any) {
      logger.error('Remove profile picture error', error);
      throw error;
    }
  },
  
  // Get user preferences
  getPreferences: async (userId: string) => {
    try {
      logger.info('Fetching user preferences', { userId });
      
      // Fetch user from Supabase
      const user = await supabaseService.getUserById(userId);
      
      if (user) {
        return {
          success: true,
          data: user.preferences || {
            theme: 'light',
            notifications: true,
            language: 'en'
          }
        };
      } else {
        throw new Error('User not found');
      }
    } catch (error: any) {
      logger.error('Get user preferences error', error);
      throw error;
    }
  },
  
  // Update user preferences
  updatePreferences: async (userId: string, preferences: any) => {
    try {
      logger.info('Updating user preferences', { userId, preferences });
      
      // Update preferences in Supabase
      const updatedUser = await supabaseService.updateUser(userId, { preferences });
      
      if (updatedUser) {
        return {
          success: true,
          data: updatedUser.preferences || preferences
        };
      } else {
        throw new Error('User not found');
      }
    } catch (error: any) {
      logger.error('Update user preferences error', error);
      throw error;
    }
  },
  
  // Get user activity log
  getActivityLog: async (userId: string, limit: number = 50, offset: number = 0) => {
    try {
      logger.info('Fetching user activity log', { userId, limit, offset });
      
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select('id, action, details, ip_address, user_agent, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        logger.error('Database error fetching user activity log', { error: error.message, userId });
        throw new Error(`Failed to fetch activity log: ${error.message}`);
      }
      
      return {
        success: true,
        data: data || []
      };
    } catch (error: any) {
      logger.error('Get user activity log error', error);
      throw error;
    }
  },
  
  // Get user statistics
  getStatistics: async (userId: string) => {
    try {
      logger.info('Fetching user statistics', { userId });
      
      // Get user's activity count
      const { count: activityCount } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      // Get user's notification count
      const { count: notificationCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      // Get user's last activity
      const { data: lastActivity } = await supabase
        .from('user_activity_logs')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      // Get user's match-related activities (if any)
      const { count: matchActivities } = await supabase
        .from('user_activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .like('action', '%match%');
      
      // Calculate engagement score based on activity
      const engagementScore = Math.min(100, (activityCount || 0) * 2);
      
      return {
        success: true,
        data: {
          totalActivities: activityCount || 0,
          totalNotifications: notificationCount || 0,
          matchRelatedActivities: matchActivities || 0,
          engagementScore,
          lastActive: lastActivity?.created_at ? new Date(lastActivity.created_at) : null,
          accountAge: null // Could calculate from user creation date
        }
      };
    } catch (error: any) {
      logger.error('Get user statistics error', error);
      throw error;
    }
  },

  // Get notification settings
  getNotificationSettings: async (userId: string) => {
    try {
      logger.info('Fetching notification settings', { userId });
      
      // Fetch user from Supabase
      const user = await supabaseService.getUserById(userId);
      
      if (user) {
        return {
          success: true,
          data: user.notificationSettings || {
            enabled: true,
            importantOnly: false,
            quietHours: {
              start: "22:00",
              end: "08:00"
            },
            followedTeams: [],
            followedPlayers: [],
            followedCompetitions: [],
            deliveryMethods: {
              push: true,
              inApp: true,
              email: false
            }
          }
        };
      } else {
        throw new Error('User not found');
      }
    } catch (error: any) {
      logger.error('Get notification settings error', error);
      throw error;
    }
  },
  
  // Update notification settings
  updateNotificationSettings: async (userId: string, settings: any) => {
    try {
      logger.info('Updating notification settings', { userId, settings });
      
      // Update notification settings in Supabase
      const updatedUser = await supabaseService.updateUser(userId, { notificationSettings: settings });
      
      if (updatedUser) {
        return {
          success: true,
          data: updatedUser.notificationSettings || settings
        };
      } else {
        throw new Error('User not found');
      }
    } catch (error: any) {
      logger.error('Update notification settings error', error);
      throw error;
    }
  }
};