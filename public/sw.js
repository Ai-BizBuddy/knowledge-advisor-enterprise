/**
 * Service Worker - placeholder file
 * This file is served as a static asset to resolve browser requests for service worker
 */

// Placeholder service worker with proper lifecycle management

// Basic service worker registration
self.addEventListener('install', function () {
    // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function () {
  // Pass through all fetch requests without intervention
  // This prevents any caching or network interference
  return;
});
