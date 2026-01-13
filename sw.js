// Service Worker: Menangani notifikasi di latar belakang
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Logika ketika notifikasi diklik
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Tutup notifikasi

    // Coba buka kembali jendela aplikasi yang sudah ada atau buka baru
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                // Jika aplikasi sudah terbuka (minimize), fokuskan ke jendela tersebut
                return clientList[0].focus();
            }
            // Jika aplikasi benar-benar tertutup, buka jendela baru
            return clients.openWindow('/');
        })
    );
});
