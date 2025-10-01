const CACHE_NAME = 'control-trade-app-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/patrones.css',
    '/aditional.css',
    '/image/logoGtd-192.png',
    '/image/logoGtd-512.png',
    '/firebase-app.js',
    '/confluence.js',
    '/patrones.js',
    '/tendencia.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
    'https://cdn.tailwindcss.com'
];

// Instalación del SW: Cachear archivos
self.addEventListener( 'install', ( event ) => {
    event.waitUntil(
        caches.open( CACHE_NAME )
            .then( ( cache ) => {
                return cache.addAll( urlsToCache );
            } )
    );
    self.skipWaiting(); // Activar SW inmediatamente
} );

// Activación: Limpiar cachés antiguos
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
    self.clients.claim(); // Tomar control inmediato
} );

// Fetch: Servir desde caché primero, fallback a red
self.addEventListener( 'fetch', ( event ) => {
    event.respondWith(
        caches.match( event.request )
            .then( ( response ) => {
                // Si está en caché, servirlo
                if ( response ) {
                    return response;
                }
                // Si no, fetch de red y cachear dinámicamente
                return fetch( event.request ).then( ( networkResponse ) => {
                    // No cachear respuestas no válidas
                    if ( !networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' ) {
                        return networkResponse;
                    }
                    // Clonar y cachear
                    const responseToCache = networkResponse.clone();
                    caches.open( CACHE_NAME )
                        .then( ( cache ) => {
                            cache.put( event.request, responseToCache );
                        } );
                    return networkResponse;
                } );
            } ).catch( () => {
                // Offline fallback: Página básica si es HTML
                if ( event.request.mode === 'navigate' ) {
                    return caches.match( '/index.html' );
                }
            } )
    );
} );
