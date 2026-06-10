/* ═══════════════════════════════════════════════════════════
   HTTI Studio — sw.js (Service Worker)
   Strategy: Cache-first for static assets, network-first for API
   ═══════════════════════════════════════════════════════════ */

const CACHE_NAME   = "htti-studio-v1";
const CACHE_STATIC = "htti-static-v1";

// Files to pre-cache on install (app shell)
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/manifest.json",
  "https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Syne:wght@400;600;700;800&display=swap"
];

// ── INSTALL: pre-cache the app shell ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      // Cache what we can; ignore failures for third-party resources
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => console.warn("Could not cache:", url))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: clean up old caches ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_STATIC && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first for static, network-first for API ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin API calls (Firebase, backend)
  if (
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("onrender.com") ||
    url.hostname.includes("railway.app") ||
    url.hostname.includes("hcti.io")
  ) {
    // Network-only for API calls
    return;
  }

  // Cache-first strategy for app shell
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      // Not in cache — fetch from network and cache response
      return fetch(request)
        .then((response) => {
          // Only cache successful responses from same origin or Google Fonts
          if (
            response.ok &&
            (url.origin === self.location.origin || url.hostname.includes("fonts.g"))
          ) {
            const cloned = response.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback for HTML pages
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html");
          }
        });
    })
  );
});
