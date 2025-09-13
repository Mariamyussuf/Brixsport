export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'super-admin';
  adminLevel: 'basic' | 'super';
  permissions: string[];
}
