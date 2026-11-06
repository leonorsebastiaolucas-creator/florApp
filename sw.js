const CACHE_NAME = "flora-pwa-v12";
const APP_SHELL = [
  "./",
  "./index.html",
  "./floraapp.html",
  "./manifest.json",
  "./manifest.webmanifest",
  "./pages/addPlant.html",
  "./pages/editPlant.html",
  "./pages/login.html",
  "./pages/notes.html",
  "./pages/plant.html",
  "./pages/plants.html",
  "./pages/profile.html",
  "./pages/register.html",
  "./pages/sobre.html",
  "./pages/tasks.html",
  "./assets/css/styles.css",
  "./assets/css/components/app-shell.css",
  "./assets/images/logo.svg",
  "./assets/images/icons/icon-192x192.png",
  "./assets/images/icons/icon-512x512.png",
  "./assets/js/app.js",
  "./assets/js/modules/UI.js",
  "./assets/js/modules/api.js",
  "./assets/js/modules/notes.js",
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
          .filter((cacheName) =>
            cacheName.startsWith("flora-pwa-") && cacheName !== CACHE_NAME
          )
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseCopy = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, responseCopy))
            );
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request, { ignoreSearch: true });
          if (cachedPage) {
            return cachedPage;
          }

          const homePage = await caches.match("./index.html");
          return homePage || new Response(
            "A Flora está sem ligação. Tenta novamente quando recuperares a Internet.",
            { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const responseCopy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, responseCopy))
          );
        }
        return response;
      });
    })
  );
});
