const CACHE_NAME = "flora-pwa-v23";
const APP_BASE_URL = self.registration.scope;
const APP_SHELL = [
  "",
  "index.html",
  "floraapp.html",
  "pages/login.html",
  "pages/register.html",
  "pages/addPlant.html",
  "pages/editPlant.html",
  "pages/plants.html",
  "pages/plant.html",
  "pages/tasks.html",
  "pages/profile.html",
  "pages/sobre.html",
  "pages/notes.html",
  "assets/css/styles.css",
  "assets/images/logo.svg",
  "assets/js/app.js",
  "assets/js/firebase.js",
  "assets/js/modules/UI.js",
  "assets/js/modules/api.js",
  "assets/js/modules/notes.js",
  "manifest.webmanifest",
  "manifest.json",
  "pages/offline.html"
].map((path) => new URL(path, APP_BASE_URL).href);

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

  if (event.request.destination === "image") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedImage = await cache.match(event.request);
      if (cachedImage) {
        return cachedImage;
      }

      const imageResponse = await fetch(event.request);
      if (imageResponse.ok || imageResponse.type === "opaque") {
        await cache.put(event.request, imageResponse.clone());
      }
      return imageResponse;
    })());
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith((async () => {
    if (event.request.mode === "navigate") {
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse.ok && networkResponse.type === "basic") {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        const cachedPage = await caches.match(event.request, { ignoreSearch: true });
        if (cachedPage) {
          return cachedPage;
        }

        const offlinePage = await caches.match(new URL("pages/offline.html", APP_BASE_URL).href);
        if (offlinePage) {
          return offlinePage;
        }
        throw error;
      }
    }

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
      throw error;
    }
  })());
});
