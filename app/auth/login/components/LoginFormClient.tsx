'use client';

import { useState } from 'react';
import { useAuth, type AuthContextType } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const LoginFormClient = () => {
  const { login, loading } = useAuth();
  const { loggingIn } = loading || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoading = loggingIn || false;
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
          <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={loginEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:border-white/30 transition-all duration-200"
            placeholder="Enter your email"
            required
          />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={loginPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border-2 border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:border-white/30 transition-all duration-200 pr-12"
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded p-1"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
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
          <Link href="/auth/reset-password" className="font-medium text-blue-500 hover:text-blue-400 hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
      {error && (
        <div className="p-3 rounded-lg bg-red-900/50 border border-red-500 text-red-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="relative w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-3">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Signing In...</span>
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </div>
      </form>
    );
  };


  return (
    <div className="w-full max-w-md mx-auto mt-10">
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
          
          <div className="text-center pt-6 border-t border-white/10 mt-6">
            <span className="text-white/70">Don't have an account? </span>
            <Link 
              href="/auth/signup" 
              className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors duration-200"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginFormClient;