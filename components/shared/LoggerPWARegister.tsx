'use client';

import { useEffect } from 'react';

const LoggerPWARegister = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/logger-sw.js').then(
          function (registration) {
            console.log('Logger Service Worker registered with scope: ', registration.scope);
            
            // Add update found listener
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New update available
                    console.log('New content is available; please refresh.');
                    // Show update notification to user
                    showUpdateNotification();
                  }
                });
              }
            });
          },
          function (err) {
            console.log('Logger Service Worker registration failed: ', err);
          }
        );
      });
      
      // Check for service worker updates periodically
      setInterval(() => {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ command: 'update' });
        }
      }, 1000 * 60 * 30); // Check every 30 minutes
    }
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        showUpdateNotification();
      }
    });
    
    // Function to show update notification
    function showUpdateNotification() {
      // Create a simple notification element
      const notification = document.createElement('div');
      notification.innerHTML = `
        <div style="position: fixed; bottom: 20px; right: 20px; background: #4f46e5; color: white; padding: 16px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); z-index: 1000; max-width: 300px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong>New Update Available</strong>
            <button id="close-notification" style="background: none; border: none; color: white; cursor: pointer;">×</button>
          </div>
          <p style="margin: 0 0 12px 0; font-size: 14px;">A new version of the app is available.</p>
          <button id="refresh-button" style="background: white; color: #4f46e5; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: 500;">Refresh</button>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Add event listeners
      const closeBtn = notification.querySelector('#close-notification');
      const refreshBtn = notification.querySelector('#refresh-button');
      
      closeBtn?.addEventListener('click', () => {
        document.body.removeChild(notification);
      });
      
      refreshBtn?.addEventListener('click', () => {
        window.location.reload();
      });
    }
  }, []);

  return null;
};

export default LoggerPWARegister;