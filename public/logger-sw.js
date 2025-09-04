// Logger Service Worker
// Specialized service worker for the logger PWA

const CACHE_NAME = 'logger-v1.0.0';
const urlsToCache = [
  '/logger',
  '/logger/login',
  '/logger/admin',
  '/logger-manifest.json',
  '/logger-apple-touch-icon.png',
  '/logger-apple-touch-icon-152x152.png',
  '/logger-apple-touch-icon-180x180.png',
  '/logger-apple-touch-icon-167x167.png'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[Logger SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Logger SW] Caching app shell');
        return cache.addAll(urlsToCache);
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
          if (cacheName !== CACHE_NAME) {
            console.log('[Logger SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle requests for the logger paths
  if (event.request.url.includes('/logger')) {
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
  if (event.data && event.data.command === 'update') {
    console.log('[Logger SW] Checking for updates');
    // Force update check
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