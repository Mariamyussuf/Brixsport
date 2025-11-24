"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePasswordStrength(password: string) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(password);
}

type AuthScreenProps = { initialTab?: 'signup' | 'login' };

export const AuthScreen: React.FC<AuthScreenProps> = ({ initialTab = 'signup' }) => {
  const [tab, setTab] = useState<'signup' | 'login'>(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [submitError, setSubmitError] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setSubmitError('');
  };

  const validate = () => {
    const errs: { [k: string]: string } = {};
    if (tab === 'signup' && !form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!validateEmail(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (tab === 'signup') {
      if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
      else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    }
    return errs;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setSubmitError('');
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      }).catch(error => {
        console.error('Network error when connecting to registration API:', error);
        throw new Error(`Network error: ${error.message}`);
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Signup failed');
      }

      // After successful signup, automatically log the user in
      await login({ email: form.email, password: form.password });
      router.push('/onboarding');
    } catch (err: any) {
      console.error('Signup error:', err);
      
      // Provide more specific error messages
      if (err.message.includes('network') || err.message.includes('fetch')) {
        setSubmitError('Unable to connect to the server. Please check your internet connection and try again.');
      } else if (err.message.includes('timeout')) {
        setSubmitError('Request timed out. Please try again.');
      } else {
        setSubmitError(err.message || 'Failed to sign up. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setSubmitError('');
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      router.push('/');
    } catch (err: any) {
      setSubmitError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess(false);
    if (!forgotEmail.trim()) {
      setForgotError('Email is required.');
      return;
    }
    if (!validateEmail(forgotEmail)) {
      setForgotError('Enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      // Always show success message for security (prevent email enumeration)
      setForgotSuccess(true);
      setForgotEmail('');
    } catch (err: any) {
      // Still show success for security
      setForgotSuccess(true);
      setForgotEmail('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-start items-center text-white overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* BrixSports Logo */}
      <div className="absolute top-4 sm:top-6 md:top-8 left-0 right-0 flex justify-center z-20">
        <div className="flex items-center gap-1">
          <span className="text-white text-2xl sm:text-3xl md:text-4xl font-bold">BrixSports</span>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 sm:w-8 sm:h-8 md:w-10 md:h-10">
            <circle cx="16" cy="16" r="15" stroke="white" strokeWidth="2" fill="none" />
            <path d="M16 1v30M1 16h30M6 6l20 20M26 6L6 26" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center px-6 pb-10 pt-16 md:pt-20 min-h-screen justify-end max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex w-full max-w-md mx-auto mb-6 mt-14">
          <button
            className={`flex-1 text-2xl font-semibold pb-2 border-b-2 transition-all ${tab === 'signup' ? 'border-white' : 'border-transparent text-white/60'}`}
            onClick={() => { setTab('signup'); setShowForgot(false); }}
            aria-selected={tab === 'signup'}
            aria-controls="signup-panel"
            tabIndex={0}
          >
            Sign Up
          </button>
          <button
            className={`flex-1 text-2xl font-semibold pb-2 border-b-2 transition-all ${tab === 'login' ? 'border-white' : 'border-transparent text-white/60'}`}
            onClick={() => { setTab('login'); setShowForgot(false); }}
            aria-selected={tab === 'login'}
            aria-controls="login-panel"
            tabIndex={0}
          >
            Log in
          </button>
        </div>
        {/* Form */}
        {!showForgot ? (
          <form
            className="w-full max-w-md flex flex-col gap-8"
            onSubmit={tab === 'signup' ? handleSignup : handleLogin}
            id={tab === 'signup' ? 'signup-panel' : 'login-panel'}
            aria-labelledby={tab === 'signup' ? 'Sign Up' : 'Log in'}
            noValidate
          >
            {tab === 'signup' && (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-lg text-white/80">Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    className={`bg-transparent border-b border-white/60 py-2 px-0 text-white text-lg focus:outline-none focus:border-white placeholder:text-white/60 ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    disabled={isLoading}
                  />
                  {errors.name && <span id="name-error" className="text-red-400 text-sm mt-1">{errors.name}</span>}
                </div>
              </>
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-lg text-white/80">{tab === 'signup' ? 'Enter your email' : 'E - mail'}</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`bg-transparent border-b border-white/60 py-2 px-0 text-white text-lg focus:outline-none focus:border-white placeholder:text-white/60 ${errors.email ? 'border-red-500' : ''}`}
                placeholder={tab === 'signup' ? 'Enter your email' : 'E - mail'}
                value={form.email}
                onChange={handleChange}
                required
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isLoading}
              />
              {errors.email && <span id="email-error" className="text-red-400 text-sm mt-1">{errors.email}</span>}
            </div>
            <div className="flex flex-col gap-2 relative">
              <label htmlFor="password" className="text-lg text-white/80">{tab === 'signup' ? 'Enter password' : 'Password'}</label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                className={`bg-transparent border-b border-white/60 py-2 px-0 text-white text-lg focus:outline-none focus:border-white placeholder:text-white/60 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                placeholder={tab === 'signup' ? 'Enter password' : 'Password'}
                value={form.password}
                onChange={handleChange}
                required
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-0 top-8 text-white/60 hover:text-white focus:outline-none"
                tabIndex={0}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(v => !v)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.36 6.36A9.956 9.956 0 0021 12c0-5.523-4.477-10-10-10a9.956 9.956 0 00-6.36 2.36M3 3l18 18z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.36 6.36A9.956 9.956 0 0021 12c0-5.523-4.477-10-10-10a9.956 9.956 0 00-6.36 2.36M3 3l18 18z" />
                  </svg>
                )}
              </button>
              {errors.password && <span id="password-error" className="text-red-400 text-sm mt-1">{errors.password}</span>}
            </div>
            {tab === 'signup' && (
              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="text-lg text-white/80">Confirm password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`bg-transparent border-b border-white/60 py-2 px-0 text-white text-lg focus:outline-none focus:border-white placeholder:text-white/60 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  disabled={isLoading}
                />
                {errors.confirmPassword && <span id="confirmPassword-error" className="text-red-400 text-sm mt-1">{errors.confirmPassword}</span>}
              </div>
            )}
            {submitError && <div className="text-red-400 text-center text-sm mt-2">{submitError}</div>}
            {tab === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-blue-400 text-sm hover:underline focus:outline-none"
                  onClick={() => { setShowForgot(true); setForgotEmail(''); setForgotError(''); setForgotSuccess(false); }}
                  tabIndex={0}
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
            )}
            <button
              type="submit"
              className="w-full py-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/60 text-white text-xl font-semibold mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all hover:bg-white/30 shadow-md hover:shadow-lg active:scale-98 mt-8 disabled:opacity-50"
              aria-label={tab === 'signup' ? 'Sign Up' : 'Log in'}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : tab === 'signup' ? 'Sign Up' : 'Log in'}
            </button>
          </form>
        ) : (
          <form className="w-full max-w-md flex flex-col gap-8" onSubmit={handleForgotSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <label htmlFor="forgotEmail" className="text-lg text-white/80">Enter your email to recover password</label>
              <input
                id="forgotEmail"
                name="forgotEmail"
                type="email"
                autoComplete="email"
                className={`bg-transparent border-b border-white/60 py-2 px-0 text-white text-lg focus:outline-none focus:border-white placeholder:text-white/60 ${forgotError ? 'border-red-500' : ''}`}
                placeholder="Email"
                value={forgotEmail}
                onChange={e => { setForgotEmail(e.target.value); setForgotError(''); setForgotSuccess(false); }}
                required
                aria-invalid={!!forgotError}
                aria-describedby={forgotError ? 'forgotEmail-error' : undefined}
                disabled={isLoading}
              />
              {forgotError && <span id="forgotEmail-error" className="text-red-400 text-sm mt-1">{forgotError}</span>}
            </div>
            {forgotSuccess && <div className="text-green-400 text-center text-sm mt-2">If this email exists, a recovery link has been sent.</div>}
            <div className="flex gap-4">
              <button
                type="button"
                className="flex-1 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/60 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all hover:bg-white/30 shadow-md disabled:opacity-50"
                onClick={() => setShowForgot(false)}
                disabled={isLoading}
              >
                Back to Log in
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-full bg-blue-500/80 backdrop-blur-sm border border-blue-400 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all hover:bg-blue-600 shadow-md disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </div>
                ) : 'Recover password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};