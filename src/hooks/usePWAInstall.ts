import { useState, useEffect } from 'react';

export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  // Check if the app is running on iOS
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if the app is already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone === true;
    setIsInstalled(isInStandaloneMode);
  }, []);

  // Handle the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as unknown as BeforeInstallPromptEvent);
      
      // Only show the install prompt if the app isn't installed and not on iOS
      if (!isIOS && !isInstalled) {
        setShowInstallPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isIOS, isInstalled]);

  // Function to trigger the install prompt
  const installPWA = async () => {
    if (!deferredPrompt) return;
    
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  // Function to dismiss the install prompt
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  return {
    isIOS,
    isInstalled,
    showInstallPrompt,
    installPWA,
    dismissInstallPrompt,
  };
}
