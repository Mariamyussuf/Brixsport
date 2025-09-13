"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useLoggerAuth } from '@/hooks/useAuth';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth for logout function
import { useRouter } from 'next/navigation';
import { LoggerSessionManager } from '@/lib/loggerAuth';
import { LoggerUser } from '@/lib/loggerAuth'; // Import LoggerUser type

interface SessionManagerProps {
  children: React.ReactNode;
}

const SessionManager: React.FC<SessionManagerProps> = ({ children }) => {
  const { user } = useLoggerAuth();
  const { logout } = useAuth(); // Get logout from useAuth instead
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Check session status periodically
  const checkSessionStatus = useCallback(() => {
    if (!user) return;

    // Type assertion to LoggerUser since we know logger users have the correct structure
    const loggerUser = user as LoggerUser;

    // Check if session is about to expire
    const isExpiring = LoggerSessionManager.isSessionExpiring(loggerUser, 5);
    const remainingTime = LoggerSessionManager.getRemainingSessionTime(loggerUser);

    if (isExpiring) {
      setShowWarning(true);
      setTimeLeft(remainingTime);
    } else {
      setShowWarning(false);
    }

    // Check if session has expired
    if (LoggerSessionManager.isSessionExpired(loggerUser)) {
      logout();
      router.push('/logger/login?expired=true');
    }
  }, [user, logout, router]);

  // Set up interval to check session status
  useEffect(() => {
    if (!user) return;

    // Check immediately
    checkSessionStatus();

    // Check every minute
    const interval = setInterval(checkSessionStatus, 60000);

    return () => clearInterval(interval);
  }, [user, checkSessionStatus]);

  // Handle session extension
  const extendSession = () => {
    // In a real implementation, you would call an API to extend the session
    // For now, we'll just hide the warning
    setShowWarning(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/logger/login');
  };

  return (
    <>
      {children}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Session Expiring
              </h3>
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your session will expire in {timeLeft} minute{timeLeft !== 1 ? 's' : ''}. 
              Would you like to extend your session?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={extendSession}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Extend Session
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionManager;