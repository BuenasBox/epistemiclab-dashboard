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

  function isEmptyAuthenticatedBundle(bundle) {
    var summary = bundle && bundle.summary && bundle.summary.data;
    var sessions = bundle && bundle.recent_sessions && bundle.recent_sessions.data;
    return Number(summary && summary.event_count) === 0
      && Array.isArray(sessions) && sessions.length === 0;
  }

  function renderServerError(root) {
    if (!root) return;
    var card = document.createElement('section');
    card.className = 'card';
    card.setAttribute('role', 'alert');
    card.innerHTML =
      '<div class="eyebrow">No pudimos cargar tu progreso</div>' +
      '<p class="muted small">Intenta de nuevo.</p>' +
      '<button type="button" class="pill pill-go" id="dashboard-retry">Reintentar</button>';
    root.insertBefore(card, root.firstChild);
    var retry = card.querySelector('#dashboard-retry');
    if (retry) retry.addEventListener('click', function () {
      retry.disabled = true;
      load();
    });
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
    var loadState = 'unauthenticated';
    try {
      var token = typeof getAuthToken === 'function' ? await getAuthToken() : null;
      if (token) {
        bundle = await fetchDashboard(token);
        live = true;
        loadState = isEmptyAuthenticatedBundle(bundle)
          ? 'empty_authenticated'
          : 'live';
      }
    } catch (error) {
      loadState = 'server_error';
      console.error('No pudimos cargar el progreso en vivo.', error);
    }
    if (!live) bundle = EMPTY;
    setSource(live ? 'live' : 'sample', live ? 'En vivo' : 'Empieza una práctica para construir tu perfil');
    if (loadState === 'server_error') {
      setSource('sample', 'No pudimos cargar tu progreso');
    }
    var viewModel = window.Dashboard.buildViewModel(bundle);
    viewModel.loadState = loadState;
    var root = document.getElementById('root');
    window.Dashboard.render(root, viewModel);
    if (loadState === 'server_error') renderServerError(root);
  }

  load();
})();
