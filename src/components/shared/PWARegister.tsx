"use client";

import { useEffect, useState } from "react";

export default function PWARegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallTip, setShowInstallTip] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navigator.serviceWorker) return;

    // Store the install prompt for later use
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      
      // Show install tip after 10 seconds of app usage
      // but only if not already installed and not dismissed before
      const hasShownTip = localStorage.getItem('pwa-install-tip-shown');
      if (!hasShownTip) {
        setTimeout(() => {
          setShowInstallTip(true);
        }, 10000);
      }
    });

    // Hide install tip if app is installed
    window.addEventListener('appinstalled', () => {
      setShowInstallTip(false);
      localStorage.setItem('pwa-install-tip-shown', 'true');
      console.log('PWA was installed');
    });

    const register = async () => {
      try {
        // Register the custom service worker placed in public/
        const swUrl = "/service-worker.js";
        const reg = await navigator.serviceWorker.register(swUrl);

        // Listen for updates and prompt reload
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New content is available, show update notification
              setUpdateAvailable(true);
              console.log("New content is available; please refresh.");
            }
          });
        });

        // Check for updates on page load
        if (reg.waiting && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
        }
      } catch (err) {
        console.error("[PWA] SW registration failed:", err);
      }
    };

    register();
  }, []);

  const handleUpdate = () => {
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
  };

  const handleInstall = () => {
    if (!installPrompt) return;
    
    // Show the install prompt
    installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult: {outcome: string}) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
      setShowInstallTip(false);
      localStorage.setItem('pwa-install-tip-shown', 'true');
    });
  };

  const dismissInstallTip = () => {
    setShowInstallTip(false);
    localStorage.setItem('pwa-install-tip-shown', 'true');
  };

  return (
    <>
      {updateAvailable && (
        <div className="fixed bottom-20 right-4 z-50 bg-blue-600 text-white rounded-lg shadow-lg p-4 flex flex-col items-start">
          <p className="mb-2">A new version is available!</p>
          <button 
            onClick={handleUpdate}
            className="bg-white text-blue-600 px-3 py-1 rounded-md font-medium"
          >
            Update now
          </button>
        </div>
      )}
      
      {showInstallTip && installPrompt && (
        <div className="fixed bottom-20 left-4 z-50 bg-blue-600 text-white rounded-lg shadow-lg p-4 flex flex-col items-start max-w-xs">
          <p className="mb-2">Install BrixSports for a better experience!</p>
          <div className="flex space-x-2">
            <button 
              onClick={handleInstall}
              className="bg-white text-blue-600 px-3 py-1 rounded-md font-medium"
            >
              Install
            </button>
            <button 
              onClick={dismissInstallTip}
              className="bg-blue-500 text-white px-3 py-1 rounded-md font-medium"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
