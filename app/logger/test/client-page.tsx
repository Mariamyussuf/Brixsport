'use client';

import React from 'react';
import TestLoggerNotifications from '@/components/logger/TestLoggerNotifications';
import { LoggerProvider } from '@/contexts/LoggerContext';

const ClientTestLoggerPage: React.FC = () => {
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <LoggerProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Logger Notification Test</h1>
          <TestLoggerNotifications />
        </div>
      </div>
    </LoggerProvider>
  );
};

export default ClientTestLoggerPage;