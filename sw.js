const CACHE_NAME = 'unikama-project-v1';
const ASSETS_TO_CACHE = [
  './',              // Gunakan ./ untuk merujuk folder saat ini
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  // Jika link audio ini bermasalah, hapus sementara untuk tes
  './alarm.mp3' 
];

// Tahap Install
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Memulai caching aset...');
            // Menggunakan map agar jika satu gagal, yang lain tetap bisa diidentifikasi
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

// ... (sisanya sama dengan kode sebelumnya)
// 2. Tahap Activate: Hapus cache lama jika ada update
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

// 3. Tahap Fetch: Ambil data dari cache jika offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Jika ada di cache, pakai cache. Jika tidak, ambil dari internet.
            return response || fetch(event.request);
        })
    );
});

// 4. Logika ketika notifikasi diklik (Tetap Dipertahankan)
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
