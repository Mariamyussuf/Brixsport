import APIService from './APIService';
import { APIEndpoint } from '@/types/api';
import { AdminUser } from '@/types/admin';

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
    return APIService.request(adminEndpoints.login, { email, password });
  }

  async getProfile(): Promise<any> {
    return APIService.request(adminEndpoints.getProfile);
  }

  async getAll(): Promise<any> {
    return APIService.request(adminEndpoints.getAll);
  }

  async create(data: Omit<AdminUser, 'id'>): Promise<any> {
    return APIService.request(adminEndpoints.create, data);
  }

  async update(id: string, data: Partial<AdminUser>): Promise<any> {
    return APIService.request(adminEndpoints.update(id), data);
  }

  async delete(id: string): Promise<any> {
    return APIService.request(adminEndpoints.delete(id));
  }
}

export default new AdminService();
