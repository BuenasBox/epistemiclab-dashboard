/* EpistemicLab — Service Worker (app shell offline + caché de recursos estáticos).
 * No cachea nunca llamadas a Supabase ni RPCs: los datos de usuario siempre van
 * a la red. Solo cachea HTML/CSS/JS/íconos propios del sitio, para que la app
 * pueda abrirse e instalarse sin conexión. La sincronización de intentos de
 * práctica hechos offline la maneja shared/learning-sync.js, no este archivo.
 *
 * Gobernanza: este worker no toma decisiones pedagógicas ni de scoring, solo
 * sirve archivos. No intercepta nada bajo /api/, /supabase/ ni dominios externos.
 */
'use strict';

var CACHE_VERSION = 'epistemiclab-v3';
var SHELL_CACHE = CACHE_VERSION + '-shell';
var RUNTIME_CACHE = CACHE_VERSION + '-runtime';
var OFFLINE_URL = '/offline.html';

var PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/platform-nav.css',
  '/platform-nav.js',
  '/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Nunca interceptar estas rutas: siempre red, nunca caché.
var NEVER_CACHE_PATTERNS = [
  /\/api\//,
  /\/supabase\//,
  /supabase\.co/,
  /jsdelivr\.net/,
  /cdnjs\.cloudflare\.com/
];

function isNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some(function (re) { return re.test(url); });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      return cache.addAll(PRECACHE_URLS).catch(function () {
        // Si algún recurso del shell falla (ej. primera publicación sin íconos aún),
        // no bloquear la instalación del worker por eso.
        return Promise.resolve();
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key.indexOf(CACHE_VERSION) !== 0; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

function networkFirstNavigation(request) {
  return fetch(new Request(request, { cache: 'no-store' }))
    .then(function (response) {
      var copy = response.clone();
      caches.open(RUNTIME_CACHE).then(function (cache) { cache.put(request, copy); });
      return response;
    })
    .catch(function () {
      return caches.match(request).then(function (cached) {
        return cached || caches.match(OFFLINE_URL);
      });
    });
}

function networkFirstStatic(request) {
  return caches.open(RUNTIME_CACHE).then(function (cache) {
    return fetch(new Request(request, { cache: 'no-cache' }))
      .then(function (response) {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      })
      .catch(function () { return cache.match(request); });
  });
}

function cacheFirst(request) {
  return caches.open(RUNTIME_CACHE).then(function (cache) {
    return cache.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      });
    });
  });
}

function staleWhileRevalidate(request) {
  return caches.open(RUNTIME_CACHE).then(function (cache) {
    return cache.match(request).then(function (cached) {
      var fetchPromise = fetch(new Request(request, { cache: 'no-cache' })).then(function (response) {
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      }).catch(function () { return cached; });
      return cached || fetchPromise;
    });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = request.url;
  if (isNeverCache(url)) return; // deja pasar sin interceptar

  // Navegación entre páginas (cargar un documento HTML)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Recursos estáticos del propio origen (CSS, JS, JSON, íconos)
  var sameOrigin = url.indexOf(self.location.origin) === 0;
  if (sameOrigin) {
    var parsed = new URL(url);
    if (parsed.searchParams.has('v')) {
      event.respondWith(cacheFirst(request));
      return;
    }
    if (/\.(?:css|js)$/.test(parsed.pathname)) {
      event.respondWith(networkFirstStatic(request));
      return;
    }
    event.respondWith(staleWhileRevalidate(request));
  }
});
