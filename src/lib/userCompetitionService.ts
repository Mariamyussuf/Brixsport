// User Competition Service
// Provides integration with the Competition API endpoints for regular users

import { API_BASE_URL } from './apiConfig';
import { getAuth } from './auth';

// Competition interface
export interface Competition {
  id: string;
  name: string;
  type: string;
  category: string;
  status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  location?: string;
  description?: string;
}

// Generic request function with authentication
const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  try {
    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    if (!token) {
      throw new Error('Unauthorized: No authentication token found');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
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
 * Gets all competitions
 * @returns Promise resolving to array of competitions
 */
export const getCompetitions = async (): Promise<Competition[]> => {
  try {
    const response = await fetchAPI('/user/competitions');
    if (response.success) {
      return response.data || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch competitions:', error);
    return [];
  }
};

/**
 * Gets a competition by ID
 * @param id Competition ID
 * @returns Promise resolving to competition or null if not found
 */
export const getCompetitionById = async (id: string): Promise<Competition | null> => {
  try {
    const response = await fetchAPI(`/user/competitions/${id}`);
    if (response.success) {
      return response.data || null;
    }
    return null;
  } catch (error) {
    console.error(`Failed to fetch competition with ID ${id}:`, error);
    return null;
  }
};

export default {
  getCompetitions,
  getCompetitionById
};