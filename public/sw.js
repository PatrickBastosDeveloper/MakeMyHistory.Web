// MakeMyHistory — Service Worker
//
// Estratégia de cache:
// - Requisições de API (/api/*): SEMPRE rede, nunca cacheadas. Isso garante que a
//   história/memórias mais recentes sejam sempre exibidas — nunca uma versão antiga.
// - Assets com hash de build (/assets/*): cache-first. O nome muda quando o conteúdo
//   muda, então o arquivo é imutável e pode ser servido do cache com segurança.
// - Arquivos públicos de nome estável (favicon, ícones, manifest): network-first com
//   fallback para o cache. Um deploy novo aparece sem precisar de hard refresh.
// - Navegação (HTML): network-first, com fallback para o shell em cache quando offline.
// - Caches de versões antigas são removidos no activate.

const CACHE_NAME = 'mmh-static-v2';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/pwa-icon.svg', '/logo.png'];

// Arquivos servidos de /public com nome fixo: não têm hash de build, por isso não
// podem ser cacheados de forma permanente.
const STABLE_STATIC_FILE = /\.(?:js|css|svg|png|jpg|jpeg|webp|gif|ico|woff2?|webmanifest)$/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Nunca cachear nem interceptar chamadas de API — sempre rede.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Só cuidamos de requisições da mesma origem.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Assets versionados pelo build: seguros para cache-first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (STABLE_STATIC_FILE.test(url.pathname)) {
    event.respondWith(networkFirstAsset(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw new Error('offline');
  }
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put('/index.html', response.clone());
    }
    return response;
  } catch {
    const cached = (await cache.match('/index.html')) || (await cache.match('/'));
    if (cached) {
      return cached;
    }
    throw new Error('offline');
  }
}
