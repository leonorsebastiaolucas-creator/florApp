import { initializeUI } from "./modules/UI.js";

initializeUI();

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", async () => {
    try {
      const currentPath = window.location.pathname;
      const appRoot = new URL(currentPath.includes("/pages/") ? "../" : "./", window.location.href);
      const appWorkerUrl = new URL("sw.js", appRoot).href;

      const registrations = await navigator.serviceWorker.getRegistrations();
      const appRegistrations = registrations.filter((registration) =>
        [registration.active, registration.waiting, registration.installing]
          .some((worker) => worker?.scriptURL === appWorkerUrl)
      );
      await Promise.all(appRegistrations.map((registration) => registration.unregister()));

      const appCaches = (await caches.keys()).filter((cacheName) => cacheName.startsWith("flora-"));
      await Promise.all(appCaches.map((cacheName) => caches.delete(cacheName)));

      await navigator.serviceWorker.register(appWorkerUrl, { scope: appRoot.pathname });
    } catch (error) {
      console.error("Não foi possível atualizar o suporte offline da Flora:", error);
    }
  });
}
