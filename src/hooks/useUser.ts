"use client";

import { useState, useCallback, useEffect } from 'react';
import { 
  getCurrentUser, 
  updateUserProfile, 
  uploadProfilePicture, 
  removeProfilePicture,
  getPreferences,
  updatePreferences,
  getNotificationSettings,
  updateNotificationSettings,
  changePassword,
  forgotPassword,
  resetPassword
} from '@/lib/userService';
import { useAuth } from './useAuth';

// User interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

export interface NotificationSettings {
  enabled: boolean;
  importantOnly: boolean;
  quietHours?: {
    start: string;
    end: string;
  };
  followedTeams: string[];
  followedPlayers: string[];
  followedCompetitions: string[];
  deliveryMethods: {
    push: boolean;
    inApp: boolean;
    email: boolean;
  };
}

// Error interface
interface UserError {
  type: 'NETWORK' | 'VALIDATION' | 'UNAUTHORIZED' | 'UNKNOWN';
  message: string;
}

// Loading states
interface UserLoadingStates {
  fetchingProfile: boolean;
  updatingProfile: boolean;
  uploadingPicture: boolean;
  removingPicture: boolean;
  fetchingPreferences: boolean;
  updatingPreferences: boolean;
  fetchingNotifications: boolean;
  updatingNotifications: boolean;
  changingPassword: boolean;
  resettingPassword: boolean;
}

