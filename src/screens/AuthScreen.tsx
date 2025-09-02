"use client";
import React, { useState } from 'react';

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
    else if (tab === 'signup' && !validatePasswordStrength(form.password)) {
      errs.password = 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.';
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (tab === 'signup') {
      if (!form.confirmPassword) errs.confirmPassword = 'Please confirm your password.';
      else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setSubmitError('');
    if (Object.keys(errs).length > 0) return;
    setSubmitError('This is a demo. Backend not connected.');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
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
    setForgotSuccess(true);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-start items-center text-white overflow-hidden" style={{ background: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(/onboarding-bg-1.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* BrixSports Logo */}
      <div className="absolute top-8 sm:top-12 md:top-16 left-0 right-0 flex justify-center z-20">
        <div className="flex items-center gap-1">
          <span className="text-white text-4xl sm:text-5xl md:text-6xl font-bold">BrixSports</span>
          <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2 sm:w-12 sm:h-12 md:w-14 md:h-14">
            <circle cx="16" cy="16" r="15" stroke="white" strokeWidth="2" fill="none" />
            <path d="M16 1v30M1 16h30M6 6l20 20M26 6L6 26" stroke="white" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      {/* Content */}
      <div className="relative z-10 w-full flex flex-col items-center px-6 pb-10 pt-24 min-h-screen justify-end max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex w-full max-w-md mx-auto mb-8 mt-24">
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
            onSubmit={handleSubmit}
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
              />
              <button
                type="button"
                className="absolute right-0 top-8 text-white/60 hover:text-white focus:outline-none"
                tabIndex={0}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(v => !v)}
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
                >
                  Forgot password?
                </button>
              </div>
            )}
            <button
              type="submit"
              className="w-full py-4 rounded-full bg-white/20 backdrop-blur-sm border border-white/60 text-white text-xl font-semibold mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all hover:bg-white/30 shadow-md hover:shadow-lg active:scale-98 mt-8"
              aria-label={tab === 'signup' ? 'Sign Up' : 'Log in'}
            >
              {tab === 'signup' ? 'Sign Up' : 'Log in'}
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
              />
              {forgotError && <span id="forgotEmail-error" className="text-red-400 text-sm mt-1">{forgotError}</span>}
            </div>
            {forgotSuccess && <div className="text-green-400 text-center text-sm mt-2">If this email exists, a recovery link has been sent.</div>}
            <div className="flex gap-4">
              <button
                type="button"
                className="flex-1 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/60 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all hover:bg-white/30 shadow-md"
                onClick={() => setShowForgot(false)}
              >
                Back to Log in
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-full bg-blue-500/80 backdrop-blur-sm border border-blue-400 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all hover:bg-blue-600 shadow-md"
              >
                Recover password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}; 