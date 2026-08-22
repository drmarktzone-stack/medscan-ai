/* MedScan AI — network-first shell. Do not cache clinical drafts as truth. */
const CACHE = "medscan-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith((async () => {
    try {
      return await fetch(event.request);
    } catch {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      throw new Error("offline");
    }
  })());
});
