'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoggerDashboard from '@/components/logger/dashboard/LoggerDashboard';
import { useRouter } from 'next/navigation';

const LoggerPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect based on authentication status and role
  useEffect(() => {
    if (!loading.initializing) {
      if (!user) {
        router.push('/logger/login');
      } else if (user.role === 'admin' || user.role === 'super-admin') {
        // If user is an admin, redirect to admin dashboard
        router.push('/admin/dashboard');
      } else if (!user.role.startsWith('logger') && user.role !== 'senior-logger' && user.role !== 'logger-admin') {
        // If user is not a logger, redirect to main site
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading.initializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated or not a logger, don't render the dashboard
  if (!user || (!user.role.startsWith('logger') && user.role !== 'senior-logger' && user.role !== 'logger-admin')) {
    return null;
  }

  // If user is authenticated and is a logger, show dashboard
  return (
    <>
      <LoggerDashboard />
    </>
  );
};

export default LoggerPage;