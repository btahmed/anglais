const CACHE_NAME = 'studentflow-v4.0.0';

// ==================== OFFLINE-FIRST SERVICE WORKER ====================
// Strategy: ALWAYS serve from cache, update cache in background when online

// Assets to pre-cache at install (ALL required for offline)
const PRECACHE_ASSETS = [
  './',
  './studentflow_ultimate_pro.html',
  './offline.html',
  './tailwind.min.js',
  './chart.min.js',
  './lucide.min.js',
  './jspdf.min.js',
  './confetti.min.js',
  './js/config.js',
  './js/storage.js',
  './js/audio.js'
];

// Install: Pre-cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing offline-first service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => {
        console.log('[SW] ✅ Offline-first cache ready');
        return self.skipWaiting();
      })
  );
});

// Activate: Clean old caches, take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => console.log('[SW] ✅ Now controlling all pages'))
  );
});

// Fetch: CACHE-FIRST, always. Network only updates cache in background.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET and non-http(s)
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        
        // ALWAYS try to update cache in background (if online)
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              cache.put(request, networkResponse.clone());
              console.log('[SW] 🔄 Updated cache:', request.url.slice(-50));
            }
            return networkResponse;
          })
          .catch(() => null); // Silently fail if offline
        
        // CACHE HIT: Return immediately, update in background
        if (cachedResponse) {
          console.log('[SW] ⚡ From cache:', request.url.slice(-50));
          event.waitUntil(fetchPromise);
          return cachedResponse;
        }
        
        // CACHE MISS: Wait for network, cache the result
        return fetchPromise.then((networkResponse) => {
          if (networkResponse) {
            return networkResponse;
          }
          // Network failed AND not in cache = show offline page for navigation
          if (request.mode === 'navigate') {
            return cache.match('./offline.html');
          }
          return new Response('Offline', { status: 503 });
        });
      });
    })
  );
});

// Handle skip waiting message
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
