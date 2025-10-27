import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';
import { supabase } from './supabase.service';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

try {
  // Only initialize if we have the required environment variables
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    logger.info('Firebase Admin SDK initialized successfully');
  } else {
    logger.warn('Firebase environment variables not found. Cloud messaging will be disabled.');
  }
} catch (error: any) {
  logger.error('Failed to initialize Firebase Admin SDK', { error: error.message });
}

// Interface for device tokens
interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  created_at: string;
  updated_at: string;
}

export const cloudMessagingService = {
  // Register a device token for a user
  registerDeviceToken: async (userId: string, token: string, platform: 'ios' | 'android' | 'web') => {
    try {
      if (!firebaseApp) {
        logger.warn('Firebase not initialized. Skipping device token registration.');
        return { success: false, message: 'Cloud messaging not available' };
      }

      logger.info('Registering device token', { userId, platform });

      // Check if token already exists for this user
      const { data: existingTokens, error: fetchError } = await supabase
        .from('user_device_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('token', token);

      if (fetchError) {
        logger.error('Error checking existing device token', { error: fetchError.message });
        throw new Error(`Failed to check existing device token: ${fetchError.message}`);
      }

      // If token doesn't exist, insert it
      if (!existingTokens || existingTokens.length === 0) {
        const { data, error: insertError } = await supabase
          .from('user_device_tokens')
          .insert([
            {
              user_id: userId,
              token,
              platform,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select();

        if (insertError) {
          logger.error('Error registering device token', { error: insertError.message });
          throw new Error(`Failed to register device token: ${insertError.message}`);
        }

        logger.info('Device token registered successfully', { tokenId: data?.[0]?.id });
        return { success: true, data: data?.[0] };
      } else {
        // Update existing token timestamp
        const { data, error: updateError } = await supabase
          .from('user_device_tokens')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', existingTokens[0].id)
          .select();

        if (updateError) {
          logger.error('Error updating device token', { error: updateError.message });
          throw new Error(`Failed to update device token: ${updateError.message}`);
        }

        logger.info('Device token updated successfully', { tokenId: data?.[0]?.id });
        return { success: true, data: data?.[0] };
      }
    } catch (error: any) {
      logger.error('Register device token error', { error: error.message });
      throw error;
    }
  },

  // Remove a device token
  removeDeviceToken: async (userId: string, token: string) => {
    try {
      if (!firebaseApp) {
        logger.warn('Firebase not initialized. Skipping device token removal.');
        return { success: false, message: 'Cloud messaging not available' };
      }

      logger.info('Removing device token', { userId });

      const { data, error } = await supabase
        .from('user_device_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);

      if (error) {
        logger.error('Error removing device token', { error: error.message });
        throw new Error(`Failed to remove device token: ${error.message}`);
      }

      logger.info('Device token removed successfully');
      return { success: true, message: 'Device token removed successfully' };
    } catch (error: any) {
      logger.error('Remove device token error', { error: error.message });
      throw error;
    }
  },

  // Get device tokens for a user
  getUserDeviceTokens: async (userId: string): Promise<DeviceToken[]> => {
    try {
      if (!firebaseApp) {
        logger.warn('Firebase not initialized. Returning empty device token list.');
        return [];
      }

      const { data, error } = await supabase
        .from('user_device_tokens')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching user device tokens', { error: error.message });
        throw new Error(`Failed to fetch user device tokens: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      logger.error('Get user device tokens error', { error: error.message });
      throw error;
    }
  },

  // Send push notification to a specific user
  sendPushNotificationToUser: async (
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
      imageUrl?: string;
    }
  ) => {
    try {
      if (!firebaseApp) {
        logger.warn('Firebase not initialized. Skipping push notification.');
        return { success: false, message: 'Cloud messaging not available' };
      }

      logger.info('Sending push notification to user', { userId, title: notification.title });

      // Get user's device tokens
      const deviceTokens = await cloudMessagingService.getUserDeviceTokens(userId);

      if (!deviceTokens || deviceTokens.length === 0) {
        logger.info('No device tokens found for user', { userId });
        return { success: true, message: 'No device tokens found for user' };
      }

      // Extract tokens
      const tokens = deviceTokens.map((token: DeviceToken) => token.token);

      // Send multicast message
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: notification.data,
        tokens: tokens
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      logger.info('Push notification sent', {
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp: any, idx: number) => {
          if (!resp.success) {
            logger.error('Failed to send push notification to token', {
              token: tokens[idx],
              error: resp.error
            });
            failedTokens.push(tokens[idx]);
          }
        });

        // Remove invalid tokens
        if (failedTokens.length > 0) {
          logger.info('Removing invalid device tokens', { count: failedTokens.length });
          for (const token of failedTokens) {
            await cloudMessagingService.removeDeviceToken(userId, token);
          }
        }
      }

      return {
        success: true,
        message: `Notification sent to ${response.successCount} devices`,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error: any) {
      logger.error('Send push notification error', { error: error.message });
      throw error;
    }
  },

  // Send push notification to multiple users
  sendPushNotificationToUsers: async (
    userIds: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
      imageUrl?: string;
    }
  ) => {
    try {
      if (!firebaseApp) {
        logger.warn('Firebase not initialized. Skipping push notification.');
        return { success: false, message: 'Cloud messaging not available' };
      }

      logger.info('Sending push notification to multiple users', {
        userIdCount: userIds.length,
        title: notification.title
      });

      let totalSuccessCount = 0;
      let totalFailureCount = 0;

      // Process users in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        // Get device tokens for all users in batch
        const { data: tokens, error } = await supabase
          .from('user_device_tokens')
          .select('token')
          .in('user_id', batch);

        if (error) {
          logger.error('Error fetching device tokens for batch', { error: error.message });
          continue;
        }

        if (tokens && tokens.length > 0) {
          // Extract tokens
          const tokenList = tokens.map(token => token.token);

          // Send multicast message
          const message = {
            notification: {
              title: notification.title,
              body: notification.body,
              imageUrl: notification.imageUrl
            },
            data: notification.data,
            tokens: tokenList
          };

          const response = await admin.messaging().sendEachForMulticast(message);
          totalSuccessCount += response.successCount;
          totalFailureCount += response.failureCount;

          logger.info('Push notification batch sent', {
            batchSize: tokenList.length,
            successCount: response.successCount,
            failureCount: response.failureCount
          });
        }
      }

      return {
        success: true,
        message: `Notification sent to ${totalSuccessCount} devices`,
        successCount: totalSuccessCount,
        failureCount: totalFailureCount
      };
    } catch (error: any) {
      logger.error('Send push notification to users error', { error: error.message });
      throw error;
    }
  },

  // Send push notification to a topic
  sendPushNotificationToTopic: async (
    topic: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, string>;
      imageUrl?: string;
    }
  ) => {
    try {
      if (!firebaseApp) {
        logger.warn('Firebase not initialized. Skipping push notification.');
        return { success: false, message: 'Cloud messaging not available' };
      }

      logger.info('Sending push notification to topic', { topic, title: notification.title });

      // Send message to topic
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: notification.data,
        topic: topic
      };

      const response = await admin.messaging().send(message);

      logger.info('Push notification sent to topic', { messageId: response });

      return {
        success: true,
        message: 'Notification sent to topic',
        messageId: response
      };
    } catch (error: any) {
      logger.error('Send push notification to topic error', { error: error.message });
      throw error;
    }
  },

  // Subscribe user to a topic
  subscribeToTopic: async (userId: string, topic: string) => {
    try {
      if (!firebaseApp) {
        logger.warn('Firebase not initialized. Skipping topic subscription.');
        return { success: false, message: 'Cloud messaging not available' };
      }

      logger.info('Subscribing user to topic', { userId, topic });

      // Get user's device tokens
      const deviceTokens = await cloudMessagingService.getUserDeviceTokens(userId);

      if (!deviceTokens || deviceTokens.length === 0) {
        logger.info('No device tokens found for user', { userId });
        return { success: true, message: 'No device tokens found for user' };
      }

      // Extract tokens
      const tokens = deviceTokens.map((token: DeviceToken) => token.token);

      // Subscribe tokens to topic
      const response = await admin.messaging().subscribeToTopic(tokens, topic);

      logger.info('User subscribed to topic', {
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return {
        success: true,
        message: `Subscribed to topic with ${response.successCount} devices`,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error: any) {
      logger.error('Subscribe to topic error', { error: error.message });
      throw error;
    }
  },

  // Unsubscribe user from a topic
  unsubscribeFromTopic: async (userId: string, topic: string) => {
    try {
      if (!firebaseApp) {
        logger.warn('Firebase not initialized. Skipping topic unsubscription.');
        return { success: false, message: 'Cloud messaging not available' };
      }

      logger.info('Unsubscribing user from topic', { userId, topic });

      // Get user's device tokens
      const deviceTokens = await cloudMessagingService.getUserDeviceTokens(userId);

      if (!deviceTokens || deviceTokens.length === 0) {
        logger.info('No device tokens found for user', { userId });
        return { success: true, message: 'No device tokens found for user' };
      }

      // Extract tokens
      const tokens = deviceTokens.map((token: DeviceToken) => token.token);

      // Unsubscribe tokens from topic
      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);

      logger.info('User unsubscribed from topic', {
        successCount: response.successCount,
        failureCount: response.failureCount
      });

      return {
        success: true,
        message: `Unsubscribed from topic with ${response.successCount} devices`,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error: any) {
      logger.error('Unsubscribe from topic error', { error: error.message });
      throw error;
    }
  }
};

export default cloudMessagingService;