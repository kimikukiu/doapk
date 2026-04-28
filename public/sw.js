self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('whoamisec-cache').then((cache) => {
      return cache.addAll(['/', '/index.html', '/index.tsx']);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
