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

export default function PWARegister() {
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
      console.log('[PWA] Service Worker not supported');
      return;
    }

    try {
      // Only register main PWA service worker for non-admin and non-logger paths
      const isAdminPath = window.location.pathname.startsWith('/admin');
      const isLoggerPath = window.location.pathname.startsWith('/logger');
      
      // Only register if we're not in admin or logger sections
      if (isAdminPath || isLoggerPath) {
        console.log('[PWA] In admin or logger path, skipping main PWA registration');
        return;
      }
      
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        updateViaCache: 'none',
        scope: '/'
      });
      
      console.log('[PWA] ServiceWorker registered successfully:', registration.scope);
      
      // Enhanced update detection
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          console.log('[PWA] New service worker found, installing...');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[PWA] New content available, will show update prompt');
                setUpdateAvailable(true);
              } else {
                console.log('[PWA] Content cached for offline use');
              }
            }
          });
        }
      });

      // Check for updates immediately
      if (registration.waiting && navigator.serviceWorker.controller) {
        console.log('[PWA] Update available immediately');
        setUpdateAvailable(true);
      }

      // Periodic update checks (every hour instead of 30 minutes)
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('[PWA] ServiceWorker registration failed:', error);
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
    
    console.log('[PWA] Platform detection:', { 
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
    
    // Only show install prompt for main app (not admin or logger sections)
    const isAdminPath = window.location.pathname.startsWith('/admin');
    const isLoggerPath = window.location.pathname.startsWith('/logger');
    
    if (isAdminPath || isLoggerPath) {
      console.log('[PWA] In admin or logger path, skipping main PWA install prompt');
      return;
    }
    
    if (isIOS) {
      // iOS: Show manual install instructions
      const hasShownIOSTip = localStorage.getItem('pwa-ios-install-tip-shown');
      const hasShownIOSEducation = localStorage.getItem('pwa-ios-education-shown');
      
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
      // Only handle this event if we're in the main app paths
      const isAdminPath = window.location.pathname.startsWith('/admin');
      const isLoggerPath = window.location.pathname.startsWith('/logger');
      
      if (isAdminPath || isLoggerPath) {
        console.log('[PWA] In admin or logger path, not handling install prompt in main PWA');
        return;
      }
      
      e.preventDefault();
      console.log('[PWA] Install prompt intercepted');
      
      installPromptRef.current = e;
      setInstallPrompt(e);
      
      const hasBeenInstalled = localStorage.getItem('pwa-installed');
      if (hasBeenInstalled) {
        console.log('[PWA] App already installed, hiding prompt.');
        return;
      }

      const hasShownTip = localStorage.getItem('pwa-install-tip-shown');
      const installDismissedAt = localStorage.getItem('pwa-install-dismissed-at');
      const lastPromptShownAt = localStorage.getItem('pwa-last-prompt-shown-at');
      
    
      const now = Date.now();
      const shownRecently = lastPromptShownAt && (now - parseInt(lastPromptShownAt) < 24 * 60 * 60 * 1000);
      const dismissedRecently = installDismissedAt && (now - parseInt(installDismissedAt) < 7 * 24 * 60 * 60 * 1000);
      
      if (!hasShownTip && !dismissedRecently && !shownRecently) {
        setTimeout(() => {
          setShowInstallTip(true);
          // Record when we show the prompt
          localStorage.setItem('pwa-last-prompt-shown-at', now.toString());
        }, 2000);
      }
    };

    const handleAppInstalled = () => {
      // Only handle this event if we're in the main app paths
      const isAdminPath = window.location.pathname.startsWith('/admin');
      const isLoggerPath = window.location.pathname.startsWith('/logger');
      
      if (isAdminPath || isLoggerPath) {
        console.log('[PWA] In admin or logger path, not handling app installed in main PWA');
        return;
      }
      
      console.log('[PWA] App successfully installed');
      setShowInstallTip(false);
      setInstallPrompt(null);
      installPromptRef.current = null;
      localStorage.setItem('pwa-install-tip-shown', 'true');
      localStorage.setItem('pwa-installed', 'true'); // Remember that the app has been installed
      
      // Show push notification prompt after installation (for supported platforms)
      if (pushNotificationSupported && !isIOS) {
        setTimeout(() => {
          setShowPushPrompt(true);
        }, 2000);
      }
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone, isIOS, pushNotificationSupported]);

  // Handle PWA installation
  const handleInstallClick = useCallback(async () => {
    if (!installPromptRef.current) return;
    
    try {
      console.log('[PWA] Showing install prompt');
      const result = await installPromptRef.current.prompt();
      
      const { outcome } = await installPromptRef.current.userChoice;
      console.log('[PWA] Install prompt result:', outcome);
      
      setInstallPrompt(null);
      installPromptRef.current = null;
      setShowInstallTip(false);
      
      // Mark as shown regardless of outcome to prevent repeated prompts
      localStorage.setItem('pwa-install-tip-shown', 'true');
      
      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
        // Show push notification prompt after installation
        if (pushNotificationSupported && !isIOS) {
          setTimeout(() => {
            setShowPushPrompt(true);
          }, 2000);
        }
      } else {
        // User dismissed the prompt
        localStorage.setItem('pwa-install-dismissed-at', Date.now().toString());
      }
      
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      // Even on error, mark as shown to prevent repeated prompts
      localStorage.setItem('pwa-install-tip-shown', 'true');
      setShowInstallTip(false);
      setInstallPrompt(null);
      installPromptRef.current = null;
    }
  }, [pushNotificationSupported, isIOS]);

  // Handle app updates with iOS fix
  const handleUpdate = useCallback(() => {
    if (!navigator.serviceWorker) return;
    
    console.log('[PWA] Updating app...');
    
    // Reset the update available state immediately
    setUpdateAvailable(false);
    
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (let reg of regs) {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
      
      // For iOS PWA, force a more thorough refresh
      if (isIOS && isStandalone) {
        // Clear all caches first
        if ('caches' in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              caches.delete(name);
            });
          });
        }
        // Then reload
        window.location.reload();
      } else {
        // Standard reload for other platforms
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    });
  }, [isIOS, isStandalone]);

  // Handle push notification permission
  const handleEnablePushNotifications = useCallback(async () => {
    if (!pushNotificationSupported) return;
    
    try {
      const permission = await Notification.requestPermission();
      console.log('[PWA] Push notification permission:', permission);
      
      if (permission === 'granted') {
        // Here you would typically subscribe to push notifications
        console.log('[PWA] Push notifications enabled');
      }
      
      setShowPushPrompt(false);
      localStorage.setItem('pwa-push-prompted', 'true');
      
    } catch (error) {
      console.error('[PWA] Push notification error:', error);
      setShowPushPrompt(false);
    }
  }, [pushNotificationSupported]);

  // Dismiss functions
  const dismissInstallTip = useCallback(() => {
    setShowInstallTip(false);
    setInstallPrompt(null); // Clear the prompt reference
    localStorage.setItem('pwa-install-dismissed-at', Date.now().toString());
    // Also mark as shown so it doesn't reappear immediately
    localStorage.setItem('pwa-install-tip-shown', 'true');
    // Record when it was dismissed
    localStorage.setItem('pwa-last-prompt-shown-at', Date.now().toString());
  }, []);
  
  const dismissIOSInstallTip = useCallback(() => {
    setShowIOSInstallTip(false);
    localStorage.setItem('pwa-ios-install-tip-shown', 'true');
    // Record when it was dismissed
    localStorage.setItem('pwa-last-prompt-shown-at', Date.now().toString());
  }, []);

  const dismissPushPrompt = useCallback(() => {
    setShowPushPrompt(false);
    localStorage.setItem('pwa-push-prompted', 'true');
  }, []);

  return (
    <>
      {/* App Update Notification - Highest Priority */}
      {updateAvailable && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white rounded-lg shadow-lg p-4 z-50 max-w-sm mx-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5 9.293 8.207a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L11 9.586z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Update Available!</p>
              <p className="text-xs opacity-90">New features and improvements</p>
            </div>
            <button 
              onClick={handleUpdate}
              className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-50 transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {/* Android/Desktop Install Prompt */}
      {showInstallTip && installPrompt && !updateAvailable && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 z-50 max-w-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Install BrixSports App
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                Get faster access, offline support, and push notifications
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={dismissInstallTip}
                  className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Instructions */}
      {showIOSInstallTip && isIOS && !updateAvailable && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 z-50 max-w-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.13997 6.91 8.85997 6.88C10.15 6.86 11.36 7.75 12.11 7.75C12.86 7.75 14.28 6.68 15.87 6.84C16.51 6.87 18.27 7.15 19.35 8.29C19.27 8.35 17.94 9.35 17.96 11.08C17.98 13.19 19.93 14.04 20 14.06C19.97 14.15 19.69 15.13 19.18 16.12C18.74 16.97 18.27 17.81 17.53 17.83C16.8 17.85 16.61 17.35 15.8 17.35C15 17.35 14.8 17.81 14.12 17.83C13.4 17.85 12.92 16.94 12.5 16.1C11.69 14.46 11.14 12.25 11.71 10.74C12.08 9.84 12.82 9.19 13.64 9.14C14.27 9.1 14.85 9.54 15.27 9.54C15.7 9.54 16.46 9.04 17.24 9.11C17.79 9.15 19.05 9.34 19.75 10.34C18.75 11.17 18.75 12.72 18.71 19.5Z"/>
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Install BrixSports
              </h3>
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 mb-3">
                <p>To install on your iPhone:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Tap the <span className="font-medium">Share</span> button below</li>
                  <li>Select <span className="font-medium">"Add to Home Screen"</span></li>
                  <li>Tap <span className="font-medium">"Add"</span> to confirm</li>
                </ol>
              </div>
              <button
                onClick={dismissIOSInstallTip}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push Notification Prompt (Android only, after install) */}
      {showPushPrompt && !isIOS && isStandalone && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 z-50 max-w-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V3h5v14z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Stay Updated
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
                Enable notifications to get live scores and match updates
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleEnablePushNotifications}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                >
                  Enable
                </button>
                <button
                  onClick={dismissPushPrompt}
                  className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}