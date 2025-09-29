// User Service
// Provides integration with the User API endpoints

import { API_BASE_URL } from './apiConfig';
import { getAuth } from './auth';
import { userEndpoints } from './apiEndpoints';

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

// Generic request function with authentication
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // Get auth session
    // Note: This is a simplified version. In a real implementation, you would pass the request object
    // from the API route to getAuth() to properly extract headers/cookies
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * User Authentication Functions
 */

/**
 * Sign up a new user
 * @param userData User registration data
 * @returns Promise resolving to authentication response
 */
export const signup = async (userData: { name: string; email: string; password: string }) => {
  try {
    const response = await fetchAPI(userEndpoints.signup.url, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return response;
  } catch (error) {
    console.error('Failed to sign up:', error);
    throw error;
  }
};

/**
 * Log in a user
 * @param credentials User login credentials
 * @returns Promise resolving to authentication response
 */
export const login = async (credentials: { email: string; password: string }) => {
  try {
    const response = await fetchAPI(userEndpoints.login.url, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    return response;
  } catch (error) {
    console.error('Failed to log in:', error);
    throw error;
  }
};

/**
 * Refresh authentication tokens
 * @param refreshToken Refresh token
 * @returns Promise resolving to new tokens
 */
export const refreshToken = async (refreshToken: string) => {
  try {
    const response = await fetchAPI(userEndpoints.refreshToken.url, {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    return response;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
};

/**
 * Log out the current user
 * @returns Promise resolving to logout response
 */
export const logout = async () => {
  try {
    const response = await fetchAPI(userEndpoints.logout.url, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Failed to log out:', error);
    throw error;
  }
};

/**
 * Log out all user sessions
 * @returns Promise resolving to logout response
 */
export const logoutAll = async () => {
  try {
    const response = await fetchAPI(userEndpoints.logoutAll.url, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Failed to log out all sessions:', error);
    throw error;
  }
};

/**
 * Request password reset
 * @param email User's email
 * @returns Promise resolving to reset response
 */
export const forgotPassword = async (email: string) => {
  try {
    const response = await fetchAPI(userEndpoints.forgotPassword.url, {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    return response;
  } catch (error) {
    console.error('Failed to request password reset:', error);
    throw error;
  }
};

/**
 * Reset password with token
 * @param token Reset token
 * @param newPassword New password
 * @returns Promise resolving to reset response
 */
export const resetPassword = async (token: string, newPassword: string) => {
  try {
    const response = await fetchAPI(userEndpoints.resetPassword.url, {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
    return response;
  } catch (error) {
    console.error('Failed to reset password:', error);
    throw error;
  }
};

/**
 * Change user password
 * @param currentPassword Current password
 * @param newPassword New password
 * @returns Promise resolving to change response
 */
export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    const response = await fetchAPI(userEndpoints.changePassword.url, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return response;
  } catch (error) {
    console.error('Failed to change password:', error);
    throw error;
  }
};

/**
 * User Profile Functions
 */

/**
 * Gets the current user profile
 * @returns Promise resolving to user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    return await fetchAPI(userEndpoints.getCurrentUser.url);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};

/**
 * Updates the current user profile
 * @param userData User data to update
 * @returns Promise resolving to updated user
 */
export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  try {
    return await fetchAPI(userEndpoints.updateProfile.url, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
};

/**
 * Uploads a profile picture
 * @param url Picture URL
 * @returns Promise resolving to avatar URL
 */
export const uploadProfilePicture = async (url: string) => {
  try {
    return await fetchAPI(userEndpoints.uploadProfilePicture.url, {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  } catch (error) {
    console.error('Failed to upload profile picture:', error);
    throw error;
  }
};

/**
 * Removes the profile picture
 * @returns Promise resolving to null avatar
 */
export const removeProfilePicture = async () => {
  try {
    return await fetchAPI(userEndpoints.removeProfilePicture.url, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Failed to remove profile picture:', error);
    throw error;
  }
};

/**
 * User Preferences Functions
 */

/**
 * Gets user preferences
 * @returns Promise resolving to user preferences
 */
export const getPreferences = async (): Promise<UserPreferences> => {
  try {
    return await fetchAPI(userEndpoints.getPreferences.url);
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    throw error;
  }
};

/**
 * Updates user preferences
 * @param preferences Preferences to update
 * @returns Promise resolving to updated preferences
 */
export const updatePreferences = async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
  try {
    return await fetchAPI(userEndpoints.updatePreferences.url, {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    throw error;
  }
};

/**
 * Notification Settings Functions
 */

/**
 * Gets notification settings
 * @returns Promise resolving to notification settings
 */
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    return await fetchAPI(userEndpoints.getNotificationSettings.url);
  } catch (error) {
    console.error('Failed to fetch notification settings:', error);
    throw error;
  }
};

/**
 * Updates notification settings
 * @param settings Settings to update
 * @returns Promise resolving to updated settings
 */
export const updateNotificationSettings = async (settings: Partial<NotificationSettings>): Promise<NotificationSettings> => {
  try {
    return await fetchAPI(userEndpoints.updateNotificationSettings.url, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    throw error;
  }
};

/**
 * Gets a user by ID
 * @param id User ID
 * @returns Promise resolving to user or null if not found
 */
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    return await fetchAPI(`/user/${id}`);
  } catch (error) {
    console.error(`Failed to fetch user with ID ${id}:`, error);
    return null;
  }
};

export default {
  signup,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
  updateUserProfile,
  uploadProfilePicture,
  removeProfilePicture,
  getPreferences,
  updatePreferences,
  getNotificationSettings,
  updateNotificationSettings,
  getUserById
};