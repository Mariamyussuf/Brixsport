"use client";
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

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
  
  const router = useRouter();
  const { signup } = useAuth();

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
      // Use the signup function from the useAuth hook
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      // Redirect to onboarding after successful signup
      router.push('/onboarding');
    } catch (error: any) {
      rateLimiter.recordAttempt();
      
      // Provide more user-friendly error messages
      let errorMessage = error.message || 'Network error. Please check your connection and try again.';
      
      // Handle specific error cases
      if (errorMessage.includes('already exists')) {
        errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
      } else if (errorMessage.includes('environment variables') || errorMessage.includes('configuration')) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (errorMessage.includes('password')) {
        errorMessage = `Password error: ${errorMessage}`;
      }
      
      setSubmitError(errorMessage);
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
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">
        Sign Up
      </h1>
      
      {/* Rate limiting warning */}
      {!rateLimiter.canAttempt() && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-red-800 dark:text-red-200">Too Many Attempts</span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300">Please try again in {Math.ceil(rateLimiter.getRemainingTime() / 1000 / 60)} minutes.</p>
        </div>
      )}

      <form
        className="w-full max-w-md flex flex-col gap-6"
        onSubmit={handleSubmit}
        id="signup-panel"
        aria-labelledby="Sign Up"
        noValidate
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.name ? 'border-red-500' : ''}`}
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            required
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            disabled={isLoading}
          />
          {errors.name && <span id="name-error" className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name}</span>}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.email ? 'border-red-500' : ''}`}
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            disabled={isLoading}
          />
          {errors.email && <span id="email-error" className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email}</span>}
        </div>

        <div className="flex flex-col gap-2 relative">
          <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-10 ${errors.password ? 'border-red-500' : ''}`}
            placeholder="Create password"
            value={form.password}
            onChange={handleChange}
            required
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
            tabIndex={0}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(v => !v)}
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
          {errors.password && <span id="password-error" className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.password}</span>}
          
          {/* Password Strength Indicator */}
          {showPasswordStrength && passwordStrength && (
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Password strength:</span>
                <span className={`text-xs font-medium capitalize ${
                  passwordStrength.strength === 'strong' ? 'text-green-600 dark:text-green-400' :
                  passwordStrength.strength === 'good' ? 'text-yellow-600 dark:text-yellow-400' :
                  passwordStrength.strength === 'fair' ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {passwordStrength.strength}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full ${
                      level <= (['weak', 'fair', 'good', 'strong'].indexOf(passwordStrength.strength) + 1)
                        ? getStrengthColor(passwordStrength.strength)
                        : 'bg-gray-200 dark:bg-gray-700'
                    } transition-colors duration-200`}
                  />
                ))}
              </div>
              {passwordStrength.errors.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <span>Missing: </span>
                  <span>{passwordStrength.errors.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400 ${errors.confirmPassword ? 'border-red-500' : ''}`}
            placeholder="Confirm password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
            disabled={isLoading}
          />
          {errors.confirmPassword && <span id="confirmPassword-error" className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.confirmPassword}</span>}
        </div>

        {submitError && <div className="text-red-500 dark:text-red-400 text-center text-xs mt-2">{submitError}</div>}

        {/* Terms and Privacy */}
        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline">
            Privacy Policy
          </Link>
          .
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm mt-6 disabled:opacity-50"
          aria-label="Sign Up"
          disabled={isLoading || !rateLimiter.canAttempt()}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : 'Sign Up'}
        </button>

        {/* Sign In Link */}
        <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-400 text-sm">Already have an account? </span>
          <Link 
            href="/auth/login" 
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium text-sm transition-colors duration-200"
          >
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignupForm;