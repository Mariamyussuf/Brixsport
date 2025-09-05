"use client";

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Types
interface FormData {
  email: string;
  password: string;
  accessCode: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const LoggerLoginForm: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const router = useRouter();
  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
    accessCode: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);

  // Handle input changes with debounced validation
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear errors for the current field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear submit error
    if (submitError) {
      setSubmitError('');
    }
  }, [errors, submitError]);

  // Comprehensive form validation
  const validate = useCallback((): ValidationErrors => {
    const errs: ValidationErrors = {};
    
    // Email validation
    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      errs.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!form.password) {
      errs.password = 'Password is required';
    } else if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    
    // Access code validation (only if showing)
    if (showAccessCode && !form.accessCode) {
      errs.accessCode = 'Access code is required';
    }
    
    return errs;
  }, [form, showAccessCode]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errs = validate();
    setErrors(errs);
    setSubmitError('');

    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);

    try {
      // For logger login, we might want to add additional verification
      // This could include checking for a special access code or specific domain
      if (showAccessCode && form.accessCode !== 'LOGGER_ACCESS_2023') {
        throw new Error('INVALID_ACCESS_CODE');
      }

      // Pass the form credentials to the login function
      await login({
        email: form.email,
        password: form.password
      });

      // Redirect to logger dashboard
      router.push('/logger');
    } catch (error: any) {
      if (error.message === 'INVALID_ACCESS_CODE') {
        setSubmitError('Invalid access code. Please try again.');
      } else {
        setSubmitError('Login failed. Please check your credentials and try again.');
      }
      console.error('Logger login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle demo login - specifically for logger
  const handleDemoLogin = async () => {
    setIsLoading(true);
    setSubmitError('');
    
    try {
      // Set URL params to indicate this is a logger demo
      const url = new URL(window.location.href);
      url.searchParams.set('logger', 'true');
      url.searchParams.set('role', 'logger');
      window.history.replaceState({}, '', url.toString());
      
      await demoLogin();
      // Redirect to logger dashboard for demo users
      router.push('/logger');
    } catch (error) {
      setSubmitError('Demo login failed. Please try again.');
      console.error('Demo login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Logger Email
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={`w-full bg-gray-700 border-2 rounded-lg px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            placeholder="logger@brixsports.com"
            value={form.email}
            onChange={handleChange}
            disabled={isLoading}
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="text-red-400 text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`w-full bg-gray-700 border-2 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.password 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            disabled={isLoading}
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
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
        
        {errors.password && (
          <p id="password-error" className="text-red-400 text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errors.password}
          </p>
        )}
      </div>

      {/* Access Code Field (Hidden by default for additional security) */}
      {showAccessCode && (
        <div className="space-y-2">
          <label htmlFor="accessCode" className="block text-sm font-medium text-gray-300">
            Access Code
          </label>
          <div className="relative">
            <input
              id="accessCode"
              name="accessCode"
              type="password"
              className={`w-full bg-gray-700 border-2 rounded-lg px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.accessCode 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}
              placeholder="Enter access code"
              value={form.accessCode}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.accessCode}
              aria-describedby={errors.accessCode ? 'accessCode-error' : undefined}
            />
          </div>
          {errors.accessCode && (
            <p id="accessCode-error" className="text-red-400 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.accessCode}
            </p>
          )}
        </div>
      )}

      {/* Show Access Code Button */}
      {!showAccessCode && (
        <button
          type="button"
          onClick={() => setShowAccessCode(true)}
          className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Need access code?
        </button>
      )}

      {/* Submit Error */}
      {submitError && (
        <div className="p-3 rounded-lg bg-red-900/50 border border-red-500 text-red-200 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-800 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Authenticating...</span>
          </div>
        ) : (
          'Access Logger Platform'
        )}
      </button>

      {/* Demo Login */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDemoLogin}
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-lg bg-gray-700 border border-gray-600 text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Demo Logger Access
      </button>

      {/* Security Notice */}
      <div className="mt-6 p-3 rounded-lg bg-blue-900/30 border border-blue-500/30 text-blue-200 text-xs">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5v3a.75.75 0 001.5 0v-3A.75.75 0 009 9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium mb-1">Secure Access Only</p>
            <p>This platform is restricted to authorized sports event loggers only.</p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default LoggerLoginForm;