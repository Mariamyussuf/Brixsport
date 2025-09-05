// Admin Service Worker
// Specialized service worker for the admin PWA

const CACHE_NAME = 'admin-v1.0.0';
const urlsToCache = [
  '/admin',
  '/admin/login',
  '/admin-manifest.json',
  '/icon-192x192.png',
  '/icon-256x256.png',
  '/icon-384x384.png',
  '/icon-512x512.png'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[Admin SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Admin SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Admin SW] Activate event');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Only delete caches that start with 'admin' but are not the current cache
          if (cacheName.startsWith('admin') && cacheName !== CACHE_NAME) {
            console.log('[Admin SW] Deleting old cache:', cacheName);
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
  // Only handle requests for the admin paths
  if (event.request.url.includes('/admin')) {
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
          return caches.match('/admin');
        })
    );
  }
});

// Message event - handle communication from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Admin SW] Skipping waiting to activate new service worker');
    self.skipWaiting();
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Admin SW] Push received:', event);
  
  let title = 'Admin Update';
  let options = {
    body: 'New content available',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
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
  console.log('[Admin SW] Notification click received');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/admin')
  );
});