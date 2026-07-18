(function () {
  'use strict';

  var ENDPOINT = 'https://hylknjjhmxsuuwbsslkr.supabase.co/functions/v1/get-epistemic-profile-dashboard';
  var EMPTY = {
    summary: { data: { metrics: {} } },
    recent_sessions: { data: [] },
    open_misconceptions: { data: [] },
    recommendations: { data: [] },
    readiness: { data: { components: [] } },
  };

  function setSource(kind, text) {
    var element = document.getElementById('src');
    element.className = 'src ' + kind;
    document.getElementById('srcLabel').textContent = text;
  }

  async function fetchDashboard(token) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch(ENDPOINT, {
        headers: { Authorization: 'Bearer ' + token },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Dashboard status: ' + response.status);
      var payload = await response.json();
      if (!payload || payload.ok !== true || !payload.bundle) throw new Error('Invalid dashboard payload');
      return payload.bundle;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function load() {
    var bundle = null;
    var live = false;
    try {
      var token = typeof getAuthToken === 'function' ? await getAuthToken() : null;
      if (token) {
        bundle = await fetchDashboard(token);
        live = true;
      }
    } catch (error) {
      console.error('No pudimos cargar el progreso en vivo.', error);
    }
    if (!live) bundle = EMPTY;
    setSource(live ? 'live' : 'sample', live ? 'En vivo' : 'Empieza una práctica para construir tu perfil');
    var viewModel = window.Dashboard.buildViewModel(bundle);
    window.Dashboard.render(document.getElementById('root'), viewModel);
  }

  load();
})();
