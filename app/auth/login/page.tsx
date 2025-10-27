import React, { Suspense } from 'react';
import LoginFormClient from './components/LoginFormClient';
import LoginFormLoading from './components/LoginFormLoading';

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={<LoginFormLoading />}>
      <LoginFormClient />
    </Suspense>
  );
}