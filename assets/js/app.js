import { initializeUI } from "./modules/UI.js";

initializeUI();

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    try {
      const currentPath = window.location.pathname;
      const appRoot = new URL(currentPath.includes("/pages/") ? "../" : "./", window.location.href);
      const appWorkerUrl = new URL("sw.js", appRoot).href;
      navigator.serviceWorker
        .register(appWorkerUrl, { scope: appRoot.pathname })
        .catch((error) => {
          console.error("Não foi possível atualizar o suporte offline da Flora:", error);
        });
    } catch (error) {
      console.error("Não foi possível atualizar o suporte offline da Flora:", error);
    }
  });
}
