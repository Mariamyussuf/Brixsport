"use client";

import { useEffect, useState, useCallback } from "react";

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

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          updateViaCache: 'none',
          scope: '/'
        });
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
                console.log('New content is available; please refresh.');
              }
            });
          }
        });

        // Check for updates on page load
        if (registration.waiting && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
        }
      } catch (error) {
        console.error('ServiceWorker registration failed: ', error);
      }
    }
  }, []);

  // Check if running as PWA
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                               (window.navigator as any).standalone === true;
      setIsStandalone(isInStandaloneMode);
      
      // Register service worker
      registerServiceWorker();
    }
  }, [registerServiceWorker]);

  // Handle PWA installation prompt
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check if this is iOS device
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    // Show iOS install tip if not already shown or dismissed
    if (iOS && !isStandalone) {
      const hasShownIOSTip = localStorage.getItem('pwa-ios-install-tip-shown');
      if (!hasShownIOSTip) {
        setTimeout(() => {
          setShowIOSInstallTip(true);
        }, 5000);
      }
      return;
    }
    
    // For Android/other devices
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the default install prompt
      e.preventDefault();
      console.log('[PWA] beforeinstallprompt event fired');
      
      // Store the event for later use
      setInstallPrompt(e);
      
      // Show install tip if not already installed and not dismissed before
      const hasShownTip = localStorage.getItem('pwa-install-tip-shown');
      if (!hasShownTip) {
        setTimeout(() => {
          setShowInstallTip(true);
        }, 3000);
      }
    };

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle successful installation
    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setShowInstallTip(false);
      setInstallPrompt(null);
      localStorage.setItem('pwa-install-tip-shown', 'true');
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  // Handle install button click
  const handleInstallClick = useCallback(async () => {
    if (!installPrompt) return;
    
    try {
      console.log('[PWA] Triggering install prompt');
      // Show the install prompt
      const result = await installPrompt.prompt();
      console.log('[PWA] Install prompt result:', result);
      
      // Wait for the user to respond to the prompt
      const { outcome } = await installPrompt.userChoice;
      console.log('[PWA] User response to install prompt:', outcome);
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
      
      // Clear the saved prompt since it can't be used again
      setInstallPrompt(null);
      setShowInstallTip(false);
      localStorage.setItem('pwa-install-tip-shown', 'true');
      
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
    }
  }, [installPrompt]);

  // Handle update button click
  const handleUpdate = useCallback(() => {
    if (!navigator.serviceWorker) return;
    
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (let reg of regs) {
        if (reg.waiting) {
          // Send message to SW to skip waiting and activate new version
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
      // Reload the page to load the new version
      window.location.reload();
    });
  }, []);

  // Dismiss install tip
  const dismissInstallTip = useCallback(() => {
    setShowInstallTip(false);
    localStorage.setItem('pwa-install-tip-shown', 'true');
  }, []);
  
  // Dismiss iOS install tip
  const dismissIOSInstallTip = useCallback(() => {
    setShowIOSInstallTip(false);
    localStorage.setItem('pwa-ios-install-tip-shown', 'true');
  }, []);

  return (
    <>
      {/* Update notification */}
      {updateAvailable && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-lg shadow-lg p-4 z-50 max-w-xs">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium">A new version is available!</p>
            <button 
              onClick={handleUpdate}
              className="bg-white text-blue-600 px-3 py-1 rounded-md font-medium text-sm hover:bg-gray-100 transition-colors"
            >
              Update now
            </button>
          </div>
        </div>
      )}

      {/* Install prompt for Android/other devices */}
      {showInstallTip && installPrompt && !updateAvailable && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 max-w-xs">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <span className="text-sm">+</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Install BrixSports
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-300 mb-3">
                Add to your home screen for quick access
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleInstallClick}
                  className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={dismissInstallTip}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS install instructions */}
      {showIOSInstallTip && isIOS && !updateAvailable && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50 max-w-xs">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
                <span className="text-sm">i</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Install BrixSports
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-300 mb-3">
                Tap the Share button and select "Add to Home Screen"
              </p>
              <button
                onClick={dismissIOSInstallTip}
                className="px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}