export const useUser = () => {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState<UserLoadingStates>({
    fetchingProfile: false,
    updatingProfile: false,
    uploadingPicture: false,
    removingPicture: false,
    fetchingPreferences: false,
    updatingPreferences: false,
    fetchingNotifications: false,
    updatingNotifications: false,
    changingPassword: false,
    resettingPassword: false
  });
  const [error, setError] = useState<UserError | null>(null);

  // Helper function to update loading states
  const updateLoading = useCallback((key: keyof UserLoadingStates, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear error function
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Fetch current user profile
  const fetchUserProfile = useCallback(async (): Promise<void> => {
    if (!authUser) return;
    
    updateLoading('fetchingProfile', true);
    setError(null);
    
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      let errorType: UserError['type'] = 'UNKNOWN';
      let errorMessage = 'Failed to fetch user profile.';
      
      if (err instanceof Error) {
        if (err.message.includes('Unauthorized') || err.message.includes('401')) {
          errorType = 'UNAUTHORIZED';
          errorMessage = 'Session expired. Please log in again.';
          logout(); // Log out if unauthorized
        } else if (err.message.includes('Network')) {
          errorType = 'NETWORK';
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError({ type: errorType, message: errorMessage });
    } finally {
      updateLoading('fetchingProfile', false);
    }
  }, [authUser, logout, updateLoading]);

  // Update user profile
  const updateProfile = useCallback(async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    updateLoading('updatingProfile', true);
    setError(null);
    
    try {
      const updatedUser = await updateUserProfile(userData);
      setUser(updatedUser);
      return true;
    } catch (err) {
      let errorMessage = 'Failed to update profile.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          setError({ type: 'NETWORK', message: 'Network error. Please check your connection.' });
        } else {
          errorMessage = err.message;
          setError({ type: 'UNKNOWN', message: errorMessage });
        }
      } else {
        setError({ type: 'UNKNOWN', message: errorMessage });
      }
      return false;
    } finally {
      updateLoading('updatingProfile', false);
    }
  }, [user, updateLoading]);

  // Upload profile picture
  const uploadPicture = useCallback(async (url: string): Promise<boolean> => {
    updateLoading('uploadingPicture', true);
    setError(null);
    
    try {
      const response = await uploadProfilePicture(url);
      if (user) {
        setUser({ ...user, avatar: response.avatar });
      }
      return true;
    } catch (err) {
      let errorMessage = 'Failed to upload profile picture.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          setError({ type: 'NETWORK', message: 'Network error. Please check your connection.' });
        } else {
          errorMessage = err.message;
          setError({ type: 'UNKNOWN', message: errorMessage });
        }
      } else {
        setError({ type: 'UNKNOWN', message: errorMessage });
      }
      return false;
    } finally {
      updateLoading('uploadingPicture', false);
    }
  }, [user, updateLoading]);

  // Remove profile picture
  const removePicture = useCallback(async (): Promise<boolean> => {
    updateLoading('removingPicture', true);
    setError(null);
    
    try {
      await removeProfilePicture();
      if (user) {
        setUser({ ...user, avatar: undefined });
      }
      return true;
    } catch (err) {
      let errorMessage = 'Failed to remove profile picture.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          setError({ type: 'NETWORK', message: 'Network error. Please check your connection.' });
        } else {
          errorMessage = err.message;
          setError({ type: 'UNKNOWN', message: errorMessage });
        }
      } else {
        setError({ type: 'UNKNOWN', message: errorMessage });
      }
      return false;
    } finally {
      updateLoading('removingPicture', false);
    }
  }, [user, updateLoading]);

  // Fetch user preferences
  const fetchPreferences = useCallback(async (): Promise<void> => {
    updateLoading('fetchingPreferences', true);
    setError(null);
    
    try {
      const prefs = await getPreferences();
      setPreferences(prefs);
    } catch (err) {
      let errorMessage = 'Failed to fetch preferences.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          setError({ type: 'NETWORK', message: 'Network error. Please check your connection.' });
        } else {
          errorMessage = err.message;
          setError({ type: 'UNKNOWN', message: errorMessage });
        }
      } else {
        setError({ type: 'UNKNOWN', message: errorMessage });
      }
    } finally {
      updateLoading('fetchingPreferences', false);
    }
  }, [updateLoading]);

  // Update user preferences
  const updatePreferencesSettings = useCallback(async (prefs: Partial<UserPreferences>): Promise<boolean> => {
    updateLoading('updatingPreferences', true);
    setError(null);
    
    try {
      const updatedPrefs = await updatePreferences(prefs);
      setPreferences(updatedPrefs);
      return true;
    } catch (err) {
      let errorMessage = 'Failed to update preferences.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          setError({ type: 'NETWORK', message: 'Network error. Please check your connection.' });
        } else {
          errorMessage = err.message;
          setError({ type: 'UNKNOWN', message: errorMessage });
        }
      } else {
        setError({ type: 'UNKNOWN', message: errorMessage });
      }
      return false;
    } finally {
      updateLoading('updatingPreferences', false);
    }
  }, [updateLoading]);

  // Fetch notification settings
  const fetchNotificationSettings = useCallback(async (): Promise<void> => {
    updateLoading('fetchingNotifications', true);
    setError(null);
    
    try {
      const settings = await getNotificationSettings();
      setNotificationSettings(settings);
    } catch (err) {
      let errorMessage = 'Failed to fetch notification settings.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          setError({ type: 'NETWORK', message: 'Network error. Please check your connection.' });
        } else {
          errorMessage = err.message;
          setError({ type: 'UNKNOWN', message: errorMessage });
        }
      } else {
        setError({ type: 'UNKNOWN', message: errorMessage });
      }
    } finally {
      updateLoading('fetchingNotifications', false);
    }
  }, [updateLoading]);

  // Update notification settings
  const updateNotificationSettingsData = useCallback(async (settings: Partial<NotificationSettings>): Promise<boolean> => {
    updateLoading('updatingNotifications', true);
    setError(null);
    
    try {
      const updatedSettings = await updateNotificationSettings(settings);
      setNotificationSettings(updatedSettings);
      return true;
    } catch (err) {
      let errorMessage = 'Failed to update notification settings.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          setError({ type: 'NETWORK', message: 'Network error. Please check your connection.' });
        } else {
          errorMessage = err.message;
          setError({ type: 'UNKNOWN', message: errorMessage });
        }
      } else {
        setError({ type: 'UNKNOWN', message: errorMessage });
      }
      return false;
    } finally {
      updateLoading('updatingNotifications', false);
    }
  }, [updateLoading]);

  // Change password
  const changeUserPassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    updateLoading('changingPassword', true);
    setError(null);
    
    try {
      await changePassword(currentPassword, newPassword);
      return true;
    } catch (err) {
      let errorMessage = 'Failed to change password.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          setError({ type: 'NETWORK', message: 'Network error. Please check your connection.' });
        } else if (err.message.includes('current password is incorrect')) {
          setError({ type: 'VALIDATION', message: 'Current password is incorrect.' });
        } else {
          errorMessage = err.message;
          setError({ type: 'UNKNOWN', message: errorMessage });
        }
      } else {
        setError({ type: 'UNKNOWN', message: errorMessage });
      }
      return false;
    } finally {
      updateLoading('changingPassword', false);
    }
  }, [updateLoading]);

  // Request password reset
  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    updateLoading('resettingPassword', true);
    setError(null);
    
    try {
      await forgotPassword(email);
      return true;
    } catch (err) {
      let errorMessage = 'Failed to send password reset instructions.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          setError({ type: 'NETWORK', message: 'Network error. Please check your connection.' });
        } else {
          errorMessage = err.message;
          setError({ type: 'UNKNOWN', message: errorMessage });
        }
      } else {
        setError({ type: 'UNKNOWN', message: errorMessage });
      }
      return false;
    } finally {
      updateLoading('resettingPassword', false);
    }
  }, [updateLoading]);

  // Reset password with token
  const resetUserPassword = useCallback(async (token: string, newPassword: string): Promise<boolean> => {
    updateLoading('resettingPassword', true);
    setError(null);
    
    try {
      await resetPassword(token, newPassword);
      return true;
    } catch (err) {
      let errorMessage = 'Failed to reset password.';
      
      if (err instanceof Error) {
        if (err.message.includes('Network')) {
          setError({ type: 'NETWORK', message: 'Network error. Please check your connection.' });
        } else {
          errorMessage = err.message;
          setError({ type: 'UNKNOWN', message: errorMessage });
        }
      } else {
        setError({ type: 'UNKNOWN', message: errorMessage });
      }
      return false;
    } finally {
      updateLoading('resettingPassword', false);
    }
  }, [updateLoading]);

  // Initialize user data
  useEffect(() => {
    if (authUser) {
      fetchUserProfile();
      fetchPreferences();
      fetchNotificationSettings();
    }
  }, [authUser, fetchUserProfile, fetchPreferences, fetchNotificationSettings]);

  return {
    user,
    preferences,
    notificationSettings,
    loading,
    error,
    clearError,
    fetchUserProfile,
    updateProfile,
    uploadPicture,
    removePicture,
    fetchPreferences,
    updatePreferences: updatePreferencesSettings,
    fetchNotificationSettings,
    updateNotificationSettings: updateNotificationSettingsData,
    changePassword: changeUserPassword,
    requestPasswordReset,
    resetPassword: resetUserPassword
  };
};