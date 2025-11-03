import React, { Suspense } from 'react';
import SignupForm from '@/components/auth/SignupForm';
import SignupFormLoading from './components/SignupFormLoading';

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFormLoading />}>
      <SignupForm />
    </Suspense>
  );
}