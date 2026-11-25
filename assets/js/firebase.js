import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAnalytics,
  isSupported,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1wpv4Q6xqhdWGD1WoGg-JA4PlN9JGFKg",
  authDomain: "floraaura-fbea4.firebaseapp.com",
  projectId: "floraaura-fbea4",
  storageBucket: "floraaura-fbea4.firebasestorage.app",
  messagingSenderId: "525478701675",
  appId: "1:525478701675:web:4fc1e37438b7a21afd1f2e",
  measurementId: "G-LK19CKCKGR",
};

export async function initializeFirebase() {
  const app = initializeApp(firebaseConfig);

  if (await isSupported()) {
    return getAnalytics(app);
  }

  return null;
}
