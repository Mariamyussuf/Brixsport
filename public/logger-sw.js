// Logger Service Worker
// Specialized service worker for the logger PWA (includes admin functionality)
// Works for both development (/logger path) and production (logger.brixsport.com)

const CACHE_NAME = 'logger-v1.0.0';
const urlsToCache = [
  '/',
  '/logger',
  '/logger/login',
  '/logger/dashboard',
  '/logger-manifest.json'
  // NOTE: Image assets removed to prevent caching errors
  // Add them back one by one after verifying they exist
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[Logger SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Logger SW] Caching app shell');
        // Use a more robust caching approach that handles failures
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn('[Logger SW] Some URLs failed to cache:', error);
          // Try to cache URLs individually to identify which ones fail
          const cachePromises = urlsToCache.map(url => {
            return fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              } else {
                throw new Error(`Failed to fetch ${url}: ${response.status}`);
              }
            }).catch(error => {
              console.warn(`[Logger SW] Failed to cache ${url}:`, error);
              // Don't fail the entire cache operation for individual failures
              return Promise.resolve();
            });
          });
          return Promise.all(cachePromises);
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Logger SW] Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Only delete caches that start with 'logger' but are not the current cache
          if (cacheName.startsWith('logger') && cacheName !== CACHE_NAME) {
            console.log('[Logger SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim clients to ensure the service worker takes control immediately
  return self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Handle requests for both development and production environments
  const url = new URL(event.request.url);
  
  // Check if request is for logger domain or logger path
  const isLoggerRequest = 
    url.pathname.startsWith('/logger') || 
    url.hostname === 'logger.brixsport.com';
  
  if (isLoggerRequest) {
    // Only cache GET requests
    if (event.request.method !== 'GET') {
      return;
    }
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached response if found
          if (response) {
            return response;
          }
          
          // Clone the request because it's a stream and can only be consumed once
          const fetchRequest = event.request.clone();
          
          return fetch(fetchRequest).then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it's a stream and can only be consumed once
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
        })
        .catch(() => {
          // If both fetch and cache fail, show offline page if available
          return caches.match('/logger');
        })
    );
  }
});

// Message event - handle communication from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Logger SW] Skipping waiting to activate new service worker');
    self.skipWaiting();
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Logger SW] Push received:', event);
  
  let title = 'Logger Update';
  let options = {
    body: 'New content available',
    icon: '/logger-apple-touch-icon.png',
    badge: '/logger-apple-touch-icon.png'
  };
  
  if (event.data) {
    const data = event.data.json();
    title = data.title || title;
    options.body = data.body || options.body;
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Logger SW] Notification click received');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/logger')
  );
});