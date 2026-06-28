const CACHE_NAME = "gestor-gastos-v1";

// No precachea nada a propósito (no conocemos los nombres de archivo con hash del
// build). En cambio, cachea "sobre la marcha": cada request que sale bien se
// guarda, y si en algún momento no hay red, se sirve lo último que quedó guardado.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copia = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copia));
        return response;
      })
      .catch(
        () =>
          caches.match(request).then((cacheada) => cacheada ?? caches.match("/")) // si no hay red Y nunca se cacheó esto, cae al shell principal
      )
  );
});
