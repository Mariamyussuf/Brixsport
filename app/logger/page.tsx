'use client';

import React, { useEffect } from 'react';
import { useLoggerAuth } from '@/hooks/useAuth';
import LoggerDashboard from '@/components/logger/dashboard/LoggerDashboard';
import { useRouter } from 'next/navigation';

const LoggerPage = () => {
  const { user, isAuthenticated, hasLoggerPermissions } = useLoggerAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/logger/login');
    }
  }, [isAuthenticated, router]);

  // If user is authenticated and has logger permissions, show dashboard
  if (isAuthenticated && hasLoggerPermissions) {
    return (
      <>
        <LoggerDashboard />
      </>
    );
  }

  // If user is authenticated but doesn't have logger permissions, show access denied
  if (isAuthenticated && !hasLoggerPermissions) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to be logged in with logger permissions to access this platform.
          </p>
          <button
            onClick={() => router.push('/logger/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            Logger Login
          </button>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Redirecting to login...</p>
      </div>
    </div>
  );
};

export default LoggerPage;