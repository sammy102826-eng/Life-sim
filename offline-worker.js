/* The asset manifest keeps one complete release available at a time. */
importScripts('./offline-assets.js');

const scope = self.registration.scope;
const cachePrefix = 'born-to-run:' + scope + ':';
const cacheName = cachePrefix + OFFLINE_VERSION;
const updateProtocol = new URL('offline-update-protocol', scope).href;
const assets = OFFLINE_ASSETS.map(path => new URL(path, scope));
const byPath = new Map(assets.map(url => [url.pathname, url.href]));
byPath.set(new URL(scope).pathname, new URL('index.html', scope).href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const previous = (await caches.keys()).filter(name => name.startsWith(cachePrefix) && name !== cacheName);
    const supportsUpdates = await Promise.all(previous.map(async name => {
      const cache = await caches.open(name);
      return Boolean(await cache.match(updateProtocol));
    }));
    const cache = await caches.open(cacheName);
    await cache.addAll(assets.map(url => new Request(url, {cache: 'reload'})));
    await cache.put(updateProtocol, new Response(OFFLINE_VERSION));
    // Upgrade legacy installations once. Later releases wait for the app's update control.
    if (self.registration.active && previous.length && !supportsUpdates.some(Boolean)) await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(cachePrefix) && name !== cacheName)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'activate-release') event.waitUntil(self.skipWaiting());
  if (event.data === 'release-version') event.ports[0]?.postMessage(OFFLINE_VERSION);
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const asset = url.origin === self.location.origin && byPath.get(url.pathname);
  if (!asset) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return (await cache.match(asset)) || fetch(event.request);
  })());
});
