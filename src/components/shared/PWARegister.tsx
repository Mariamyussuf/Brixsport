"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        // Register the custom service worker placed in public/
        const swUrl = "/service-worker.js";
        const reg = await navigator.serviceWorker.register(swUrl);

        // Listen for updates and prompt reload
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("New content is available; please refresh.");
            }
          });
        });
      } catch (err) {
        console.error("[PWA] SW registration failed:", err);
      }
    };

    register();
  }, []);

  return null;
}
