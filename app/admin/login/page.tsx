"use client";

import React from 'react';
import AdminLoginForm from '@/components/logger/admin/AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <AdminLoginForm />
      </div>
    </div>
  );
}