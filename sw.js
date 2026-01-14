const CACHE_NAME = 'unikama-project-v1';
const ASSETS_TO_CACHE = [
  './',              // Gunakan ./ untuk merujuk folder saat ini
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  '/alarm.mp3' 
];

// Tahap Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Memulai caching aset...');
            return Promise.all(
                ASSETS_TO_CACHE.map((url) => {
                    return cache.add(url).catch((err) => {
                        console.error(`SW: Gagal melakukan cache pada file: ${url}`, err);
                    });
                })
            );
        })
    );
    self.skipWaiting();
});
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('SW: Menghapus cache lama...');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});
