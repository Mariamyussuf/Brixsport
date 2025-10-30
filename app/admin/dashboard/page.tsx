"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/components/logger/admin/AdminDashboard';

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if user is not authenticated or not an admin
    if (!loading.initializing) {
      if (!user) {
        router.push('/admin/login');
      } else if (user.role !== 'admin' && user.role !== 'super-admin') {
        // If user is not an admin, redirect to appropriate dashboard
        if (user.role.startsWith('logger')) {
          router.push('/logger');
        } else {
          router.push('/');
        }
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading.initializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated or not an admin, don't render the dashboard
  if (!user || (user.role !== 'admin' && user.role !== 'super-admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminDashboard />
    </div>
  );
}