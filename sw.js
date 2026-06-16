const CACHE_NAME = 'controle-ponto-v3';
const FILES_TO_CACHE = [
    '/index.html',
    '/app.html',
    '/css/style.css',
    '/js/utils.js',
    '/js/data.js',
    '/js/nav.js',
    '/js/auth.js',
    '/js/ponto.js',
    '/js/banco.js',
    '/js/perfil.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request, { redirect: 'follow' }).catch(() => {
                return new Response(JSON.stringify({ error: 'Offline' }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cached) => {
                const fetchAndCache = fetch(event.request, { redirect: 'follow' }).then((response) => {
                    if (response && response.status === 200) {
                        cache.put(event.request, response.clone());
                    }
                    return response;
                }).catch(() => cached);

                if (cached && cached.status >= 200 && cached.status < 300) {
                    return cached;
                }

                return fetchAndCache;
            });
        })
    );
});
