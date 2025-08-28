"use client";
import React, { useState, useCallback } from 'react';
import Link from 'next/link';

// Types
interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface SignupResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Enhanced email validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Password strength validation
function validatePassword(password: string): { isValid: boolean; strength: 'weak' | 'fair' | 'good' | 'strong'; errors: string[] } {
  const errors: string[] = [];
  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
  
  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('One number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('One special character');
  }

  // Determine strength
  const criteriasMet = 5 - errors.length;
  if (criteriasMet >= 4) strength = 'strong';
  else if (criteriasMet >= 3) strength = 'good';
  else if (criteriasMet >= 2) strength = 'fair';
  
  return {
    isValid: errors.length === 0,
    strength,
    errors
  };
}

// Name validation
function validateName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 50;
}

// Rate limiting helper
class RateLimiter {
  private attempts: number = 0;
  private lastAttempt: number = 0;
  private readonly maxAttempts = 3;
  private readonly lockoutDuration = 10 * 60 * 1000; // 10 minutes

  canAttempt(): boolean {
    const now = Date.now();
    if (now - this.lastAttempt > this.lockoutDuration) {
      this.attempts = 0;
    }
    return this.attempts < this.maxAttempts;
  }

  recordAttempt(): void {
    this.attempts++;
    this.lastAttempt = Date.now();
  }

  getRemainingTime(): number {
    const now = Date.now();
    const timeSinceLastAttempt = now - this.lastAttempt;
    return Math.max(0, this.lockoutDuration - timeSinceLastAttempt);
  }

  getRemainingAttempts(): number {
    return Math.max(0, this.maxAttempts - this.attempts);
  }
}

const rateLimiter = new RateLimiter();

// Mock API functions (replace with your actual API calls)
const mockSignup = async (credentials: FormData): Promise<SignupResponse> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate different responses
      if (credentials.email === 'existing@example.com') {
        resolve({
          success: false,
          message: 'An account with this email already exists. Please use a different email or try signing in.'
        });
      } else if (credentials.email.includes('invalid')) {
        resolve({
          success: false,
          message: 'Invalid email domain. Please use a valid email address.'
        });
      } else {
        resolve({
          success: true,
          token: 'mock-jwt-token',
          user: {
            id: '1',
            email: credentials.email,
            name: credentials.name
          }
        });
      }
    }, 2000); // Simulate network delay
  });
};

