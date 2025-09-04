// Admin API Service for BrixSports PWA
// Handles admin-specific API interactions

import { TokenManager } from '../hooks/useAuth';
import { API_BASE_URL } from './apiConfig';
import { AdminUser } from './adminAuth';

// Request headers
const getHeaders = () => {
  const token = TokenManager.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Generic request function
const fetchAPI = async (endpoint: string, options: any = {}) => {
  try {
    // Extract params if provided
    const { params, ...fetchOptions } = options;
    
    // Build URL with query parameters if they exist
    let url = `${API_BASE_URL}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
    }
    
    const headers = getHeaders();
    
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...fetchOptions.headers
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

// Admin User interface
export interface AdminUserData {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'super-admin';
  managedLoggers?: string[];
  adminLevel: 'basic' | 'super';
  permissions: string[];
  password?: string; // Only for creation
}

// Admin API endpoints
export const AdminAPI = {
  // Get all admins
  getAll: () => fetchAPI('/admin/users'),
  
  // Get admin by ID
  getById: (id: string) => fetchAPI(`/admin/users/${id}`),
  
  // Create new admin
  create: (adminData: Omit<AdminUserData, 'id'>) => fetchAPI('/admin/users', {
    method: 'POST',
    body: JSON.stringify(adminData)
  }),
  
  // Update admin
  update: (id: string, adminData: Partial<AdminUserData>) => fetchAPI(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(adminData)
  }),
  
  // Delete admin
  delete: (id: string) => fetchAPI(`/admin/users/${id}`, {
    method: 'DELETE'
  }),
  
  // Get admin profile
  getProfile: () => fetchAPI('/admin/profile'),
  
  // Update admin profile
  updateProfile: (profileData: Partial<AdminUser>) => fetchAPI('/admin/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData)
  })
};