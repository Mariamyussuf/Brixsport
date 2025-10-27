// Cloud Messaging Service for Firebase Cloud Messaging integration
import { API_BASE_URL } from '@/lib/apiConfig';

class CloudMessagingService {
  private fcmToken: string | null = null;
  private isSupported: boolean = false;

  constructor() {
    // Check if service workers and FCM are supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      this.isSupported = true;
    }
  }

  // Check if cloud messaging is supported
  isCloudMessagingSupported(): boolean {
    return this.isSupported;
  }

  // Initialize Firebase and get FCM token
  async initializeFCM(): Promise<string | null> {
    if (!this.isSupported) {
      console.warn('Cloud messaging not supported in this browser');
      return null;
    }

    try {
      // Import Firebase dynamically to avoid server-side issues
      const firebaseModule: any = await import('firebase/app');
      const messagingModule: any = await import('firebase/messaging');

      // Firebase configuration
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
      };

      // Initialize Firebase
      let app;
      if (firebaseModule.getApps().length === 0) {
        app = firebaseModule.initializeApp(firebaseConfig);
      } else {
        app = firebaseModule.getApp();
      }
      
      const fbMessaging = messagingModule.getMessaging(app);

      // Get FCM token
      const token = await messagingModule.getToken(fbMessaging, { 
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY 
      });

      if (token) {
        this.fcmToken = token;
        console.log('[CloudMessaging] FCM token received:', token);
        return token;
      } else {
        console.log('[CloudMessaging] No registration token available.');
        return null;
      }
    } catch (error) {
      console.error('[CloudMessaging] Error getting FCM token:', error);
      return null;
    }
  }

  // Register device token with backend
  async registerDeviceToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cloud-messaging/device-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ token, platform })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CloudMessaging] Failed to register device token:', errorData.error);
        return false;
      }

      const data = await response.json();
      console.log('[CloudMessaging] Device token registered:', data);
      return true;
    } catch (error) {
      console.error('[CloudMessaging] Error registering device token:', error);
      return false;
    }
  }

  // Remove device token from backend
  async removeDeviceToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cloud-messaging/device-tokens`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CloudMessaging] Failed to remove device token:', errorData.error);
        return false;
      }

      const data = await response.json();
      console.log('[CloudMessaging] Device token removed:', data);
      return true;
    } catch (error) {
      console.error('[CloudMessaging] Error removing device token:', error);
      return false;
    }
  }

  // Subscribe to a topic
  async subscribeToTopic(topic: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cloud-messaging/topics/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ topic })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CloudMessaging] Failed to subscribe to topic:', errorData.error);
        return false;
      }

      const data = await response.json();
      console.log('[CloudMessaging] Subscribed to topic:', data);
      return true;
    } catch (error) {
      console.error('[CloudMessaging] Error subscribing to topic:', error);
      return false;
    }
  }

  // Unsubscribe from a topic
  async unsubscribeFromTopic(topic: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/cloud-messaging/topics/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ topic })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[CloudMessaging] Failed to unsubscribe from topic:', errorData.error);
        return false;
      }

      const data = await response.json();
      console.log('[CloudMessaging] Unsubscribed from topic:', data);
      return true;
    } catch (error) {
      console.error('[CloudMessaging] Error unsubscribing from topic:', error);
      return false;
    }
  }

  // Get current FCM token
  getFCMToken(): string | null {
    return this.fcmToken;
  }
}

// Export singleton instance
export const cloudMessagingService = new CloudMessagingService();