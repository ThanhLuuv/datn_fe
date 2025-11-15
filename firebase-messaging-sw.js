// Firebase Messaging Service Worker - Disabled
// This file exists to prevent 404 errors when browser looks for Firebase messaging service worker
// Firebase messaging is not used in this application

// Empty service worker - does nothing
self.addEventListener('install', function(event) {
    // Skip waiting
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    // Take control of all pages
    event.waitUntil(self.clients.claim());
});

// Do not handle any messages
self.addEventListener('message', function(event) {
    // Ignore all messages
});

