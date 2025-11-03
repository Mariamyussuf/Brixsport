'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const LoginFormClient = () => {
  const { login, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect based on user role after authentication
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'super-admin') {
        router.push('/admin/dashboard');
      } else if (user.role.startsWith('logger') || user.role === 'senior-logger' || user.role === 'logger-admin') {
        router.push('/logger');
      } else {
        const next = searchParams?.get('next');
        router.push(next || '/');
      }
    }
  }, [user, router, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError('');
    
    try {
      await login({ 
        email: formData.email, 
        password: formData.password 
      });
    } catch (err) {
      setError('Invalid email or password');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If user is already authenticated, don't render the form
  if (user) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-white">
        Log in to BrixSports
      </h1>
      
      <form
        className="w-full max-w-md flex flex-col gap-6"
        onSubmit={handleSubmit}
        id="login-panel"
        aria-labelledby="Log in"
        noValidate
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 ${error && error.includes('email') ? 'border-red-500' : ''}`}
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            aria-invalid={!!error && error.includes('email')}
            aria-describedby={error && error.includes('email') ? 'email-error' : undefined}
            disabled={isLoading}
          />
          {error && error.includes('email') && <span id="email-error" className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</span>}
        </div>
        <div className="flex flex-col gap-2 relative">
          <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-10 ${error ? 'border-red-500' : ''}`}
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            aria-invalid={!!error}
            aria-describedby={error ? 'password-error' : undefined}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
            tabIndex={0}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(v => !v)}
            disabled={isLoading}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.36 6.36A9.956 9.956 0 0021 12c0-5.523-4.477-10-10-10a9.956 9.956 0 00-6.36 2.36M3 3l18 18z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.36 6.36A9.956 9.956 0 0021 12c0-5.523-4.477-10-10-10a9.956 9.956 0 00-6.36 2.36M3 3l18 18z" />
              </svg>
            )}
          </button>
          {error && <span id="password-error" className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</span>}
        </div>

        {error && <div className="text-red-500 dark:text-red-400 text-center text-xs mt-2">{error}</div>}
        <div className="flex justify-end">
          <Link
            href="/auth/reset-password"
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline focus:outline-none"
            tabIndex={0}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm mt-6 disabled:opacity-50"
          aria-label="Log in"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : 'Log in'}
        </button>

        {/* Sign Up Link */}
        <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400 text-sm">Don't have an account? </span>
          <Link 
            href="/auth/signup" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium text-sm transition-colors duration-200"
          >
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginFormClient;