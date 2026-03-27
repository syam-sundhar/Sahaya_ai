const CACHE_NAME = 'sahaya-pwa-v3';
const OFFLINE_URL = 'index.html';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './index.js',
  './dashboard.js',
  './dashboard.html',
  './translate.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => console.warn('PWA: Some assets failed to cache', err));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // For HTML navigation, try network then fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL);
      })
    );
    return;
  }

  // For other assets, try cache then network
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Fallback for images if needed
        if (event.request.destination === 'image') {
          return caches.match('./logo.png');
        }
      });
    })
  );
});
