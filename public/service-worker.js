self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-events') {
    event.waitUntil(syncOfflineEvents());
  }
});

async function syncOfflineEvents() {
  // TODO: Implement actual sync logic (fetch from IndexedDB/localStorage, send to server)
  // For now, just log for debugging
  console.log('[ServiceWorker] Syncing offline events...');
  // Example: await sendEventsToServer(events);
} 