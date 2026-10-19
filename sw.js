const CACHE_NAME = "flora-pwa-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./pages/offline.html",
  "./assets/css/styles.css",
  "./assets/css/components/app-shell.css",
  "./assets/js/app.js",
  "./assets/js/modules/UI.js",
  "./assets/js/modules/api.js",
  "./assets/images/logo.svg",
  "./assets/images/icons/icon-192x192.png",
  "./assets/images/icons/icon-512x512.png",
  "./pages/login.html",
  "./pages/register.html",
  "./pages/plants.html",
  "./pages/addPlant.html",
  "./pages/editPlant.html",
  "./pages/plant.html",
  "./pages/profile.html",
  "./pages/tasks.html",
  "./pages/sobre.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              cacheName.startsWith("flora-pwa-") && cacheName !== CACHE_NAME
          )
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedPage = await caches.match(event.request);
        return cachedPage || caches.match("./pages/offline.html");
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request);
    })
  );
});
