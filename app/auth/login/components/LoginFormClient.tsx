'use client';

import { useState } from 'react';
import { useAuth, type AuthContextType } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


const LoginFormClient = () => {
  const { login, loading } = useAuth();
  const { loggingIn } = loading || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoading = loggingIn || false;
  const [error, setError] = useState('');

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      await login(credentials);
      const next = searchParams?.get('next');
      router.push(next || '/');
    } catch (err) {
      setError('Invalid email or password');
      console.error('Login error:', err);
    }
  };

  const UserLoginForm = () => {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    
    const handleUserSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleLogin({ 
        email: loginEmail, 
        password: loginPassword
      });
    };
    return (
      <form onSubmit={handleUserSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={loginEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="your.email@example.com"
          />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
          Password
        </label>
          <input
            type="password"
            id="password"
            name="password"
            value={loginPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
            Remember me
          </label>
        </div>
        <div className="text-sm">
          <a href="#" className="font-medium text-blue-500 hover:text-blue-400">
            Forgot password?
          </a>
        </div>
      </div>
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign in
        </button>
      </div>
      </form>
    );
  };


  return (
    <div className="w-full max-w-md mx-auto mt-10">
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      <Card className="bg-gray-800 rounded-2xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-white">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-8">
            <div className="mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">BrixSports Platform</h1>
            <p className="text-gray-400 mt-2">
              Player and Team Management
            </p>
          </div>

          <UserLoginForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginFormClient;