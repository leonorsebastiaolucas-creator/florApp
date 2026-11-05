const CACHE_NAME = "flora-v18";
const PLANT_IMAGES = [
  "https://i.pinimg.com/originals/6d/04/f7/6d04f724c9864acedd241e44835b1838.jpg",
  "https://i.pinimg.com/originals/59/bd/fa/59bdfa3d93b5ef0831907378cf1fe4a1.jpg",
  "https://i.pinimg.com/originals/63/60/68/6360684ee640d6b90998765d10058806.jpg",
];
const APP_SHELL = [
  "./",
  "./index.html",
  "./floraapp.html",
  "./manifest.webmanifest",
  "./pages/addPlant.html",
  "./pages/editPlant.html",
  "./pages/login.html",
  "./pages/notes.html",
  "./pages/offline.html",
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
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await Promise.all(PLANT_IMAGES.map(async (imageUrl) => {
        try {
          const response = await fetch(new Request(imageUrl, { mode: "no-cors" }));
          await cache.put(imageUrl, response);
        } catch (error) {
          console.error(`Não foi possível guardar a imagem ${imageUrl} na cache:`, error);
        }
      }));
    })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("flora-") && cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (PLANT_IMAGES.includes(request.url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedImage = await cache.match(request);
        if (cachedImage) {
          return cachedImage;
        }

        const response = await fetch(request);
        await cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseCopy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
          );
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedPage = await cache.match(request, { ignoreSearch: true });
          return cachedPage || cache.match("./pages/offline.html");
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
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy))
          );
        }
        return response;
      });
    })
  );
});
