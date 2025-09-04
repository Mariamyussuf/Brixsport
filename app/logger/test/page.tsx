// Test Page for Logger Notifications
// Used to test the logger notification system

import React from 'react';

const TestLoggerPage: React.FC = () => {
  // Only render in development mode
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Test Page Not Available</h1>
          <p className="text-gray-600 dark:text-gray-400">
            This test page is only available in development mode.
          </p>
        </div>
      </div>
    );
  }

  // Dynamically import the client-only component
  const ClientTestLoggerPage = React.lazy(() => import('./client-page'));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Logger Notification Test</h1>
        <React.Suspense fallback={<div>Loading...</div>}>
          <ClientTestLoggerPage />
        </React.Suspense>
      </div>
    </div>
  );
};

export default TestLoggerPage;