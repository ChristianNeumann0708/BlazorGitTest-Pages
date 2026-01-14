const CACHE_NAME = "writeright-cache-v1";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./css/styles.css",
  "./js/app.js",
  "./js/wort.js",
  "./js/storage.js"
];

// Install: Dateien cachen
self.addEventListener("install", event => {
  console.log("[SW] Install gestartet");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err => {
            console.warn(`[SW] Fehler beim Cachen: ${url}`, err);
          })
        )
      );
    })
  );
});

// Activate: alte Caches löschen
self.addEventListener("activate", event => {
  console.log("[SW] Activate gestartet");
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log(`[SW] Lösche alten Cache: ${key}`);
            return caches.delete(key);
          })
      );
    })
  );
});

// Fetch: aus Cache bedienen, wenn offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        console.log(`[SW] Aus Cache geladen: ${event.request.url}`);
        return cached;
      }
      return fetch(event.request).catch(err => {
        console.warn(`[SW] Netzwerkfehler: ${event.request.url}`, err);
        return new Response(
          `
            <html lang="de">
              <head><meta charset="UTF-8"><title>Offline</title></head>
              <body style="font-family:sans-serif;text-align:center;padding:2rem;">
                <h1>Offline</h1>
                <p>Die App ist gerade nicht erreichbar.</p>
                <p>Bitte stelle eine Internetverbindung her und lade die Seite neu.</p>
              </body>
            </html>
          `,
          { headers: { "Content-Type": "text/html" } }
        );
      });
    })
  );
});
