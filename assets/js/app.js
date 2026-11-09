import { initializeUI } from "./modules/UI.js";

initializeUI();

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", async () => {
    try {
      const currentPath = window.location.pathname;
      const appRoot = new URL(currentPath.includes("/pages/") ? "../" : "./", window.location.href);
      const appWorkerUrl = new URL("sw.js", appRoot).href;
      let isReloading = false;

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!isReloading) {
            isReloading = true;
            window.location.reload();
          }
        });
      }

      const registration = await navigator.serviceWorker.register(appWorkerUrl, {
        scope: appRoot.pathname,
      });
      await registration.update();
    } catch (error) {
      console.error("Não foi possível atualizar o suporte offline da Flora:", error);
    }
  });
}
