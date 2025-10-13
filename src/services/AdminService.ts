import { APIEndpoint } from '@/types/api';
import { AdminUser } from '@/types/admin';

// Backend API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const API_V1_URL = `${API_BASE_URL}/v1`;

// Helper function to make authenticated API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const response = await fetch(`${API_V1_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

const adminEndpoints = {
  login: {
    url: '/admin/login',
    method: 'POST',
  } as APIEndpoint,
  getProfile: {
    url: '/admin/profile',
    method: 'GET',
  } as APIEndpoint<AdminUser>,
  getAll: {
    url: '/admin/users',
    method: 'GET',
  } as APIEndpoint<AdminUser[]>,
  create: {
    url: '/admin/users',
    method: 'POST',
  } as APIEndpoint<AdminUser>,
  update: (id: string) => ({
    url: `/admin/users/${id}`,
    method: 'PUT',
  } as APIEndpoint<AdminUser>),
  delete: (id: string) => ({
    url: `/admin/users/${id}`,
    method: 'DELETE',
  } as APIEndpoint),
};

class AdminService {
  async login(email: string, password: string):Promise<any> {
    try {
      const response = await apiCall(adminEndpoints.login.url, {
        method: adminEndpoints.login.method,
        body: JSON.stringify({ email, password })
      });
      
      return response;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  }

  async getProfile(): Promise<any> {
    try {
      const response = await apiCall(adminEndpoints.getProfile.url, {
        method: adminEndpoints.getProfile.method
      });
      
      return response;
    } catch (error) {
      console.error('Get admin profile error:', error);
      throw error;
    }
  }

  async getAll(): Promise<any> {
    try {
      const response = await apiCall(adminEndpoints.getAll.url, {
        method: adminEndpoints.getAll.method
      });
      
      return response;
    } catch (error) {
      console.error('Get all admins error:', error);
      throw error;
    }
  }

  async create(data: Omit<AdminUser, 'id'>): Promise<any> {
    try {
      const response = await apiCall(adminEndpoints.create.url, {
        method: adminEndpoints.create.method,
        body: JSON.stringify(data)
      });
      
      return response;
    } catch (error) {
      console.error('Create admin error:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<AdminUser>): Promise<any> {
    try {
      const response = await apiCall(adminEndpoints.update(id).url, {
        method: adminEndpoints.update(id).method,
        body: JSON.stringify(data)
      });
      
      return response;
    } catch (error) {
      console.error('Update admin error:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<any> {
    try {
      const response = await apiCall(adminEndpoints.delete(id).url, {
        method: adminEndpoints.delete(id).method
      });
      
      return response;
    } catch (error) {
      console.error('Delete admin error:', error);
      throw error;
    }
  }

  // Check if a user has admin permissions
  async checkAdminPermission(userId: string): Promise<boolean> {
    // In a real implementation, this would check the user's role in the database
    // For now, we'll return true to simulate admin permissions
    // In a production environment, you would verify the user's role
    console.log('Checking admin permission for user:', userId);
    return true;
  }

  // Check if a user is an admin based on their role
  async isAdminRole(role: string): Promise<boolean> {
    return role === 'admin' || role === 'super-admin';
  }
}

export default new AdminService();