// User Service
// Provides integration with the User API endpoints

import { API_BASE_URL } from './apiConfig';
import { getAuth } from './auth';
import { userEndpoints } from './apiEndpoints';

// Add Request import for server-side usage
import type { NextRequest } from 'next/server';

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
// Updated to accept an optional request object for server-side authentication
const fetchAPI = async (endpoint: string, options: RequestInit = {}, request?: Request) => {
  try {
    let token: string | null = null;
    
    // If we have a request object (server-side), extract token from Authorization header
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    } 
    // Otherwise, fallback to client-side localStorage (browser only)
    else if (typeof window !== 'undefined') {
      token = localStorage.getItem('authToken');
    }
    
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
      // Try to parse the error response
      let errorMessage = `API Error: ${response.status} - ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // If we can't parse the error, use the default message
      }
      
      throw new Error(errorMessage);
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
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to authentication response
 */
export const signup = async (userData: { name: string; email: string; password: string }, request?: Request) => {
  try {
    const response = await fetchAPI(userEndpoints.signup.url, {
      method: 'POST',
      body: JSON.stringify(userData)
    }, request);
    return response;
  } catch (error) {
    console.error('Failed to sign up:', error);
    
    // Provide more specific error messages to the user
    if (error instanceof Error) {
      if (error.message.includes('USER_EXISTS')) {
        throw new Error('An account with this email already exists. Please use a different email or try logging in.');
      } else if (error.message.includes('VALIDATION_ERROR')) {
        throw new Error('Please provide all required information (name, email, and password).');
      } else if (error.message.includes('DATABASE_ERROR') || error.message.includes('connection')) {
        throw new Error('Unable to connect to our services. Please try again later.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again later.');
      }
    }
    
    throw error;
  }
};

/**
 * Log in a user
 * @param credentials User login credentials
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to authentication response
 */
export const login = async (credentials: { email: string; password: string }, request?: Request) => {
  try {
    const response = await fetchAPI(userEndpoints.login.url, {
      method: 'POST',
      body: JSON.stringify(credentials)
    }, request);
    return response;
  } catch (error) {
    console.error('Failed to log in:', error);
    throw error;
  }
};

/**
 * Refresh authentication tokens
 * @param refreshToken Refresh token
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to new tokens
 */
export const refreshToken = async (refreshToken: string, request?: Request) => {
  try {
    const response = await fetchAPI(userEndpoints.refreshToken.url, {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    }, request);
    return response;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
};

/**
 * Log out the current user
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to logout response
 */
export const logout = async (request?: Request) => {
  try {
    const response = await fetchAPI(userEndpoints.logout.url, {
      method: 'POST'
    }, request);
    return response;
  } catch (error) {
    console.error('Failed to log out:', error);
    throw error;
  }
};

/**
 * Log out all user sessions
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to logout response
 */
export const logoutAll = async (request?: Request) => {
  try {
    const response = await fetchAPI(userEndpoints.logoutAll.url, {
      method: 'POST'
    }, request);
    return response;
  } catch (error) {
    console.error('Failed to log out all sessions:', error);
    throw error;
  }
};

/**
 * Request password reset
 * @param email User's email
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to reset response
 */
export const forgotPassword = async (email: string, request?: Request) => {
  try {
    const response = await fetchAPI(userEndpoints.forgotPassword.url, {
      method: 'POST',
      body: JSON.stringify({ email })
    }, request);
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
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to reset response
 */
export const resetPassword = async (token: string, newPassword: string, request?: Request) => {
  try {
    const response = await fetchAPI(userEndpoints.resetPassword.url, {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    }, request);
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
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to change response
 */
export const changePassword = async (currentPassword: string, newPassword: string, request?: Request) => {
  try {
    const response = await fetchAPI(userEndpoints.changePassword.url, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }, request);
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
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to user profile
 */
export const getCurrentUser = async (request?: Request): Promise<User> => {
  try {
    return await fetchAPI(userEndpoints.getCurrentUser.url, {}, request);
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};

/**
 * Updates the current user profile
 * @param userData User data to update
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to updated user
 */
export const updateUserProfile = async (userData: Partial<User>, request?: Request): Promise<User> => {
  try {
    return await fetchAPI(userEndpoints.updateProfile.url, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }, request);
  } catch (error) {
    console.error('Failed to update user profile:', error);
    throw error;
  }
};

/**
 * Uploads a profile picture
 * @param url Picture URL
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to avatar URL
 */
export const uploadProfilePicture = async (url: string, request?: Request) => {
  try {
    return await fetchAPI(userEndpoints.uploadProfilePicture.url, {
      method: 'POST',
      body: JSON.stringify({ url })
    }, request);
  } catch (error) {
    console.error('Failed to upload profile picture:', error);
    throw error;
  }
};

/**
 * Removes the profile picture
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to null avatar
 */
export const removeProfilePicture = async (request?: Request) => {
  try {
    return await fetchAPI(userEndpoints.removeProfilePicture.url, {
      method: 'DELETE'
    }, request);
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
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to user preferences
 */
export const getPreferences = async (request?: Request): Promise<UserPreferences> => {
  try {
    return await fetchAPI(userEndpoints.getPreferences.url, {}, request);
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    throw error;
  }
};

/**
 * Updates user preferences
 * @param preferences Preferences to update
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to updated preferences
 */
export const updatePreferences = async (preferences: Partial<UserPreferences>, request?: Request): Promise<UserPreferences> => {
  try {
    return await fetchAPI(userEndpoints.updatePreferences.url, {
      method: 'PUT',
      body: JSON.stringify(preferences)
    }, request);
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
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to notification settings
 */
export const getNotificationSettings = async (request?: Request): Promise<NotificationSettings> => {
  try {
    return await fetchAPI(userEndpoints.getNotificationSettings.url, {}, request);
  } catch (error) {
    console.error('Failed to fetch notification settings:', error);
    throw error;
  }
};

/**
 * Updates notification settings
 * @param settings Settings to update
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to updated settings
 */
export const updateNotificationSettings = async (settings: Partial<NotificationSettings>, request?: Request): Promise<NotificationSettings> => {
  try {
    return await fetchAPI(userEndpoints.updateNotificationSettings.url, {
      method: 'PUT',
      body: JSON.stringify(settings)
    }, request);
  } catch (error) {
    console.error('Failed to update notification settings:', error);
    throw error;
  }
};

/**
 * Gets a user by ID
 * @param id User ID
 * @param request Optional request object for server-side authentication
 * @returns Promise resolving to user or null if not found
 */
export const getUserById = async (id: string, request?: Request): Promise<User | null> => {
  try {
    return await fetchAPI(`/user/${id}`, {}, request);
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