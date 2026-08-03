const CACHE_NAME = 'zihin-arenasi-v9-alpha3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/js/bootstrap.js',
  '/js/app.js',
  '/js/content-quality-v5.js',
  '/js/engines/learning-engine-v4.js',
  '/js/engines/paragraph-engine-v4.js',
  '/js/content-v4.js',
  '/js/runtime-config.js',
  '/js/content.js',
  '/js/content-v2.js',
  '/js/content-v3.js',
  '/js/state.js',
  '/js/storage.js',
  '/js/utils.js',
  '/js/engines/word-engine.js',
  '/js/engines/math-engine.js',
  '/js/engines/logic-engine.js',
  '/js/engines/social-engine.js',
  '/js/engines/adaptive-engine.js',
  '/js/games/registry.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && new URL(event.request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached || caches.match('/index.html'));

      return cached || network;
    })
  );
});
