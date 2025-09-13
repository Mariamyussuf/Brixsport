// User Service
// Provides integration with the User API endpoints

import { API_BASE_URL } from './apiConfig';
import { getAuth } from './auth';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
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
 * Gets the current user profile
 * @returns Promise resolving to user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    return await fetchAPI('/user/profile');
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
    return await fetchAPI('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(userData)
    });
  } catch (error) {
    console.error('Failed to update user profile:', error);
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
  getCurrentUser,
  updateUserProfile,
  getUserById
};