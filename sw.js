const CACHE_NAME = "flora-pwa-v10";
const APP_SHELL = [
  "./",
  "./index.html",
  "./pages/login.html",
  "./pages/register.html",
  "./pages/plants.html",
  "./pages/plant.html",
  "./pages/tasks.html",
  "./pages/profile.html",
  "./pages/sobre.html",
  "./assets/css/styles.css",
  "./assets/js/app.js",
  "./assets/js/modules/UI.js",
  "./manifest.json",
  "./pages/offline.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("flora-pwa-") && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => cachedResponse || fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match("./pages/offline.html"))
      )
  );
});
