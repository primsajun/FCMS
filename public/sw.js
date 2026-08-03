// Basic Service Worker
const CACHE_NAME = 'fcms-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass through everything, this just satisfies the PWA install requirement
  event.respondWith(fetch(event.request));
});
