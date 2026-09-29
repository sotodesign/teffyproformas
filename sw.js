const V = 'proformas-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const EXTERNOS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    // Archivos propios: primero internet (para recibir mejoras), y sin conexión usa lo guardado.
    e.respondWith(
      fetch(req)
        .then(r => {
          if (r.ok) { const copia = r.clone(); caches.open(V).then(c => c.put(req, copia)); }
          return r;
        })
        .catch(() => caches.match(req).then(m => m || caches.match('index.html')))
    );
  } else if (EXTERNOS.includes(url.hostname)) {
    // Librería de PDF y tipografías: se guardan la primera vez y luego salen del dispositivo.
    e.respondWith(
      caches.match(req).then(m => m || fetch(req).then(r => {
        const copia = r.clone();
        caches.open(V).then(c => c.put(req, copia));
        return r;
      }))
    );
  }
});
