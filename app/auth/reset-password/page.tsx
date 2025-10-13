import React, { Suspense } from 'react';
import ResetPasswordClient from '@/components/auth/ResetPasswordClient';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordClient />
    </Suspense>
  );
}