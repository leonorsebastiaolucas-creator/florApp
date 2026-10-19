const CACHE_NAME = "flora-static-v1";
const APP_SCOPE = self.registration.scope;
const OFFLINE_URL = new URL("pages/offline.html", APP_SCOPE).href;
const PRECACHE_PATHS = [
  "plants_.html",
  "pages/addPlant.html",
  "pages/editPlant.html",
  "pages/login.html",
  "pages/offline.html",
  "pages/plant.html",
  "pages/plants.html",
  "pages/profile.html",
  "pages/register.html",
  "pages/sobre.html",
  "pages/tasks.html",
  "assets/css/styles.css",
  "assets/css/components/app-shell.css",
  "assets/js/app.js",
  "assets/js/modules/UI.js",
  "assets/js/modules/api.js",
  "assets/images/logo.svg",
  "assets/images/icons/icon-192x192.png",
  "assets/images/icons/icon-512x512.png",
];

async function cacheResponse(request, response) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  } catch (error) {
    console.error("Não foi possível guardar a resposta em cache:", error);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(
          PRECACHE_PATHS.map((path) => new URL(path, APP_SCOPE).href),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("flora-") && cacheName !== CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (
    request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    !requestUrl.href.startsWith(APP_SCOPE)
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            event.waitUntil(cacheResponse(request, response));
          }
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) {
            return cachedPage;
          }

          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) {
            return offlinePage;
          }

          return Response.error();
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          event.waitUntil(cacheResponse(request, response));
        }
        return response;
      });
    }),
  );
});