const SignupForm: React.FC = () => {
  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password strength state
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);

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

    // Show password strength indicator when user starts typing password
    if (name === 'password') {
      setShowPasswordStrength(value.length > 0);
    }

    // Real-time password confirmation validation
    if (name === 'confirmPassword' && form.password && value !== form.password) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
    } else if (name === 'confirmPassword' && form.password && value === form.password) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  }, [errors, submitError, form.password]);

  // Comprehensive form validation
  const validate = useCallback((): ValidationErrors => {
    const errs: ValidationErrors = {};
    
    // Name validation
    if (!form.name.trim()) {
      errs.name = 'Full name is required';
    } else if (!validateName(form.name)) {
      errs.name = 'Name must be between 2 and 50 characters';
    }
    
    // Email validation
    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!validateEmail(form.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!form.password) {
      errs.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(form.password);
      if (!passwordValidation.isValid) {
        errs.password = `Password must include: ${passwordValidation.errors.join(', ')}`;
      }
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (form.password && form.confirmPassword !== form.password) {
      errs.confirmPassword = 'Passwords do not match';
    }
    
    return errs;
  }, [form]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    if (!rateLimiter.canAttempt()) {
      const remainingTime = Math.ceil(rateLimiter.getRemainingTime() / 1000 / 60);
      setSubmitError(`Too many signup attempts. Please try again in ${remainingTime} minutes.`);
      return;
    }

    // Validate form
    const errs = validate();
    setErrors(errs);
    setSubmitError('');
    
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    
    try {
      const response = await mockSignup(form);
      
      if (response.success) {
        // Success! In a real app, you'd:
        // 1. Store the token securely (httpOnly cookie or secure storage)
        // 2. Redirect to dashboard or intended page
        // 3. Update global auth state
        console.log('Signup successful:', response);
        setSubmitError(''); // Clear any previous errors
        
        // Mock redirect
        alert(`Welcome, ${response.user?.name || 'User'}! Account created successfully.`);
      } else {
        rateLimiter.recordAttempt();
        setSubmitError(response.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      rateLimiter.recordAttempt();
      setSubmitError('Network error. Please check your connection and try again.');
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get password strength info
  const passwordStrength = form.password ? validatePassword(form.password) : null;

  // Password strength color classes
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-500';
      case 'good': return 'bg-yellow-500';
      case 'fair': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-white">
        Create Account
      </h1>
      
      {/* Rate limiting warning */}
      {!rateLimiter.canAttempt() && (
        <div className="mb-6 p-4 rounded-lg bg-red-900/50 border border-red-500 text-red-200">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Too Many Attempts</span>
          </div>
          <p className="text-sm">Please try again in {Math.ceil(rateLimiter.getRemainingTime() / 1000 / 60)} minutes.</p>
        </div>
      )}

      <form
        className="flex flex-col gap-6"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium text-white/90">
            Full Name
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className={`w-full bg-white/5 border-2 rounded-lg px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                errors.name 
                  ? 'border-red-500 focus:ring-red-400' 
                  : 'border-white/20 hover:border-white/30'
              }`}
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              disabled={isLoading}
              required
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {form.name && !errors.name && validateName(form.name) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {errors.name && (
            <p id="name-error" className="text-red-400 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {errors.name}
            </p>
          )}
        </div>

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
            {form.email && !errors.email && validateEmail(form.email) && (
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
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
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
              autoComplete="new-password"
              className={`w-full bg-white/5 border-2 rounded-lg px-4 py-3 pr-12 text-white placeholder-white/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                errors.password 
                  ? 'border-red-500 focus:ring-red-400' 
                  : 'border-white/20 hover:border-white/30'
              }`}
              placeholder="Create a strong password"
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
          
          {/* Password Strength Indicator */}
          {showPasswordStrength && passwordStrength && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/70">Password strength:</span>
                <span className={`text-xs font-medium capitalize ${
                  passwordStrength.strength === 'strong' ? 'text-green-400' :
                  passwordStrength.strength === 'good' ? 'text-yellow-400' :
                  passwordStrength.strength === 'fair' ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {passwordStrength.strength}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      level <= (['weak', 'fair', 'good', 'strong'].indexOf(passwordStrength.strength) + 1)
                        ? getStrengthColor(passwordStrength.strength)
                        : 'bg-white/20'
                    } transition-colors duration-200`}
                  />
                ))}
              </div>
              {passwordStrength.errors.length > 0 && (
                <div className="text-xs text-white/60">
                  <span>Missing: </span>
                  <span>{passwordStrength.errors.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          {errors.password && (
            <p id="password-error" className="text-red-400 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`w-full bg-white/5 border-2 rounded-lg px-4 py-3 text-white placeholder-white/50 backdrop-blur-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${
                errors.confirmPassword 
                  ? 'border-red-500 focus:ring-red-400' 
                  : 'border-white/20 hover:border-white/30'
              }`}
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              required
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            />
            {form.confirmPassword && form.password && form.confirmPassword === form.password && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          {errors.confirmPassword && (
            <p id="confirmPassword-error" className="text-red-400 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {errors.confirmPassword}
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

        {/* Terms and Privacy */}
        <div className="text-xs text-white/60 leading-relaxed">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-blue-400 hover:text-blue-300 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-400 hover:text-blue-300 hover:underline">
            Privacy Policy
          </Link>
          .
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
              <span>Creating Account...</span>
            </div>
          ) : (
            'Create Account'
          )}
        </button>

        {/* Sign In Link */}
        <div className="text-center pt-6 border-t border-white/10">
          <span className="text-white/70">Already have an account? </span>
          <Link 
            href="/auth/login" 
            className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors duration-200"
          >
            Sign in instead
          </Link>
        </div>
      </form>

      {/* Demo information */}
      <div className="mt-8 p-4 rounded-lg bg-blue-900/30 border border-blue-500/30 text-blue-200">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5v3a.75.75 0 001.5 0v-3A.75.75 0 009 9z" clipRule="evenodd" />
          </svg>
          <div className="text-xs">
            <p className="font-medium mb-1">Demo Mode</p>
            <p>Try <code className="bg-blue-800/50 px-1 rounded">existing@example.com</code> to see error handling.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;