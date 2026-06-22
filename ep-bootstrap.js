/* ep-bootstrap.js — puente de sesión + transporte de escritura del Epistemic Profile.
 * Resuelve el token (anónimo o real) vía getAuthToken() y, si existe el cliente
 * compartido window.EpistemicProfile, configura su transporte para PERSISTIR eventos
 * en record-epistemic-event. Defensivo: nunca lanza, nunca rompe la página.
 * Requiere cargar antes: supabase-js + ../shared/auth-token.js (+ epistemic-profile-client.js si se quiere escritura). */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  var SB = 'https://hylknjjhmxsuuwbsslkr.supabase.co';
  window.EpistemicLabAuth = window.EpistemicLabAuth || { token: null, ready: null };
  window.EpistemicLabAuth.ready = (async function () {
    var t = null;
    try { if (typeof getAuthToken === 'function') t = await getAuthToken(); } catch (e) { /* sin auth: degradación */ }
    window.EpistemicLabAuth.token = t;
    window.__EP_TOKEN__ = t;
    try {
      if (t && window.EpistemicProfile && typeof window.EpistemicProfile.configure === 'function') {
        window.EpistemicProfile.configure({
          endpoint: SB + '/functions/v1/record-epistemic-event',
          getToken: function () { return window.EpistemicLabAuth.token; }
        });
      }
    } catch (e) { /* no-op */ }
    return t;
  })();
})();
