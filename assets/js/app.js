import { initializeUI } from "./modules/UI.js";

initializeUI();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(new URL("../../sw.js", import.meta.url))
      .catch((error) => {
        console.error("Não foi possível registar o Service Worker:", error);
      });
  });
}
