import React, { Suspense } from 'react';
import LoginFormClient from './components/LoginFormClient';
import LoginFormLoading from './components/LoginFormLoading';

export default function UnifiedLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <Suspense fallback={<LoginFormLoading />}>
        <LoginFormClient />
      </Suspense>
    </div>
  );
}