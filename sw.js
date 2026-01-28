const CACHE_NAME = 'aromatic-pos-v2';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './css/animations.css',
    './css/components.css',
    './css/keyboard.css',
    './js/app.js',
    './js/db.js',
    './js/firebase-config.js',
    './js/keyboard.js',
    './js/sounds.js',
    './js/utils.js',
    './js/views/pos.js',
    './js/views/inventory.js',
    './js/views/customers.js',
    './js/views/supplies.js',
    './js/views/sales.js',
    './js/views/cashClosing.js',
    './js/views/settings.js',
    './js/views/ticket.js',
    './js/views/tables.js',
    './recursos/logo efimero.png',
    'https://unpkg.com/lucide@latest',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap'
];

// Install Event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching shell assets');
                return cache.addAll(ASSETS);
            })
    );
});

// Activate Event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            );
        })
    );
});

// Fetch Event
self.addEventListener('fetch', event => {
    // Skip cross-origin requests (except fonts and lucide)
    if (!event.request.url.startsWith(self.location.origin) &&
        !event.request.url.includes('google') &&
        !event.request.url.includes('unpkg')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cacheRes => {
            return cacheRes || fetch(event.request).then(fetchRes => {
                return caches.open(CACHE_NAME).then(cache => {
                    // Don't cache firestore requests (already handled by firestore persistence)
                    if (!event.request.url.includes('firestore')) {
                        cache.put(event.request.url, fetchRes.clone());
                    }
                    return fetchRes;
                });
            });
        }).catch(() => {
            if (event.request.url.indexOf('.html') > -1) {
                return caches.match('./index.html');
            }
        })
    );
});
