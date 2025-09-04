"use client";

import React, { useState, useEffect } from 'react';
import AdminDashboard from '@/components/logger/admin/AdminDashboard';
import AdminLoginForm from '@/components/logger/admin/AdminLoginForm';
import { useAuth } from '@/hooks/useAuth';

export default function AdminPage() {
  const { user: adminUser, isAuthenticated: isAdminAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading check
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <AdminLoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminDashboard />
    </div>
  );
}