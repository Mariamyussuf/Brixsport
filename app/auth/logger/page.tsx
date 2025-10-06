import LoginForm from '@/components/auth/LoggerLoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logger Login - BrixSports',
  description: 'Match logger login for BrixSports platform',
};

export default function LoggerLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <LoginForm />
    </div>
  );
}
