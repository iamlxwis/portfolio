const CACHE_NAME = "lxwis-student-v6";

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith("lxwis-student-")).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// No fetch handler: all requests use the network, with no stale app-shell cache.
