'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/logger/admin/AdminDashboard';
import LoggerDashboard from '@/components/logger/dashboard/LoggerDashboard';

export default function UnifiedDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Access the initializing state from loading
  const isLoading = loading.initializing;

  // Redirect unauthenticated users to login
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-admin/loggers
  if (isAuthenticated && !user?.role?.startsWith('admin') && !user?.role?.startsWith('logger')) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-md bg-gray-800 rounded-xl">
          <div className="mx-auto bg-red-500/20 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">
            You don't have permission to access the dashboard. Please contact your administrator.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  if (user?.role === 'admin' || user?.role === 'super-admin') {
    return <AdminDashboard />;
  } else if (user?.role?.startsWith('logger')) {
    return <LoggerDashboard />;
  }

  // Fallback for authenticated users without proper roles
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center p-8 max-w-md bg-gray-800 rounded-xl">
        <div className="mx-auto bg-yellow-500/20 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Role Not Recognized</h1>
        <p className="text-gray-400 mb-6">
          Your account role is not recognized. Please contact your administrator.
        </p>
        <button
          onClick={() => router.push('/auth/logout')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}