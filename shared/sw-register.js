/* EpistemicLab — registro del Service Worker + banner mínimo de estado offline.
 * Incluir con: <script src="/shared/sw-register.js" defer></script>
 * Seguro de incluir en cualquier página (no hace nada si el navegador no
 * soporta Service Worker, y no interfiere con ninguna lógica existente). */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {
        // Si falla el registro (ej. entorno de pruebas), la app sigue
        // funcionando normalmente, solo sin caché offline.
      });
    });
  }

  function showOfflineBanner(isOffline) {
    var id = 'epl-offline-banner';
    var existing = document.getElementById(id);
    if (!isOffline) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;
    var el = document.createElement('div');
    el.id = id;
    el.setAttribute('role', 'status');
    el.textContent = 'Sin conexión — tu progreso se guarda en este dispositivo y se sincroniza al reconectar.';
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;' +
      'background:#e5c97a;color:#1a1119;font:600 12.5px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;' +
      'text-align:center;padding:9px 14px;';
    document.body.appendChild(el);
  }

  // La sincronización real al reconectar la maneja shared/learning-sync.js
  // (tiene su propio listener de 'online'); aquí solo se refleja el estado
  // de conexión en la interfaz.
  window.addEventListener('online', function () {
    showOfflineBanner(false);
  });
  window.addEventListener('offline', function () {
    showOfflineBanner(true);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { showOfflineBanner(!navigator.onLine); });
  } else {
    showOfflineBanner(!navigator.onLine);
  }
})();
