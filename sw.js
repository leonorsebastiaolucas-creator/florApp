const CACHE_NAME = "flora-pwa-v16";
const APP_SHELL = [
  "./",
  "./index.html",
  "./floraapp.html",
  "./pages/login.html",
  "./pages/register.html",
  "./pages/addPlant.html",
  "./pages/editPlant.html",
  "./pages/plants.html",
  "./pages/plant.html",
  "./pages/tasks.html",
  "./pages/profile.html",
  "./pages/sobre.html",
  "./pages/notes.html",
  "./assets/css/styles.css",
  "./assets/images/logo.svg",
  "./assets/js/app.js",
  "./assets/js/modules/UI.js",
  "./manifest.webmanifest",
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

  event.respondWith((async () => {
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(event.request);
      if (networkResponse.ok && networkResponse.type === "basic") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      if (event.request.mode === "navigate") {
        const offlinePage = await caches.match("./pages/offline.html");
        if (offlinePage) {
          return offlinePage;
        }
      }
      throw error;
    }
  })());
});
