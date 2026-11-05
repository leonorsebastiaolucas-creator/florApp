import { initializeUI } from "./modules/UI.js";

initializeUI();

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", async () => {
    const appWorkerUrl = new URL("../../sw.js", import.meta.url).href;
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const appRegistrations = registrations.filter((registration) =>
        [registration.active, registration.waiting, registration.installing]
          .some((worker) => worker?.scriptURL === appWorkerUrl)
      );
      await Promise.all(appRegistrations.map((registration) => registration.unregister()));

      const appCaches = (await caches.keys()).filter((cacheName) => cacheName.startsWith("flora-"));
      await Promise.all(appCaches.map((cacheName) => caches.delete(cacheName)));

      await navigator.serviceWorker.register(appWorkerUrl, { scope: "../../" });
    } catch (error) {
      console.error("Não foi possível atualizar o suporte offline da Flora:", error);
    }
  });
}
