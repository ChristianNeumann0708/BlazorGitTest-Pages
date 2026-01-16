    // const CACHE_NAME = "writeright-cache-v1";

    // const ASSETS_TO_CACHE = [
    //   "./",
    //   "./index.html",
    //   "./manifest.webmanifest",
    //   "./icons/icon-192.png",
    //   "./icons/icon-512.png",
    //   "./css/styles.css",
    //   "./js/app.js",
    //   "./js/wort.js",
    //   "./js/storage.js",
    //   "./js/menu.js"
    // ];

    // // Install: Dateien cachen
    // self.addEventListener("install", event => {
    //   console.log("[SW] Install gestartet");
    //   event.waitUntil(
    //     caches.open(CACHE_NAME).then(cache => {
    //       return Promise.all(
    //         ASSETS_TO_CACHE.map(url =>
    //           cache.add(url).catch(err => {
    //             console.warn(`[SW] Fehler beim Cachen: ${url}`, err);
    //           })
    //         )
    //       );
    //     })
    //   );
    // });

    // // Activate: alte Caches löschen
    // self.addEventListener("activate", event => {
    //   console.log("[SW] Activate gestartet");
    //   event.waitUntil(
    //     caches.keys().then(keys => {
    //       return Promise.all(
    //         keys
    //           .filter(key => key !== CACHE_NAME)
    //           .map(key => {
    //             console.log(`[SW] Lösche alten Cache: ${key}`);
    //             return caches.delete(key);
    //           })
    //       );
    //     })
    //   );
    // });

    // // Fetch: aus Cache bedienen, wenn offline
    // self.addEventListener("fetch", event => {
    //   event.respondWith(
    //     caches.match(event.request).then(cached => {
    //       if (cached) {
    //         console.log(`[SW] Aus Cache geladen: ${event.request.url}`);
    //         return cached;
    //       }
    //       return fetch(event.request).catch(err => {
    //         console.warn(`[SW] Netzwerkfehler: ${event.request.url}`, err);
    //         return new Response(
    //           `
    //             <html lang="de">
    //               <head><meta charset="UTF-8"><title>Offline</title></head>
    //               <body style="font-family:sans-serif;text-align:center;padding:2rem;">
    //                 <h1>Offline</h1>
    //                 <p>Die App ist gerade nicht erreichbar.</p>
    //                 <p>Bitte stelle eine Internetverbindung her und lade die Seite neu.</p>
    //               </body>
    //             </html>
    //           `,
    //           { headers: { "Content-Type": "text/html" } }
    //         );
    //       });
    //     })
    //   );
    // });
// alt Ende service-worker.js

const CURRENT_CACHE_NAME = 'app-v2'; // erhöhe Version bei Änderungen
const PRECACHE_URLS = [
  '/', 
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.webmanifest',
  // weitere wichtige Assets
];

self.addEventListener('install', event => {
  self.skipWaiting(); // sofort aktivieren
  event.waitUntil(
    caches.open(CURRENT_CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // alte Caches löschen
    const keys = await caches.keys();
    await Promise.all(keys.map(k => {
      if (k !== CURRENT_CACHE_NAME) return caches.delete(k);
    }));
    await self.clients.claim(); // neue SW sofort übernehmen
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Für CSS: network-first (immer versuchen, frische CSS zu holen)
  if (url.pathname.endsWith('.css')) {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(event.request);
        const cache = await caches.open(CURRENT_CACHE_NAME);
        cache.put(event.request, networkResponse.clone());
        return networkResponse;
      } catch (err) {
        const cached = await caches.match(event.request);
        return cached || new Response('', { status: 504 });
      }
    })());
    return;
  }

  // Für andere Ressourcen: Cache-first mit Update im Hintergrund
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // optional: update cache
        caches.open(CURRENT_CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => null);
      return cached || fetchPromise;
    })
  );
});
