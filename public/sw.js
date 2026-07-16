const CACHE_NAME = 'book-admin-v1';
const OFFLINE_PAGE = '/offline.html';
const STATIC_ASSETS = [
  OFFLINE_PAGE,
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(console.error),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: always try the network and do not cache.
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static assets served by Next.js or public: stale-while-revalidate.
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'manifest' ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/public/')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(request).then((cached) => {
          const networkPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cached);

          return cached || networkPromise;
        }),
      ),
    );
    return;
  }

  // HTML pages / navigation: network first with offline fallback.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches
              .match(OFFLINE_PAGE)
              .then(
                (fallback) =>
                  fallback ||
                  new Response(
                    '<h1>Offline</h1><p>Please reconnect to use Book Store Admin.</p>',
                    {
                      headers: { 'Content-Type': 'text/html' },
                    },
                  ),
              );
          });
        }),
    );
    return;
  }
});
