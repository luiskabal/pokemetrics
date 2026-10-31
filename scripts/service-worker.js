const SHELL = '__SHELL_CACHE__';
const CONTENT = 'pokemetrics-offline-content-v1';
const BASE = new URL('./', self.location).href;
const FILES = __SHELL_FILES__;
self.addEventListener('install', event => event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(FILES.map(file => new URL(file, BASE).href)))));
// Waiting for old tabs to close keeps a running emulator on its current application version.
self.addEventListener('activate', event => event.waitUntil((async () => { for (const key of await caches.keys()) if (key.startsWith('pokemetrics-shell-') && key !== SHELL) await caches.delete(key); await self.clients.claim(); })()));
async function offlineResponse(url) {
  const cached = await (await caches.open(CONTENT)).match(url);
  if (!cached) return new Response('Content not downloaded', { status: 503 });
  const headers = new Headers(cached.headers); headers.set('X-Pokemetrics-Offline', '1'); return new Response(cached.body, { status: cached.status, headers });
}
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (event.request.mode === 'navigate' && url.href.startsWith(BASE)) { event.respondWith(caches.open(SHELL).then(cache => cache.match(new URL(url.pathname.endsWith('/emulator.html') ? 'emulator.html' : 'index.html', BASE).href))); return; }
  if (url.href.startsWith(BASE + 'data/')) { event.respondWith(fetch(event.request).then(async response => response.ok ? response : offlineResponse(url.href)).catch(() => offlineResponse(url.href))); return; }
  if (url.href.startsWith(BASE) || url.hostname === 'raw.githubusercontent.com') {
    event.respondWith((async () => { const shell = await (await caches.open(SHELL)).match(url.origin + url.pathname); if (shell) return shell; const content = await (await caches.open(CONTENT)).match(url.href); return content ?? fetch(event.request); })());
  }
});
