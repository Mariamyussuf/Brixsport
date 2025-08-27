// ----- Cache versions -----
const STATIC_CACHE = 'brixsports-static-v2';
const API_CACHE = 'brixsports-api-v1';
const IMAGE_CACHE = 'brixsports-img-v1';
const OFFLINE_URL = '/offline.html';
const MAX_IMAGE_ENTRIES = 60;

// ----- Install: pre-cache app shell -----
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    await cache.addAll([
      '/',
      '/onboarding',
      '/auth',
      OFFLINE_URL,
      '/onboarding-bg-1.jpg',
      '/manifest.json',
      '/icon-192x192.png',
      '/icon-256x256.png',
      '/icon-384x384.png',
      '/icon-512x512.png'
    ]);
    self.skipWaiting();
  })());
});

// ----- Activate: clean old caches -----
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.map((key) => {
        if (![STATIC_CACHE, API_CACHE, IMAGE_CACHE].includes(key)) {
          return caches.delete(key);
        }
      })
    );
    await self.clients.claim();
  })());
});

// Utility: trim cache entries (simple FIFO)
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const toDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(toDelete.map((req) => cache.delete(req)));
  }
}

// ----- Message handling for updates -----
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ----- Fetch strategies -----
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin requests
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Frontend-only mock: intercept bulk events endpoint to always succeed
  if (url.pathname === '/api/events/bulk' && request.method === 'POST') {
    event.respondWith((async () => {
      try {
        const body = await request.clone().text();
        console.log('[ServiceWorker] Mock bulk received:', body.slice(0, 200));
      } catch (_) {
        // ignore body parse errors
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    })());
    return;
  }

  // HTML navigations: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResp = await fetch(request);
        const cache = await caches.open(STATIC_CACHE);
        cache.put(request, networkResp.clone());
        return networkResp;
      } catch (_) {
        const cacheMatch = await caches.match(request);
        return cacheMatch || caches.match(OFFLINE_URL);
      }
    })());
    return;
  }

  // API requests: stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith((async () => {
      const cache = await caches.open(API_CACHE);
      const cached = await cache.match(request);
      const networkPromise = fetch(request)
        .then((resp) => {
          cache.put(request, resp.clone());
          return resp;
        })
        .catch(() => undefined);
      return cached || (await networkPromise) || new Response(null, { status: 504 });
    })());
    return;
  }

  // Images: cache-first with basic expiration
  if (request.destination === 'image') {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const resp = await fetch(request);
        cache.put(request, resp.clone());
        trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
        return resp;
      } catch (_) {
        return new Response(null, { status: 504 });
      }
    })());
    return;
  }

  // Default: try cache, then network
  event.respondWith((async () => {
    const cached = await caches.match(request);
    return cached || fetch(request);
  })());
});

// ----- Background Sync for offline events -----
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-events') {
    event.waitUntil(syncOfflineEvents());
  }
});

// IndexedDB helpers in SW
const DB_NAME = 'brixsports-db';
const DB_VERSION = 1;
const STORE_EVENTS = 'events';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_EVENTS)) {
        db.createObjectStore(STORE_EVENTS, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllEvents() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EVENTS, 'readonly');
    const store = tx.objectStore(STORE_EVENTS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function clearEvents() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EVENTS, 'readwrite');
    const store = tx.objectStore(STORE_EVENTS);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function sendEventsToServer(events) {
  // Adjust endpoint to your API. This is a placeholder.
  const endpoint = '/api/events/bulk';
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  });
  if (!resp.ok) throw new Error('Failed to sync events');
}

async function syncOfflineEvents() {
  try {
    const events = await getAllEvents();
    if (!events || events.length === 0) return;
    await sendEventsToServer(events);
    await clearEvents();
    console.log('[ServiceWorker] Synced', events.length, 'offline events');
  } catch (err) {
    console.error('[ServiceWorker] Sync failed, will retry later', err);
    throw err;
  }
}