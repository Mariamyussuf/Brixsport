// React hook for Firebase Cloud Messaging integration
import { useState, useEffect, useCallback } from 'react';
import { cloudMessagingService } from '@/services/cloudMessagingService';
import { useAuth } from '@/hooks/useAuth';

export const useCloudMessaging = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Check if cloud messaging is supported
  useEffect(() => {
    const supported = cloudMessagingService.isCloudMessagingSupported();
    setIsSupported(supported);
  }, []);

  // Initialize FCM when user is authenticated
  useEffect(() => {
    const initializeFCM = async () => {
      if (!isSupported || !user || isInitialized) return;

      setLoading(true);
      setError(null);

      try {
        const token = await cloudMessagingService.initializeFCM();
        if (token) {
          setFcmToken(token);
          
          // Register the token with the backend
          const platform = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : 
                          /Android/.test(navigator.userAgent) ? 'android' : 'web';
          
          const success = await cloudMessagingService.registerDeviceToken(token, platform);
          if (!success) {
            throw new Error('Failed to register device token with backend');
          }
        }
        setIsInitialized(true);
      } catch (err) {
        console.error('[useCloudMessaging] Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize cloud messaging');
      } finally {
        setLoading(false);
      }
    };

    initializeFCM();
  }, [isSupported, user, isInitialized]);

  // Subscribe to a topic
  const subscribeToTopic = useCallback(async (topic: string) => {
    if (!fcmToken) {
      setError('FCM not initialized');
      return false;
    }

    setLoading(true);
    try {
      const success = await cloudMessagingService.subscribeToTopic(topic);
      if (success) {
        console.log(`[useCloudMessaging] Subscribed to topic: ${topic}`);
      } else {
        throw new Error(`Failed to subscribe to topic: ${topic}`);
      }
      return success;
    } catch (err) {
      console.error('[useCloudMessaging] Subscribe error:', err);
      setError(err instanceof Error ? err.message : 'Failed to subscribe to topic');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fcmToken]);

  // Unsubscribe from a topic
  const unsubscribeFromTopic = useCallback(async (topic: string) => {
    if (!fcmToken) {
      setError('FCM not initialized');
      return false;
    }

    setLoading(true);
    try {
      const success = await cloudMessagingService.unsubscribeFromTopic(topic);
      if (success) {
        console.log(`[useCloudMessaging] Unsubscribed from topic: ${topic}`);
      } else {
        throw new Error(`Failed to unsubscribe from topic: ${topic}`);
      }
      return success;
    } catch (err) {
      console.error('[useCloudMessaging] Unsubscribe error:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe from topic');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fcmToken]);

  // Remove device token
  const removeDeviceToken = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const success = await cloudMessagingService.removeDeviceToken(token);
      if (success) {
        setFcmToken(null);
        console.log('[useCloudMessaging] Device token removed');
      } else {
        throw new Error('Failed to remove device token');
      }
      return success;
    } catch (err) {
      console.error('[useCloudMessaging] Remove token error:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove device token');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isSupported,
    isInitialized,
    fcmToken,
    loading,
    error,
    subscribeToTopic,
    unsubscribeFromTopic,
    removeDeviceToken
  };
};