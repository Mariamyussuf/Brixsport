"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoggerAuth } from '@/contexts/LoggerAuthContext';

interface DedicatedLoggerLoginFormProps {
  onLoginSuccess?: () => void;
}

export function DedicatedLoggerLoginForm({ onLoginSuccess }: DedicatedLoggerLoginFormProps) {
  const [email, setEmail] = useState('logger@example.com');
  const [password, setPassword] = useState('logger123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useLoggerAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login({ email, password });
      router.push('/logger');
      onLoginSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. For local development, use logger@example.com / logger123');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
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

        <div className="text-xs text-gray-400">
          <p>For local development, use:</p>
          <p className="font-mono">logger@example.com / logger123</p>
          <p className="mt-2">On Vercel deployment, use your actual logger credentials.</p>
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
          {isLoading ? 'Signing in...' : 'Sign in as Logger'}
        </button>
      </form>
    </div>
  );
}