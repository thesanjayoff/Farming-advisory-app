// Hand-written service worker (no Workbox dependency, to keep the bundle
// small for low-bandwidth users). Two strategies:
//  - App shell / static assets: cache-first, so the installed app opens
//    instantly offline.
//  - API GET calls (weather/prices/kb-backed assistant is POST, so it's not
//    cached here — see lib/db/client.ts + IndexedDB for that path instead):
//    network-first with a cache fallback, so a stale-but-present forecast or
//    price list is shown (with its age) instead of a blank screen.

const SHELL_CACHE = "vayal-shell-v1";
const RUNTIME_CACHE = "vayal-runtime-v1";

const SHELL_URLS = ["/", "/manifest.webmanifest", "/icon-192", "/icon-512"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "offline", gap: true }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
