/* Hooshyar service worker — offline shell + cached read-only API
 *
 * Strategies:
 *  - Navigations (HTML): network-first → cached shell → /offline.html
 *  - GET /api/* (conversations, images, TTS metadata...): network-first →
 *    cached copy (so تاریخچه و گالری تصاویر هم آفلاین کار می‌کنند) → JSON 503
 *  - Static assets (immutable): cache-first
 *  - Everything else (incl. POST /api/chat, /api/tts): untouched —
 *    the app itself queues messages while offline (lib/offline-queue)
 */
const VERSION = 'v3';
const SHELL_CACHE = `hooshyar-shell-${VERSION}`;
const API_CACHE = `hooshyar-api-${VERSION}`;
const OWNED_CACHES = [SHELL_CACHE, API_CACHE];

const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png?v=2',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        // allSettled: one missing asset must never break the SW install
        Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !OWNED_CACHES.includes(k)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // ── API: network-first, cached copy as offline fallback ──
  // (only GET reaches here — POST chat/tts/image are never intercepted)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || offlineJson())
        )
    );
    return;
  }

  // ── App shell navigation ──
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() =>
          caches
            .match('/')
            .then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // ── Immutable static assets: cache-first ──
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/logo.svg' ||
    url.pathname.startsWith('/fonts/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});

/** Friendly JSON fallback for uncached API reads while offline */
function offlineJson() {
  return new Response(
    JSON.stringify({
      offline: true,
      error: 'این بخش آفلاین در دسترس نیست — بعد از وصل شدن اینترنت دوباره امتحان کن 🙏',
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }
  );
}
