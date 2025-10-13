"use client";

import React, { useState, useCallback } from 'react';
import AdminService from '@/services/AdminService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Types
interface FormData {
  email: string;
  password: string;
  twoFactorCode?: string;
}

interface ValidationErrors {
  [key: string]: string;
}

const AdminLoginForm: React.FC = () => {
  const router = useRouter();
  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);

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
    
    // Two-factor code validation (only if showing)
    if (showTwoFactor && !form.twoFactorCode) {
      errs.twoFactorCode = 'Two-factor code is required';
    } else if (showTwoFactor && form.twoFactorCode && form.twoFactorCode.length !== 6) {
      errs.twoFactorCode = 'Code must be 6 digits';
    }
    
    return errs;
  }, [form, showTwoFactor]);

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
      // Handle regular login
      const result = await AdminService.login(form.email, form.password);
      
      if (!result.success) {
        setSubmitError(result.error || 'Login failed');
        return;
      }
      
      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (error: any) {
      setSubmitError('Login failed. Please check your credentials and try again.');
      console.error('Admin login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Admin Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.email 
                ? 'border-red-500 focus:ring-red-500' 
                : 'hover:border-gray-500'
            }`}
            placeholder={process.env.NEXT_PUBLIC_ADMIN_DEFAULT_EMAIL || "admin@brixsports.com"}
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
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
              errors.password 
                ? 'border-red-500 focus:ring-red-500' 
                : 'hover:border-gray-500'
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
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
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

      {/* Two-Factor Authentication (if enabled) */}
      {showTwoFactor && (
        <div className="space-y-2">
          <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-300">
            Two-Factor Code
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="twoFactorCode"
              name="twoFactorCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.twoFactorCode 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'hover:border-gray-500'
              }`}
              placeholder="123456"
              value={form.twoFactorCode || ''}
              onChange={handleChange}
              disabled={isLoading}
              required={showTwoFactor}
              aria-invalid={!!errors.twoFactorCode}
              aria-describedby={errors.twoFactorCode ? '2fa-error' : undefined}
            />
          </div>
          
          {errors.twoFactorCode && (
            <p id="2fa-error" className="text-red-400 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.twoFactorCode}
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="p-4 rounded-lg bg-red-900/30 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{submitError}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-700 hover:to-red-800 transform hover:scale-[1.02] active:scale-[0.98]"
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
          'Access Admin Dashboard'
        )}
      </button>
    </form>
  );
};

export default AdminLoginForm;