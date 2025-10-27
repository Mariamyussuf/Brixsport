'use client';

import React from 'react';
import { AdminLoggerLoginForm } from '@/components/shared/AdminLoggerLoginForm';

export default function LoggerLoginPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto bg-gray-700 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">{process.env.NEXT_PUBLIC_LOGGER_APP_NAME || 'Logger Access'}</h1>
            <p className="text-gray-400 mt-2">{process.env.NEXT_PUBLIC_LOGGER_APP_DESCRIPTION || 'Secure logging platform'}</p>
          </div>
          <AdminLoggerLoginForm initialUserType="logger" />
        </div>
      </div>
    </div>
  );
}