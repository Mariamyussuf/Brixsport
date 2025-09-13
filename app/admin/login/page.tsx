'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import AdminLoginForm from '@/components/admin/shared/AdminLoginForm';
import LoggerLoginForm from '@/components/logger/shared/LoggerLoginForm';

export default function AdminLoggerLoginPage() {
  const { login, demoLogin } = useAuth();
  const router = useRouter();
  const [userType, setUserType] = useState<'admin' | 'logger'>('admin');

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      await login(credentials);
      
      // Redirect based on user role
      if (userType === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/logger');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleDemoLogin = async () => {
    try {
      // Set URL params to indicate the role for demo login
      const url = new URL(window.location.href);
      url.searchParams.set('role', userType);
      window.history.replaceState({}, '', url.toString());
      
      await demoLogin();
      
      // Redirect based on user type selection
      if (userType === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/logger');
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">BrixSports Admin Platform</h1>
            <p className="text-gray-400 mt-2">
              {userType === 'admin' 
                ? 'Administrative Dashboard' 
                : 'Match Logging Platform'}
            </p>
          </div>

          {/* User Type Selector */}
          <div className="flex mb-6 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setUserType('admin')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userType === 'admin'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setUserType('logger')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userType === 'logger'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Logger
            </button>
          </div>

          {/* Login Forms */}
          {userType === 'admin' ? (
            <AdminLoginForm onLogin={handleLogin} onDemoLogin={handleDemoLogin} />
          ) : (
            <LoggerLoginForm onLogin={handleLogin} onDemoLogin={handleDemoLogin} />
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              {userType === 'admin'
                ? 'Access administrative features and manage loggers'
                : 'Log sports events and manage match data'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}