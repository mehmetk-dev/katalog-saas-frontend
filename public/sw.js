
// This is a dummy service worker to prevent 404 errors in the console.
// If a previous service worker was registered, this will replace it and do nothing.
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    return self.clients.claim();
});

self.addEventListener('fetch', () => {
    // Pass through all requests
});
