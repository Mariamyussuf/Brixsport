import LoginForm from '@/components/auth/AdminLoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - BrixSports',
  description: 'Administrator login for BrixSports platform',
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <LoginForm />
    </div>
  );
}
