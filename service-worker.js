const CACHE_NAME = 'sahaya-cache-v2';
const urlsToCache = [
  'index.html',
  'manifest.json',
  'logo.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // use addAll but catch errors to prevent SW failure
        return cache.addAll(urlsToCache).catch(err => console.log('Cache addAll failed', err));
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Pass through fetch for now to avoid intercepting and causing ERR_FAILED
  // Browsers will still see it as a valid PWA because of the manifest and registration.
  return;
});
