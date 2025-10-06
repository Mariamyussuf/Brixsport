'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Check if admin is trying to log in on the wrong domain
    if (typeof window !== 'undefined') {
      const currentHost = window.location.hostname;
      // If not on admin domain, show error
      if (!(currentHost === 'admin.brixsports.com' || currentHost === 'admin.brixsport.vercel.app' || currentHost.startsWith('localhost'))) {
        setError('Admin accounts can only be accessed from the admin domain (admin.brixsports.com).');
        setIsLoading(false);
        return;
      }
    }

    try {
      // Replace with actual admin authentication
      console.log('Admin login attempt:', { email });
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // On successful login, redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (err) {
      setError('Invalid admin credentials');
      console.error('Admin login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-gray-800 border-gray-700">
      <CardHeader className="space-y-1">
        <div className="mx-auto bg-gradient-to-br from-red-600 to-red-800 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-white">
          Admin Portal
        </CardTitle>
        <CardDescription className="text-center text-gray-400">
          Sign in to access the admin dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-900/20 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-gray-300">
              Admin Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-password" className="text-gray-300">
                Password
              </Label>
              <button
                type="button"
                className="text-sm text-blue-500 hover:text-blue-400"
                onClick={() => {/* Forgot password logic */}}
              >
                Forgot password?
              </button>
            </div>
            <Input
              id="admin-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in as Admin'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
