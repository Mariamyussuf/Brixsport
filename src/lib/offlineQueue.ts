// Lightweight offline queue helper for match events
// Uses the same IndexedDB store names as the Service Worker

const DB_NAME = 'brixsports-db';
const DB_VERSION = 1;
const STORE_EVENTS = 'events';

function openDB(): Promise<IDBDatabase> {
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

export async function queueEvent(event: Record<string, any>) {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_EVENTS, 'readwrite');
    const store = tx.objectStore(STORE_EVENTS);
    store.add({ ...event, ts: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).sync?.register('sync-offline-events');
    } catch (e) {
      // As a fallback, attempt immediate flush if we're online
      if (navigator.onLine) {
        try { await flushNow(); } catch { /* ignore */ }
      }
    }
  } else if (navigator.onLine) {
    try { await flushNow(); } catch { /* ignore */ }
  }
}

// Optional: attempt a direct flush via the same bulk endpoint used by the SW
export async function flushNow() {
  const db = await openDB();
  const events: any[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EVENTS, 'readonly');
    const store = tx.objectStore(STORE_EVENTS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  if (!events.length) return;
  const resp = await fetch('/api/events/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  });
  if (!resp.ok) throw new Error('Bulk upload failed');

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_EVENTS, 'readwrite');
    const store = tx.objectStore(STORE_EVENTS);
    const clearReq = store.clear();
    clearReq.onsuccess = () => resolve();
    clearReq.onerror = () => reject(clearReq.error);
  });
}
