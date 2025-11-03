'use client';

import React from 'react';
import { useLoggerAuth } from '@/contexts/LoggerAuthContext';
import LoggerBasketballSchedule from '@/components/logger/basketball/LoggerBasketballSchedule';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoggerBasketballSchedulePage() {
  const { user, isAuthenticated } = useLoggerAuth();

  // Security check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need to be logged in with logger permissions to access this page.
          </p>
          <Button onClick={() => window.location.href = '/logger/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Basketball Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select a match to start logging events
          </p>
        </div>
        
        <LoggerBasketballSchedule />
      </div>
    </div>
  );
}