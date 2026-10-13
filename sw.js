/* BGF.LIVE aplikacija · 505 — uvijek najnovija verzija kad ima signala,
   zadnja spremljena kad nema (radi i offline od samog otvaranja). */
const SPREMISTE = 'bgf-app';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;            // server, R2, fontovi — ne diramo
  e.respondWith(
    fetch(r, { cache: 'no-store' })
      .then(odg => { if (odg && odg.ok) { const k = odg.clone(); caches.open(SPREMISTE).then(c => c.put(r, k)); } return odg; })
      .catch(() => caches.match(r).then(m => m || caches.match('./') || caches.match('index.html')))
  );
});
