"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AdminLoggerLoginFormProps {
  onLoginSuccess?: () => void;
  initialUserType?: 'admin' | 'logger';
}

export function AdminLoggerLoginForm({ 
  onLoginSuccess,
  initialUserType = 'admin'
}: AdminLoggerLoginFormProps) {
  const [userType, setUserType] = useState<'admin' | 'logger'>(initialUserType);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, user } = useAuth();

  // Redirect based on user role after authentication
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'super-admin') {
        router.push('/admin/dashboard');
      } else if (user.role.startsWith('logger') || user.role === 'senior-logger' || user.role === 'logger-admin') {
        router.push('/logger');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login({ email, password });
      
      // The redirection will be handled by the useEffect above
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // If user is already authenticated, don't render the form
  if (user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Type Selector */}
      <div className="flex bg-gray-700 rounded-lg p-1">
        <button
          type="button"
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
          type="button"
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your password"
            required
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/30 px-3 py-2 rounded-lg border border-red-800/50">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : `Sign in as ${userType === 'admin' ? 'Admin' : 'Logger'}`}
        </button>
      </form>
    </div>
  );
}