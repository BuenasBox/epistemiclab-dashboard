/* EP-05 Full Simulation v2 — examen WSET L3 (cata ciega 2 vinos, cronometrada).
 * Consume infraestructura existente (EP client, Learning Loop, Mentor). Determinista.
 * Gobernanza: sin feedback durante el examen; identidad/modelo solo tras el bloqueo. */
(function () {
  "use strict";
  var SCALES = {
    intensity_app: ['pale', 'medium', 'deep'],
    colour_white: ['lemon-green', 'lemon', 'gold', 'amber'],
    colour_red: ['purple', 'ruby', 'garnet', 'tawny'],
    nose_intensity: ['light', 'medium-minus', 'medium', 'medium-plus', 'pronounced'],
    development: ['youthful', 'developing', 'fully-developed', 'tired'],
    sweetness: ['dry', 'off-dry', 'medium-dry', 'medium-sweet', 'sweet', 'luscious'],
    acidity: ['low', 'medium-minus', 'medium', 'medium-plus', 'high'],
    tannin: ['low', 'medium-minus', 'medium', 'medium-plus', 'high'],
    alcohol: ['low', 'medium', 'high'],
    body: ['light', 'medium', 'full'],
    finish: ['short', 'medium', 'long'],
    quality: ['faulty', 'poor', 'acceptable', 'good', 'very-good', 'outstanding'],
    readiness: ['too-young', 'drink-or-age', 'drink-now', 'too-old']
  };
  var LBL = {
    pale: 'Pálido', medium: 'Media', deep: 'Profundo',
    'lemon-green': 'Limón-verde', lemon: 'Limón', gold: 'Dorado', amber: 'Ámbar',
    purple: 'Púrpura', ruby: 'Rubí', garnet: 'Granate', tawny: 'Teja',
    light: 'Ligera', 'medium-minus': 'Media (–)', 'medium-plus': 'Media (+)', pronounced: 'Pronunciada',
    youthful: 'Joven', developing: 'En evolución', 'fully-developed': 'Evolucionado', tired: 'Cansado',
    dry: 'Seco', 'off-dry': 'Semi-seco', 'medium-dry': 'Semi-seco (+)', 'medium-sweet': 'Semi-dulce', sweet: 'Dulce', luscious: 'Muy dulce',
    low: 'Baja', high: 'Alta', full: 'Con cuerpo', short: 'Corto', long: 'Largo',
    faulty: 'Defectuoso', poor: 'Pobre', acceptable: 'Aceptable', good: 'Bueno', 'very-good': 'Muy bueno', outstanding: 'Excepcional',
    'too-young': 'Demasiado joven', 'drink-or-age': 'Beber o guardar', 'drink-now': 'Beber ahora', 'too-old': 'Pasado'
  };
  var AROMAS = [
    ['citrico', 'Cítrico'], ['fruta_blanca', 'Fruta blanca'], ['fruta_hueso', 'Fruta de hueso'],
    ['tropical', 'Tropical'], ['floral', 'Floral'], ['herbaceo', 'Herbáceo'],
    ['especia', 'Especia'], ['roble', 'Roble'], ['mineral', 'Mineral'], ['panaderia', 'Panadería/levadura']
  ];
  function lbl(v) { return LBL[v] || v; }
  var COMP = {
    intensity: 'Aspecto', colour: 'Aspecto',
    noseIntensity: 'Nariz', aromas: 'Nariz', development: 'Nariz',
    sweetness: 'Paladar', acidity: 'Paladar', tannin: 'Paladar', alcohol: 'Paladar', body: 'Paladar', finish: 'Paladar',
    quality: 'Calidad', readiness: 'Calidad', grape: 'Conclusiones', country: 'Conclusiones'
  };
  function ordinalTone(scale, a, b) {
    var arr = SCALES[scale]; if (!arr) return a === b ? 'coincide' : 'revisar';
    var i = arr.indexOf(a), j = arr.indexOf(b);
    if (i < 0 || j < 0) return 'revisar';
    var d = Math.abs(i - j);
    return d === 0 ? 'coincide' : (d === 1 ? 'cerca' : 'revisar');
  }
  function aromaTone(student, model) {
    student = student || []; model = model || [];
    if (!model.length) return 'coincide';
    var hit = model.filter(function (x) { return student.indexOf(x) >= 0; }).length;
    var ratio = hit / model.length;
    return ratio >= 0.66 ? 'coincide' : (ratio >= 0.34 ? 'cerca' : 'revisar');
  }
  function exactTone(a, b) { return (a && b && String(a).toLowerCase() === String(b).toLowerCase()) ? 'coincide' : 'revisar'; }
  function toneToOutcome(t) { return (t === 'coincide' || t === 'cerca') ? 'correct' : 'incorrect'; }
  function gridFor(wine) {
    var white = (wine.blind.wine_type || 'BLANCO').toUpperCase() !== 'TINTO';
    var rows = [
      { sec: 'Aspecto', axis: 'intensity', label: 'Intensidad', scale: 'intensity_app' },
      { sec: 'Aspecto', axis: 'colour', label: 'Color', scale: white ? 'colour_white' : 'colour_red' },
      { sec: 'Nariz', axis: 'noseIntensity', label: 'Intensidad', scale: 'nose_intensity' },
      { sec: 'Nariz', axis: 'aromas', label: 'Aromas', scale: 'aromas' },
      { sec: 'Nariz', axis: 'development', label: 'Desarrollo', scale: 'development' },
      { sec: 'Paladar', axis: 'sweetness', label: 'Dulzor', scale: 'sweetness' },
      { sec: 'Paladar', axis: 'acidity', label: 'Acidez', scale: 'acidity' }
    ];
    if (!white) rows.push({ sec: 'Paladar', axis: 'tannin', label: 'Taninos', scale: 'tannin' });
    rows.push({ sec: 'Paladar', axis: 'alcohol', label: 'Alcohol', scale: 'alcohol' });
    rows.push({ sec: 'Paladar', axis: 'body', label: 'Cuerpo', scale: 'body' });
    rows.push({ sec: 'Paladar', axis: 'finish', label: 'Final', scale: 'finish' });
    rows.push({ sec: 'Conclusiones', axis: 'quality', label: 'Calidad', scale: 'quality' });
    rows.push({ sec: 'Conclusiones', axis: 'readiness', label: 'Madurez / guarda', scale: 'readiness' });
    return rows;
  }
  var EP = (typeof window !== 'undefined' && window.EpistemicProfile) || null;
  var app;
  var S = null;
  function reset() {
    var wines = (typeof window !== 'undefined' && window.FS2_EXAM_WINES && window.FS2_EXAM_WINES.wines) || [];
    S = { screen: 'config', durationMin: 30, wines: wines, idx: 0, answers: {}, conf: {}, identity: {}, remaining: 30 * 60, running: false, paused: false, tick: null, finished: false, results: null };
    wines.forEach(function (w) { S.answers[w.canonical_id] = { aromas: [] }; S.identity[w.canonical_id] = {}; S.conf[w.canonical_id] = null; });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mmss(t) { var m = Math.floor(t / 60), s = t % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function startTimer() {
    if (S.tick) clearInterval(S.tick);
    S.running = true; S.paused = false;
    S.tick = setInterval(function () {
      if (!S.running) return;
      S.remaining--; updateTimer();
      if (S.remaining <= 0) { clearInterval(S.tick); S.remaining = 0; submit('time_expired'); }
    }, 1000);
  }
  function updateTimer() { var el = document.getElementById('fs-timer'); if (!el) return; el.textContent = mmss(S.remaining); el.className = 'fs-timer' + (S.remaining <= 300 ? ' urgent' : ''); }
  function wineProgress(w) {
    var grid = gridFor(w), ans = S.answers[w.canonical_id] || {};
    var done = 0, total = grid.length + 2;
    grid.forEach(function (r) { if (r.axis === 'aromas') { if ((ans.aromas || []).length) done++; } else if (ans[r.axis]) done++; });
    var id = S.identity[w.canonical_id] || {};
    if (id.grape) done++; if (id.country) done++;
    return Math.round(done / total * 100);
  }
  function render() {
    if (S.screen === 'config') return renderConfig();
    if (S.screen === 'exam') return renderExam();
    if (S.screen === 'confirm') return renderConfirm();
    if (S.screen === 'processing') return renderProcessing();
    if (S.screen === 'debrief') return renderDebrief();
  }
  function renderConfig() {
    document.body.className = '';
    app.innerHTML =
      '<div class="fs-shell"><div class="fs-pre">' +
      '<div class="fs-eyebrow">Simulacro de examen</div>' +
      '<h1 class="fs-h1">Evaluar Vino a Ciegas</h1>' +
      '<p class="fs-lead">Dos vinos. Treinta minutos. Sin pistas, sin Mentor, sin red. Como el examen real — para que el día del examen no sea la primera vez que lo vives.</p>' +
      '<div class="fs-rules">' +
      '<div class="fs-rule"><span>2</span> vinos tranquilos a ciegas</div>' +
      '<div class="fs-rule"><span>30</span> minutos cronometrados</div>' +
      '<div class="fs-rule"><span>SAT</span> completo por vino</div>' +
      '<div class="fs-rule"><span>★</span> evaluación diferida al cierre</div>' +
      '</div>' +
      '<div class="fs-config"><div class="fs-config-label">Duración</div><div class="fs-seg" id="fs-dur">' +
      [20, 30, 45].map(function (dd) { return '<button class="fs-seg-btn' + (dd === S.durationMin ? ' on' : '') + '" data-dur="' + dd + '">' + dd + ' min</button>'; }).join('') +
      '</div></div>' +
      '<p class="fs-note">Al comenzar entrarás en <b>modo concentración</b>: pantalla limpia, sin distracciones. Puedes pausar, pero el examen real no permite pausas — úsalo con criterio. La entrega es <b>definitiva</b>.</p>' +
      '<button class="fs-cta" id="fs-start">Comenzar examen →</button>' +
      '<div class="fs-gov">Práctica formativa · No es evaluación oficial</div>' +
      '</div></div>';
    document.querySelectorAll('[data-dur]').forEach(function (b) { b.onclick = function () { S.durationMin = +b.getAttribute('data-dur'); S.remaining = S.durationMin * 60; render(); }; });
    document.getElementById('fs-start').onclick = function () {
      if (!S.wines.length) { alert('No hay vinos cargados.'); return; }
      if (EP && EP.startSession) EP.startSession({ module: 'full-simulation', mode: 'exam', competencies: ['Aspecto', 'Nariz', 'Paladar', 'Calidad', 'Conclusiones'] });
      S.screen = 'exam'; startTimer(); render();
    };
  }
  function chipRow(wid, axis, scale) {
    var ans = S.answers[wid] || {};
    if (axis === 'aromas') {
      var sel = ans.aromas || [];
      return AROMAS.map(function (a) { return '<button class="fs-chip' + (sel.indexOf(a[0]) >= 0 ? ' on' : '') + '" data-aroma="' + a[0] + '">' + esc(a[1]) + '</button>'; }).join('');
    }
    return SCALES[scale].map(function (v) { return '<button class="fs-chip' + (ans[axis] === v ? ' on' : '') + '" data-axis="' + axis + '" data-val="' + v + '">' + esc(lbl(v)) + '</button>'; }).join('');
  }
  function renderExam() {
    document.body.className = 'fs-focus';
    var w = S.wines[S.idx], wid = w.canonical_id;
    var grid = gridFor(w);
    var sections = ['Aspecto', 'Nariz', 'Paladar', 'Conclusiones'];
    var gridHtml = sections.map(function (sec) {
      var rows = grid.filter(function (r) { return r.sec === sec; });
      if (!rows.length && sec !== 'Conclusiones') return '';
      var inner = rows.map(function (r) { return '<div class="fs-axis"><div class="fs-axis-l">' + esc(r.label) + '</div><div class="fs-chips">' + chipRow(wid, r.axis, r.scale) + '</div></div>'; }).join('');
      if (sec === 'Conclusiones') {
        var id = S.identity[wid] || {};
        inner += '<div class="fs-axis"><div class="fs-axis-l">Hipótesis · variedad</div><input class="fs-input" id="fs-grape" placeholder="p. ej. Chardonnay" value="' + esc(id.grape || '') + '"></div>' +
          '<div class="fs-axis"><div class="fs-axis-l">Hipótesis · país</div><input class="fs-input" id="fs-country" placeholder="p. ej. Francia" value="' + esc(id.country || '') + '"></div>' +
          '<div class="fs-axis"><div class="fs-axis-l">Confianza en tu conclusión</div><div class="fs-chips" id="fs-conf">' +
          ['Intuyo', 'Bastante seguro', 'Seguro'].map(function (c) { return '<button class="fs-chip' + (S.conf[wid] === c ? ' on' : '') + '" data-conf="' + c + '">' + c + '</button>'; }).join('') + '</div></div>';
      }
      return '<div class="fs-sec"><div class="fs-sec-h">' + esc(sec) + '</div>' + inner + '</div>';
    }).join('');
    app.innerHTML =
      '<div class="fs-exam">' +
      '<header class="fs-bar">' +
      '<div class="fs-wines">' + S.wines.map(function (ww, i) { return '<button class="fs-wtab' + (i === S.idx ? ' on' : '') + '" data-wine="' + i + '">Vino ' + (i + 1) + ' <span class="fs-wprog">' + wineProgress(ww) + '%</span></button>'; }).join('') + '</div>' +
      '<div class="fs-timer" id="fs-timer">' + mmss(S.remaining) + '</div>' +
      '<div class="fs-bar-actions"><button class="fs-ghost" id="fs-pause">Pausar</button><button class="fs-submit" id="fs-submit">Entregar</button></div>' +
      '</header>' +
      '<main class="fs-main">' +
      '<div class="fs-wine-id"><span class="fs-glass" data-type="' + esc(w.blind.wine_type) + '"></span><div><div class="fs-wine-k">' + esc(w.blind.display_label) + '</div><div class="fs-wine-s">Identidad oculta · descríbelo con el SAT</div></div></div>' +
      gridHtml + '<div class="fs-spacer"></div>' +
      '</main></div>' +
      '<div class="fs-pause-ov" id="fs-pauseov" hidden><div><div class="fs-eyebrow">En pausa</div><h2 class="fs-h2">Examen en pausa</h2><p class="fs-lead">El contenido está oculto. Reanuda cuando estés listo.</p><button class="fs-cta" id="fs-resume">Reanudar</button></div></div>';
    bindExam(wid); updateTimer();
  }
  function bindExam(wid) {
    app.querySelectorAll('[data-wine]').forEach(function (b) { b.onclick = function () { saveInputs(); S.idx = +b.getAttribute('data-wine'); render(); }; });
    app.querySelectorAll('[data-axis]').forEach(function (b) { b.onclick = function () { (S.answers[wid] = S.answers[wid] || {})[b.getAttribute('data-axis')] = b.getAttribute('data-val'); render(); }; });
    app.querySelectorAll('[data-aroma]').forEach(function (b) { b.onclick = function () { var a = S.answers[wid].aromas = S.answers[wid].aromas || []; var v = b.getAttribute('data-aroma'); var i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else a.push(v); render(); }; });
    app.querySelectorAll('[data-conf]').forEach(function (b) { b.onclick = function () { saveInputs(); S.conf[wid] = b.getAttribute('data-conf'); render(); }; });
    document.getElementById('fs-pause').onclick = function () { saveInputs(); S.running = false; S.paused = true; document.getElementById('fs-pauseov').hidden = false; };
    var rb = document.getElementById('fs-resume'); if (rb) rb.onclick = function () { S.running = true; S.paused = false; document.getElementById('fs-pauseov').hidden = true; };
    document.getElementById('fs-submit').onclick = function () { saveInputs(); S.screen = 'confirm'; S.running = false; render(); };
  }
  function saveInputs() { var w = S.wines[S.idx]; if (!w) return; var g = document.getElementById('fs-grape'), c = document.getElementById('fs-country'); if (g) S.identity[w.canonical_id].grape = g.value.trim(); if (c) S.identity[w.canonical_id].country = c.value.trim(); }
  function renderConfirm() {
    document.body.className = 'fs-focus';
    var avg = Math.round(S.wines.reduce(function (a, w) { return a + wineProgress(w); }, 0) / S.wines.length);
    app.innerHTML = '<div class="fs-shell"><div class="fs-pre"><div class="fs-eyebrow">Entrega</div><h1 class="fs-h1">¿Entregar el examen?</h1>' +
      '<p class="fs-lead">La entrega es <b>definitiva</b>. No podrás editar tus respuestas. Has completado un <b>' + avg + '%</b> del SAT de los dos vinos. Quedan <b>' + mmss(S.remaining) + '</b>.</p>' +
      '<div class="fs-confirm-actions"><button class="fs-ghost" id="fs-back">Volver al examen</button><button class="fs-cta" id="fs-final">Entregar definitivamente</button></div></div></div>';
    document.getElementById('fs-back').onclick = function () { S.screen = 'exam'; S.running = true; render(); };
    document.getElementById('fs-final').onclick = function () { submit('session_completed'); };
  }
  function renderProcessing() { document.body.className = 'fs-focus'; app.innerHTML = '<div class="fs-shell"><div class="fs-processing"><div class="fs-spin"></div><div class="fs-eyebrow">Procesando</div><p class="fs-lead">Evaluando tu cata contra el modelo y actualizando tu Epistemic Profile…</p></div></div>'; }
  function submit(reason) {
    if (S.finished) return;
    if (S.tick) clearInterval(S.tick);
    S.running = false; S.finished = true;
    S.screen = 'processing'; render();
    var results = grade(); S.results = results; emitEvents(results, reason);
    setTimeout(function () { S.screen = 'debrief'; render(); }, 1100);
  }
  function grade() {
    var perWine = S.wines.map(function (w) {
      var wid = w.canonical_id, ans = S.answers[wid] || {}, model = w.model, id = S.identity[wid] || {};
      var lines = [];
      function add(axis, label, tone, your, model_) { lines.push({ axis: axis, comp: COMP[axis], label: label, tone: tone, your: your, model: model_ }); }
      add('intensity', 'Intensidad (aspecto)', ordinalTone('intensity_app', ans.intensity, model.appearance.intensity), lbl(ans.intensity), lbl(model.appearance.intensity));
      add('colour', 'Color', ordinalTone((w.blind.wine_type || 'BLANCO').toUpperCase() !== 'TINTO' ? 'colour_white' : 'colour_red', ans.colour, model.appearance.colour), lbl(ans.colour), lbl(model.appearance.colour));
      add('noseIntensity', 'Intensidad (nariz)', ordinalTone('nose_intensity', ans.noseIntensity, model.nose.intensity), lbl(ans.noseIntensity), lbl(model.nose.intensity));
      add('aromas', 'Aromas', aromaTone(ans.aromas, model.nose.aromas), (ans.aromas || []).map(function (x) { var f = AROMAS.filter(function (y) { return y[0] === x; })[0]; return f ? f[1] : x; }).join(', '), model.nose.aromas.map(function (x) { var f = AROMAS.filter(function (y) { return y[0] === x; })[0]; return f ? f[1] : x; }).join(', '));
      add('development', 'Desarrollo', ordinalTone('development', ans.development, model.nose.development), lbl(ans.development), lbl(model.nose.development));
      add('sweetness', 'Dulzor', ordinalTone('sweetness', ans.sweetness, model.palate.sweetness), lbl(ans.sweetness), lbl(model.palate.sweetness));
      add('acidity', 'Acidez', ordinalTone('acidity', ans.acidity, model.palate.acidity), lbl(ans.acidity), lbl(model.palate.acidity));
      add('alcohol', 'Alcohol', ordinalTone('alcohol', ans.alcohol, model.palate.alcohol), lbl(ans.alcohol), lbl(model.palate.alcohol));
      add('body', 'Cuerpo', ordinalTone('body', ans.body, model.palate.body), lbl(ans.body), lbl(model.palate.body));
      add('finish', 'Final', ordinalTone('finish', ans.finish, model.palate.finish), lbl(ans.finish), lbl(model.palate.finish));
      add('quality', 'Calidad', ordinalTone('quality', ans.quality, model.quality), lbl(ans.quality), lbl(model.quality));
      add('readiness', 'Madurez/guarda', ordinalTone('readiness', ans.readiness, model.readiness), lbl(ans.readiness), lbl(model.readiness));
      add('grape', 'Variedad', exactTone(id.grape, model.identity.grape), id.grape || '—', model.identity.grape);
      add('country', 'País', exactTone(id.country, model.identity.country), id.country || '—', model.identity.country);
      var correct = lines.filter(function (l) { return toneToOutcome(l.tone) === 'correct'; }).length;
      return { wine: w, lines: lines, correct: correct, total: lines.length, conf: S.conf[wid] };
    });
    var totC = perWine.reduce(function (a, p) { return a + p.correct; }, 0);
    var totN = perWine.reduce(function (a, p) { return a + p.total; }, 0);
    return { perWine: perWine, accuracy: totN ? totC / totN : 0, correct: totC, total: totN };
  }
  var CONF100 = { 'Intuyo': 33, 'Bastante seguro': 67, 'Seguro': 95 };
  function emitEvents(results, reason) {
    if (!EP) { S.examReason = reason; return; }
    results.perWine.forEach(function (p) {
      var wid = p.wine.canonical_id;
      p.lines.forEach(function (l, i) { if (EP.decisionMade) EP.decisionMade({ competency: l.comp, itemId: wid, phaseId: l.axis, response: l.your, correctnessBand: l.tone, novel: i === 0 }); });
      if (p.conf && EP.hypothesisSubmitted) EP.hypothesisSubmitted({ competency: 'Conclusiones', itemId: wid, confidence: p.conf, style: { band: 'coincide' } });
    });
    if (EP.sessionCompleted) EP.sessionCompleted({ module: 'full-simulation', itemId: 'exam' });
    S.examReason = reason;
  }
  function buildExamMetrics(results) {
    function m(v, n) { return { value: v, evidence_count: n, status: n > 0 ? 'derived' : 'insufficient_evidence', source_event_types: [] }; }
    var calVals = results.perWine.filter(function (p) { return p.conf; }).map(function (p) { var conf = (CONF100[p.conf] || 50) / 100; var acc = p.total ? p.correct / p.total : 0; return 1 - Math.abs(conf - acc); });
    var cal = calVals.length ? calVals.reduce(function (a, b) { return a + b; }, 0) / calVals.length : null;
    return { domain: m(results.accuracy, results.total), calibration: cal == null ? m(null, 0) : m(Math.round(cal * 1000) / 1000, calVals.length), transfer: m(results.accuracy, results.perWine.length), readiness: m(results.accuracy, results.perWine.length), adherence: m(S.examReason === 'time_expired' ? 0 : 1, 1) };
  }
  function renderDebrief() {
    document.body.className = '';
    var r = S.results; var metrics = buildExamMetrics(r);
    var mentorMsg = null, loop = null;
    try { if (typeof window !== 'undefined' && window.MentorCognitivo) { mentorMsg = window.MentorCognitivo.interpret({ metrics: metrics, events: [] }).messages[0]; } } catch (e) {}
    try { if (typeof window !== 'undefined' && window.LearningLoop) { loop = window.LearningLoop.orchestrate({ summary: { metrics: metrics, weakest_metric: null, event_count: r.total }, sessions: [{ session_type: 'full-simulation', status: 'completed' }, { session_type: 'bottle-guided' }, { session_type: 'bottle-guided' }, { session_type: 'label-guided' }, { session_type: 'label-guided' }], misconceptions: [], recommendations: [] }); } } catch (e) {}
    var accuracyPct = Math.round(r.accuracy * 100);
    var winesHtml = r.perWine.map(function (p) {
      var rev = p.wine.reveal;
      var rows = p.lines.map(function (l) { return '<div class="fs-fb"><span class="fs-fb-l">' + esc(l.label) + '</span><span class="fs-tone t-' + l.tone + '">' + ({ coincide: 'Coincide', cerca: 'Cerca', revisar: 'Revisar' }[l.tone] || l.tone) + '</span><span class="fs-fb-m">tú: ' + esc(l.your || '—') + ' · modelo: ' + esc(l.model || '—') + '</span></div>'; }).join('');
      return '<section class="fs-card"><div class="fs-reveal"><div class="fs-eyebrow">Era…</div><h3 class="fs-reveal-name">' + esc(rev.display_name) + '</h3><div class="fs-reveal-meta">' + esc(rev.grape_varieties.join(', ')) + ' · ' + esc(rev.region) + ', ' + esc(rev.country) + '</div><div class="fs-reveal-style">' + esc(rev.wine_style) + '</div></div><div class="fs-score">' + p.correct + '/' + p.total + ' ejes en rango</div><div class="fs-fbs">' + rows + '</div></section>';
    }).join('');
    app.innerHTML =
      '<div class="fs-shell fs-debrief">' +
      '<div class="fs-eyebrow">Examen completado' + (S.examReason === 'time_expired' ? ' · se agotó el tiempo' : '') + '</div>' +
      '<h1 class="fs-h1">Tu resultado</h1>' +
      '<div class="fs-result"><div class="fs-ring" style="--p:' + accuracyPct + '"><i>' + accuracyPct + '%</i></div><div><div class="fs-result-k">' + r.correct + ' de ' + r.total + ' ejes en rango</div><div class="fs-lead">' + (accuracyPct >= 55 ? 'Por encima del umbral de aprobado (55%).' : 'Por debajo del umbral de aprobado (55%). Sigue practicando.') + '</div></div></div>' +
      (mentorMsg ? '<section class="fs-card fs-mentor"><div class="fs-eyebrow">Qué dice tu Mentor</div><div class="fs-m-title">' + esc(mentorMsg.title) + '</div><p class="fs-m-text">' + esc(mentorMsg.body) + '</p></section>' : '') +
      (loop ? '<section class="fs-card fs-next"><div class="fs-eyebrow">Tu siguiente paso (Learning Loop)</div><div class="fs-next-p">' + esc(loop.next.label) + '</div><p class="fs-m-text">' + esc(loop.next.reason) + '</p></section>' : '') +
      winesHtml +
      '<div class="fs-ep-note">Tu Epistemic Profile se actualizó con esta sesión. El Dashboard, el Mentor y el Learning Loop reflejarán este examen.</div>' +
      '<div class="fs-debrief-actions"><a class="fs-cta" href="../dashboard/">Ver mi Dashboard →</a><button class="fs-ghost" id="fs-again">Otro simulacro</button></div>' +
      '<div class="fs-gov">Práctica formativa · No es evaluación oficial</div></div>';
    var again = document.getElementById('fs-again'); if (again) again.onclick = function () { reset(); render(); };
  }
  function init(rootEl) { app = rootEl || document.getElementById('fs-root'); reset(); render(); }
  var api = { gradeWith: grade, ordinalTone: ordinalTone, aromaTone: aromaTone, exactTone: exactTone, toneToOutcome: toneToOutcome, buildExamMetrics: buildExamMetrics, SCALES: SCALES, init: init };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') { window.FullSimulationV2 = api; if (document.getElementById('fs-root')) init(); }
})();
