'use client';

import React from 'react';
import { AdminLoggerLoginForm } from '@/components/shared/AdminLoggerLoginForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function AdminLoggerPage() {
  const { user } = useAuth();
  const router = useRouter();

  // If user is already authenticated, redirect based on role
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'super-admin') {
        router.push('/admin/dashboard');
      } else if (user.role.startsWith('logger') || user.role === 'senior-logger' || user.role === 'logger-admin') {
        router.push('/logger');
      }
    }
  }, [user, router]);

  if (user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 w-20 h-20 flex items-center justify-center mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">BrixSports Platform</h1>
            <p className="text-gray-300">Access Admin or Logger Dashboard</p>
          </div>

          <AdminLoggerLoginForm />

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Select your role to access the appropriate dashboard
            </p>
          </div>

          <div className="mt-6 text-center text-sm">
            <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
              ← Back to main platform
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}