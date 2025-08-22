/**
 * Service Worker - placeholder file
 * This file is served as a static asset to resolve browser requests for service worker
 */

// Placeholder service worker with proper lifecycle management
console.log("Service worker placeholder loaded");

// Basic service worker registration
self.addEventListener("install", function () {
  console.log("Service worker installed");
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  console.log("Service worker activated");
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function () {
  // Pass through all fetch requests without intervention
  // This prevents any caching or network interference
  return;
});
