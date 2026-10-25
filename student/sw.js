const CACHE_NAME = "lxwis-student-v7";

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

// No fetch handler: always let the browser request the latest deployed page.
// API calls and uploaded lesson data are never cached by this worker.
