"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function LoggerPWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallTip, setShowInstallTip] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstallTip, setShowIOSInstallTip] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [pushNotificationSupported, setPushNotificationSupported] = useState(false);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Register service worker with enhanced error handling
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('[Logger PWA] Service Worker not supported');
      return;
    }

    try {
      // Only register logger PWA service worker for logger paths
      const isLoggerPath = window.location.pathname.startsWith('/logger');
      
      // Only register if we're in logger section
      if (!isLoggerPath) {
        console.log('[Logger PWA] Not in logger path, skipping logger PWA registration');
        return;
      }
      
      const registration = await navigator.serviceWorker.register('/logger-sw.js', {
        updateViaCache: 'none',
        scope: '/logger'
      });
      
      console.log('[Logger PWA] ServiceWorker registered successfully:', registration.scope);
      
      // Enhanced update detection
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('[Logger PWA] New service worker found, installing...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[Logger PWA] New content available, will show update prompt');
                setUpdateAvailable(true);
              } else {
                console.log('[Logger PWA] Content cached for offline use');
              }
            }
          });
        }
      });

      // Check for updates immediately
      if (registration.waiting && navigator.serviceWorker.controller) {
        console.log('[Logger PWA] Update available immediately');
        setUpdateAvailable(true);
      }

      // Periodic update checks (every hour instead of 30 minutes)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('[Logger PWA] ServiceWorker registration failed:', error);
    }
  }, []);

  // Check platform and PWA status
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check if running as PWA
    const isInStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');
      
    setIsStandalone(isInStandaloneMode);
    
    // Check if iOS device
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    // Check push notification support
    const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setPushNotificationSupported(pushSupported);
    
    console.log('[Logger PWA] Platform detection:', { 
      isStandalone: isInStandaloneMode, 
      isIOS: iOS, 
      pushSupported 
    });
    
    // Register service worker
    registerServiceWorker();
  }, [registerServiceWorker]);

  // Handle installation prompts
  useEffect(() => {
    if (typeof window === "undefined" || isStandalone) return;
    
    // Only show install prompt for logger section
    const isLoggerPath = window.location.pathname.startsWith('/logger');
    
    if (!isLoggerPath) {
      console.log('[Logger PWA] Not in logger path, skipping logger PWA install prompt');
      return;
    }
    
    if (isIOS) {
      // iOS: Show manual install instructions
      const hasShownIOSTip = localStorage.getItem('logger-pwa-ios-install-tip-shown');
      const hasShownIOSEducation = localStorage.getItem('logger-pwa-ios-education-shown');
      
      if (!hasShownIOSTip && !hasShownIOSEducation) {
        // Show educational prompt first
        setTimeout(() => {
          setShowIOSInstallTip(true);
        }, 3000);
      }
      return;
    }
    
    // Android/Desktop: Handle beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Only handle this event if we're in the logger paths
      const isLoggerPath = window.location.pathname.startsWith('/logger');
      
      if (!isLoggerPath) {
        console.log('[Logger PWA] Not in logger path, not handling install prompt in logger PWA');
        return;
      }
      
      e.preventDefault();
      console.log('[Logger PWA] Install prompt intercepted');
      
      installPromptRef.current = e;
      setInstallPrompt(e);
      
      const hasBeenInstalled = localStorage.getItem('logger-pwa-installed');
      if (hasBeenInstalled) {
        console.log('[Logger PWA] App already installed, hiding prompt.');
        return;
      }

      const hasShownTip = localStorage.getItem('logger-pwa-install-tip-shown');
      const installDismissedAt = localStorage.getItem('logger-pwa-install-dismissed-at');
      const lastPromptShownAt = localStorage.getItem('logger-pwa-last-prompt-shown-at');
      
    
      const now = Date.now();
      const shownRecently = lastPromptShownAt && (now - parseInt(lastPromptShownAt) < 24 * 60 * 60 * 1000);
      const dismissedRecently = installDismissedAt && (now - parseInt(installDismissedAt) < 7 * 24 * 60 * 60 * 1000);
      
      if (!hasShownTip && !dismissedRecently && !shownRecently) {
        setTimeout(() => {
          setShowInstallTip(true);
          // Record when we show the prompt
          localStorage.setItem('logger-pwa-last-prompt-shown-at', now.toString());
        }, 2000);
      }
    };

    const handleAppInstalled = () => {
      // Only handle this event if we're in the logger paths
      const isLoggerPath = window.location.pathname.startsWith('/logger');
      
      if (!isLoggerPath) {
        console.log('[Logger PWA] Not in logger path, not handling app installed in logger PWA');
        return;
      }
      
      console.log('[Logger PWA] App successfully installed');
      setShowInstallTip(false);
      setInstallPrompt(null);
      installPromptRef.current = null;
      localStorage.setItem('logger-pwa-install-tip-shown', 'true');
      localStorage.setItem('logger-pwa-installed', 'true'); // Remember that the app has been installed
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  // Handle install button click
  const handleInstallClick = async () => {
    if (!installPromptRef.current) return;
    
    try {
      const result = await installPromptRef.current.prompt();
      console.log('[Logger PWA] Install prompt result:', result.outcome);
      
      if (result.outcome === 'accepted') {
        localStorage.setItem('logger-pwa-installed', 'true');
        setShowInstallTip(false);
        setInstallPrompt(null);
        installPromptRef.current = null;
      } else {
        // User dismissed the prompt, remember this
        localStorage.setItem('logger-pwa-install-dismissed-at', Date.now().toString());
        setShowInstallTip(false);
      }
    } catch (error) {
      console.error('[Logger PWA] Failed to show install prompt:', error);
      setShowInstallTip(false);
    }
  };

  // Handle iOS install instructions close
  const handleIOSClose = () => {
    setShowIOSInstallTip(false);
    localStorage.setItem('logger-pwa-ios-install-tip-shown', 'true');
  };

  // Handle iOS education close
  const handleIOSEducationClose = () => {
    setShowIOSInstallTip(false);
    localStorage.setItem('logger-pwa-ios-education-shown', 'true');
    // Show the actual install tip after education
    setTimeout(() => {
      setShowIOSInstallTip(true);
      localStorage.setItem('logger-pwa-ios-install-tip-shown', 'true');
    }, 500);
  };

  // Handle update
  const handleUpdate = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  // Handle push notification prompt
  const handlePushPrompt = () => {
    setShowPushPrompt(true);
  };

  // Handle push notification enable
  const handleEnablePush = async () => {
    // Implementation would go here
    setShowPushPrompt(false);
  };

  // Handle push notification dismiss
  const handleDismissPush = () => {
    setShowPushPrompt(false);
  };

  return (
    <>
      {/* Install prompt for Android/Desktop */}
      {showInstallTip && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Install Logger App</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                Add the Logger app to your home screen for quick access and offline functionality.
              </p>
              <div className="mt-4 flex space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleInstallClick}
                >
                  Install
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowInstallTip(false)}
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS install instructions */}
      {showIOSInstallTip && isIOS && (
        <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Install on iOS</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                Tap the Share button <span className="inline-block w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded text-xs text-center align-middle">␣</span> and then "Add to Home Screen".
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleIOSClose}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update available notification */}
      {updateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Update Available</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                A new version of the Logger app is available.
              </p>
              <div className="mt-4 flex space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={handleUpdate}
                >
                  Update
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  onClick={() => setUpdateAvailable(false)}
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Push notification prompt */}
      {showPushPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Enable Notifications</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                Get notified about match updates and important events.
              </p>
              <div className="mt-4 flex space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  onClick={handleEnablePush}
                >
                  Enable
                </button>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  onClick={handleDismissPush}
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}