'use client';

import React, { useEffect } from 'react';
import { useLoggerAuth } from '@/contexts/LoggerAuthContext';
import LoggerDashboard from '@/components/logger/dashboard/LoggerDashboard';
import { useRouter } from 'next/navigation';

const LoggerPage = () => {
  const { isAuthenticated } = useLoggerAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/logger/login');
    }
  }, [isAuthenticated, router]);

  // If user is authenticated, show dashboard
  if (isAuthenticated) {
    return (
      <>
        <LoggerDashboard />
      </>
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