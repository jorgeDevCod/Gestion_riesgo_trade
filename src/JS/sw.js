const CACHE_NAME = 'Gestor-tradeApp-v2'; // Cambia versión para forzar actualización
const urlsToCache = [
    '/',
    '/index.html',
    '/src/CSS/patrones.css',
    '/src/CSS/aditional.css',
    '/src/image/logoGtd-192.png',
    '/src/image/logoGtd-512r.png',
    '/src/JS/firebase-app.js',
    '/src/JS/confluence.js',
    '/src/JS/patrones.js',
    '/src/JS/tendencia.js',
    '/src/JS/swipe-navigation.js',
    '/src/JS/charts.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js'
];

self.addEventListener( 'install', ( event ) => {
    event.waitUntil(
        caches.open( CACHE_NAME )
            .then( ( cache ) => {
                // Cachear individualmente para manejar errores
                return Promise.allSettled(
                    urlsToCache.map( url =>
                        cache.add( url ).catch( err => {
                            console.warn( `Failed to cache: ${url}`, err );
                        } )
                    )
                );
            } )
    );
    self.skipWaiting();
} );

self.addEventListener( 'activate', ( event ) => {
    event.waitUntil(
        caches.keys().then( ( cacheNames ) => {
            return Promise.all(
                cacheNames.map( ( cacheName ) => {
                    if ( cacheName !== CACHE_NAME ) {
                        return caches.delete( cacheName );
                    }
                } )
            );
        } )
    );
    self.clients.claim();
} );

self.addEventListener( 'fetch', ( event ) => {
    const url = new URL( event.request.url );

    // NO CACHEAR Tailwind CSS ni recursos externos problemáticos
    const skipCache = [
        'cdn.tailwindcss.com',
        'analytics',
        'tracking'
    ];

    if ( skipCache.some( domain => url.hostname.includes( domain ) ) ) {
        // Fetch directo sin cachear
        event.respondWith( fetch( event.request ) );
        return;
    }

    event.respondWith(
        caches.match( event.request )
            .then( ( response ) => {
                if ( response ) {
                    return response;
                }

                return fetch( event.request ).then( ( networkResponse ) => {
                    // Solo cachear respuestas válidas
                    if ( !networkResponse ||
                        networkResponse.status !== 200 ||
                        networkResponse.type === 'error' ||
                        networkResponse.type === 'opaque' ) {
                        return networkResponse;
                    }

                    // Solo cachear mismo origen o recursos seguros
                    if ( url.origin === location.origin ||
                        url.hostname.includes( 'gstatic.com' ) ) {
                        const responseToCache = networkResponse.clone();
                        caches.open( CACHE_NAME )
                            .then( ( cache ) => {
                                cache.put( event.request, responseToCache );
                            } );
                    }

                    return networkResponse;
                } ).catch( () => {
                    // Fallback offline
                    if ( event.request.mode === 'navigate' ) {
                        return caches.match( '/index.html' );
                    }
                } );
            } )
    );
} );
