const CACHE_NAME = 'dogac-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/chat/index.html',
  '/room-chat/index.html',
  '/spa/index.html',
  '/styles.css',
  '/main.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install the service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch resources from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
