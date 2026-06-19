const CACHE = 'actas-v7';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './Escudo-Romoc.png',
  'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // HTML/navegación y CSVs: network-first con fallback a caché
  // (así las ediciones de index.html y los datos siempre se actualizan)
  const isHTML = e.request.mode === 'navigate'
    || url.pathname.endsWith('.html')
    || url.pathname === '/' || url.pathname.endsWith('/');
  if (url.pathname.endsWith('.csv') || isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // Resto (librerías CDN, imágenes): cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
