"use client";
import React, { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

// Types
interface FormData {
  email: string;
  password: string;
}

interface ValidationErrors {
  [key: string]: string;
}

// Mock rate limiter (replace with your actual rate limiting logic)
class RateLimiter {
  canAttempt(): boolean {
    return true;
  }
  
  getRemainingTime(): number {
    return 0;
  }
  
  getRemainingAttempts(): number {
    return 5;
  }
}

const rateLimiter = new RateLimiter();

// Mock API functions (replace with your actual API calls)
const mockForgotPassword = async (email: string) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  return { success: true, message: 'Password reset link sent!' };
};

// Enhanced email validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot password state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

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
    } else if (!validateEmail(form.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!form.password) {
      errs.password = 'Password is required';
    }
    
    return errs;
  }, [form]);

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
      // Pass the form credentials to the login function
      await login({
        email: form.email,
        password: form.password
      });

      // Clear any previous errors
      setSubmitError('');

      // Redirect to homepage
      window.location.href = '/';
    } catch (error) {
      setSubmitError('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess(false);
    
    if (!forgotEmail.trim()) {
      setForgotError('Email address is required');
      return;
    }
    
    if (!validateEmail(forgotEmail.trim())) {
      setForgotError('Please enter a valid email address');
      return;
    }

    setIsForgotLoading(true);
    
    try {
      const response = await mockForgotPassword(forgotEmail);
      if (response.success) {
        setForgotSuccess(true);
      } else {
        setForgotError(response.message);
      }
    } catch (error) {
      setForgotError('Network error. Please try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">
        {showForgot ? 'Reset Password' : 'Welcome Back'}
      </h1>
      
      {!showForgot ? (
        <>
          {/* Rate limiting warning */}
          {!rateLimiter.canAttempt() && (
            <div className="mb-6 p-4 rounded-lg bg-red-900/50 border border-red-500 text-red-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Account Temporarily Locked</span>
              </div>
              <p className="text-sm">Too many failed login attempts. Please try again in {Math.ceil(rateLimiter.getRemainingTime() / 1000 / 60)} minutes.</p>
            </div>
          )}

          <form
            className="flex flex-col gap-6"
            onSubmit={handleSubmit}
            noValidate
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`w-full bg-white/5 border-2 rounded-lg px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-400' 
                      : 'border-white/20 hover:border-white/30'
                  }`}
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {form.email && !errors.email && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
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
              <label htmlFor="password" className="block text-sm font-medium text-white/90">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`w-full bg-white/5 border-2 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                    errors.password 
                      ? 'border-red-500 focus:ring-red-400' 
                      : 'border-white/20 hover:border-white/30'
                  }`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded p-1"
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

            {/* Submit Error */}
            {submitError && (
              <div className="p-4 rounded-lg bg-red-900/50 border border-red-500 text-red-200">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">{submitError}</span>
                </div>
                {rateLimiter.getRemainingAttempts() > 0 && (
                  <p className="text-xs mt-1 text-red-300">
                    {rateLimiter.getRemainingAttempts()} attempt(s) remaining
                  </p>
                )}
              </div>
            )}

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-blue-400 text-sm hover:text-blue-300 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1 transition-colors duration-200"
                onClick={() => {
                  setShowForgot(true);
                  setForgotEmail(form.email);
                  setForgotError('');
                  setForgotSuccess(false);
                }}
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !rateLimiter.canAttempt()}
              className="relative w-full py-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transform hover:scale-[1.02] active:scale-[0.98]"
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

            {/* Sign Up Link */}
            <div className="text-center pt-6 border-t border-white/10">
              <span className="text-white/70">Don't have an account? </span>
              <Link 
                href="/auth/signup" 
                className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors duration-200"
              >
                Create one now
              </Link>
            </div>
          </form>
        </>
      ) : (
        /* Forgot Password Form */
        <form className="flex flex-col gap-6" onSubmit={handleForgotSubmit} noValidate>
          <div className="text-center mb-4">
            <p className="text-white/80 text-sm leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="forgotEmail" className="block text-sm font-medium text-white/90">
              Email Address
            </label>
            <div className="relative">
              <input
                id="forgotEmail"
                name="forgotEmail"
                type="email"
                autoComplete="email"
                className={`w-full bg-white/5 border-2 rounded-lg px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                  forgotError 
                    ? 'border-red-500 focus:ring-red-400' 
                    : 'border-white/20 hover:border-white/30'
                }`}
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => {
                  setForgotEmail(e.target.value);
                  setForgotError('');
                  setForgotSuccess(false);
                }}
                disabled={isForgotLoading}
                required
                aria-invalid={!!forgotError}
                aria-describedby={forgotError ? 'forgotEmail-error' : undefined}
              />
            </div>
            {forgotError && (
              <p id="forgotEmail-error" className="text-red-400 text-sm flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {forgotError}
              </p>
            )}
          </div>

          {forgotSuccess && (
            <div className="p-4 rounded-lg bg-green-900/50 border border-green-500 text-green-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">
                  Password reset link sent! Check your email and follow the instructions to reset your password.
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 py-3 px-4 rounded-lg bg-white/10 border border-white/20 text-white font-medium transition-all duration-200 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50"
              onClick={() => {
                setShowForgot(false);
                setForgotEmail('');
                setForgotError('');
                setForgotSuccess(false);
              }}
              disabled={isForgotLoading}
            >
              Back to Sign In
            </button>
            <button
              type="submit"
              disabled={isForgotLoading}
              className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700"
            >
              {isForgotLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 rounded-lg bg-blue-900/30 border border-blue-500/30 text-blue-200">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5v3a.75.75 0 001.5 0v-3A.75.75 0 009 9z" clipRule="evenodd" />
              </svg>
              <div className="text-xs">
                <p className="font-medium mb-1">Demo Mode</p>
                <p>Use <code className="bg-blue-800/50 px-1 rounded">demo@example.com</code> with password <code className="bg-blue-800/50 px-1 rounded">password123</code></p>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginForm;
            