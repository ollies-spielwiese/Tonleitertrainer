// v1.0.1 — trigger rebuild 2026-07-03T07:22:11Z
   Tonleitertrainer — Service Worker v10
   Strategie:
   - index.html + sw.js: NETWORK-FIRST (immer aktuell)
   - Alle anderen Assets: Cache-First (schnell + offline)
═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'tonleitertrainer-v22';

// Assets die Cache-First behandelt werden (stabile Dateien)
const CACHE_ASSETS = [
  './manifest.json',
  './libs/pdf-lib.min.js',
  './fonts/satoshi-400.woff2',
  './fonts/satoshi-500.woff2',
  './fonts/satoshi-700.woff2',
  './fonts/cabinet-400.woff2',
  './fonts/cabinet-700.woff2',
  './fonts/cabinet-800.woff2',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: alten Cache löschen ────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const path = url.pathname;

  // index.html und sw.js: IMMER vom Netzwerk (Network-First)
  const isHTML = event.request.destination === 'document' ||
                 path.endsWith('index.html') || path.endsWith('/') ||
                 path.endsWith('sw.js');

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Frische HTML-Antwort auch im Cache speichern
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)) // Offline-Fallback
    );
    return;
  }

  // Alle anderen Assets: Cache-First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
