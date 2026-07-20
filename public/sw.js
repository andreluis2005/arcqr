// Service Worker básico para suporte a PWA (Progressive Web App)

const CACHE_NAME = "arcqr-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/favicon.ico"
];

// Instalação do Service Worker e caching de assets essenciais
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação do Service Worker e limpeza de caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições para responder offline se disponível
self.addEventListener("fetch", (event) => {
  // Ignora requisições de API e de Web3/RPC externas para não causar conflitos on-chain
  if (
    event.request.url.startsWith(self.location.origin) &&
    !event.request.url.includes("/api/")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          // Fallback offline se cair a conexão
          return caches.match("/");
        });
      })
    );
  }
});
