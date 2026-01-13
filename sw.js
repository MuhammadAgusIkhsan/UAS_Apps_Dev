self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Ketika notifikasi diklik oleh user
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Tutup balon notifikasi

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Jika aplikasi sudah terbuka, fokuskan saja
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Jika aplikasi tertutup, buka jendela baru
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
