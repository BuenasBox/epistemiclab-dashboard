(function () {
  'use strict';

  var cfg = window.INVESTIGATION_LAB_CONFIG || {};
  var app = document.getElementById('app');
  var chip = document.getElementById('statusChip');
  var network = document.getElementById('networkStatus');
  var API = ((window.WSET_SUPABASE_CONFIG || {}).url || '') + '/functions/v1/';
  var KEY = (window.WSET_SUPABASE_CONFIG || {}).publishableKey || '';

  var state = {
    session: null,
    step: null,
    progress: { current: 1, total: 1 },
    caseData: null,
    selection: '',
    evidenceWeights: {},
    confidence: '',
    justification: '',
    busy: false,
    evaluations: [],
    commitments: [],
    evidenceCatalog: {},
    contradictionInterp: null,
    contradictionAction: null,
    contradictionResolvedStepId: null,
    pendingRevisionMeta: null,
    mentorNotes: [],
    completed: false
  };

  var CONF_ORDER = ['cannot_determine', 'intuition', 'probable', 'fairly_sure', 'certain'];
  var CONF_LABEL = {
    cannot_determine: 'No determinable',
    intuition: 'Posible',
    probable: 'Probable',
    fairly_sure: 'Muy probable',
    certain: 'Casi seguro'
  };
  var CONTRADICTION_INTERP = { reinforces: 'La refuerza', weakens: 'La debilita', contradicts: 'La contradice', no_change: 'No cambia la lectura' };
  var REVISION_ACTION = { maintain: 'Mantener', nuance: 'Matizar', revise: 'Revisar' };
  var INTERNAL_LABELS = {
    caution: 'Atención a la evidencia',
    confirmation: 'Lectura confirmada',
    precision: 'Precisión',
    contradiction: 'Punto de giro',
    calibration: 'Calibración',
    technical_inference: 'Inferencia técnica',
    explicit_required: 'Información explícita',
    geographical_indication: 'Indicación geográfica',
    absence_of_information: 'Información ausente',
    optional_context: 'Contexto adicional',
    non_diagnostic: 'no concluyente'
  };
  var CALIBRATION_LABEL = {
    aligned: 'Tu confianza estuvo alineada con lo que la evidencia permitía sostener.',
    overconfident: 'Tu certeza fue mayor que el respaldo disponible.',
    underconfident: 'La evidencia sostenía más de lo que te atreviste a afirmar.',
    uncertainty_correct: 'Reconociste correctamente que todavía no era posible concluir.',
    evasive_uncertainty: 'La evidencia permitía una conclusión más firme.'
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>\"]/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char];
    });
  }

  function human(value) {
    var text = String(value == null ? '' : value);
    if (INTERNAL_LABELS[text]) return INTERNAL_LABELS[text];
    Object.keys(INTERNAL_LABELS).forEach(function (key) {
      text = text.replace(new RegExp('\\b' + key + '\\b', 'gi'), INTERNAL_LABELS[key]);
    });
    return text.replace(/_/g, ' ');
  }

  function phaseMeta(step) {
    var id = step && step.id || '';
    var map = {
      observe: ['Inspección', 'Localiza los hechos antes de interpretarlos.'],
      classify_evidence: ['Clasificación', 'Distingue información fuerte, contexto y ruido.'],
      hierarchize: ['Jerarquía', 'Decide qué señales merecen sostener tu lectura.'],
      interpret: ['Interpretación', 'Conecta los hechos sin exceder su alcance.'],
      hypothesize: ['Teoría', 'Construye la explicación más defendible.'],
      declare_confidence: ['Calibración', 'Decide cuánto estás dispuesto a sostener.'],
      justify: ['Defensa', 'Comprueba que tu teoría está anclada en evidencia.'],
      search_contradictions: ['Contraprueba', 'Busca lo que podría romper tu teoría.'],
      revise: ['Revisión', 'Actualiza tu lectura si la nueva evidencia lo exige.']
    };
    return map[id] || ['Investigación', human(step && step.prompt || 'Continúa el expediente.')];
  }

  function categoryLabel(category) {
    return INTERNAL_LABELS[category] || human(category || 'evidencia');
  }

  function setNetwork() {
    network.hidden = navigator.onLine;
    network.textContent = 'Sin conexión. Conserva esta pantalla y reintenta cuando vuelva la red.';
  }

  function progressHtml() {
    var current = Math.max(1, Number(state.progress.current) || 1);
    var total = Math.max(current, Number(state.progress.total) || current);
    var percent = Math.round((current / total) * 100);
    return '<div class="case-progress" aria-label="Progreso del expediente: fase ' + current + ' de ' + total + '">' +
      '<div class="case-progress__copy"><span>Fase ' + current + ' de ' + total + '</span><strong>' + percent + '%</strong></div>' +
      '<progress class="case-progress__track" value="' + current + '" max="' + total + '">' + percent + '%</progress></div>';
  }

  function bottleArtifact(evidence, interactive) {
    if (interactive === undefined) interactive = true;
    var pins = (evidence || []).slice(0, 4).map(function (item, index) {
      return interactive
        ? '<button class="artifact-pin artifact-pin--' + (index + 1) + '" data-focus-evidence="' + esc(item.id) + '" aria-label="Examinar ' + esc(item.label) + '"><span>' + (index + 1) + '</span></button>'
        : '<span class="artifact-pin artifact-pin--' + (index + 1) + '" aria-hidden="true"><span>' + (index + 1) + '</span></span>';
    }).join('');
    return '<div class="artifact artifact--bottle"><div class="artifact-halo"></div><div class="case-bottle"><span class="case-bottle__cap"></span><span class="case-bottle__neck"></span><span class="case-bottle__body"></span><span class="case-bottle__label">EVIDENCIA</span></div>' + pins + '<p class="artifact-help">' + (interactive ? 'Selecciona los marcadores o revisa el expediente.' : 'Objeto reconstruido con las pistas examinadas.') + '</p></div>';
  }

  function labelArtifact(evidence, interactive) {
    if (interactive === undefined) interactive = true;
    var rows = (evidence || []).slice(0, 6).map(function (item, index) {
      var content = '<span>' + esc(item.label) + '</span><strong>' + esc(item.value) + '</strong><i>' + (index + 1) + '</i>';
      return interactive
        ? '<button class="document-line" data-focus-evidence="' + esc(item.id) + '">' + content + '</button>'
        : '<div class="document-line">' + content + '</div>';
    }).join('');
    return '<div class="artifact artifact--document"><div class="document-sheet"><div class="document-kicker">Documento bajo análisis</div><div class="document-title">ETIQUETA · EXPEDIENTE</div><div class="document-rule"></div>' + rows + '</div><p class="artifact-help">' + (interactive ? 'Toca una línea para cotejarla con el expediente.' : 'Documento reconstruido con las pistas examinadas.') + '</p></div>';
  }

  function artifactHtml(evidence, interactive) {
    return cfg.lab === 'label' ? labelArtifact(evidence, interactive) : bottleArtifact(evidence, interactive);
  }

  function evidenceCard(item) {
    var selected = state.evidenceWeights[item.id] || '';
    var order = cfg.lab === 'label' ? ['contextual', 'relevant', 'decisive'] : ['secondary', 'relevant', 'key'];
    var labels = cfg.lab === 'label'
      ? { contextual: 'Contextual', relevant: 'Relevante', decisive: 'Decisiva' }
      : { secondary: 'Secundaria', relevant: 'Relevante', key: 'Clave' };
    var controls = order.map(function (weight) {
      var normalizedWeight = cfg.lab === 'label' ? { contextual: 'secondary', relevant: 'relevant', decisive: 'key' }[weight] : weight;
      var active = selected === normalizedWeight;
      return '<button type="button" class="evidence-weight ' + (active ? 'is-active' : '') + '" data-weight-for="' + esc(item.id) + '" data-weight="' + weight + '" aria-pressed="' + active + '">' + labels[weight] + '</button>';
    }).join('');
    return '<article class="evidence-card" id="evidence-' + esc(item.id) + '"><div class="evidence-card__top"><span class="evidence-card__index">' + esc(item.index) + '</span><div><h3>' + esc(item.label) + '</h3><p>' + esc(item.value) + '</p></div></div>' +
      (item.category ? '<span class="evidence-card__category">' + esc(categoryLabel(item.category)) + '</span>' : '') +
      '<div class="evidence-card__weights" role="group" aria-label="Valor de ' + esc(item.label) + '">' + controls + '</div></article>';
  }

  function transferEvidenceCard(item) {
    return '<article class="evidence-card"><div class="evidence-card__top"><span class="evidence-card__index">' + esc(item.index) + '</span><div><h3>' + esc(item.label || item.id) + '</h3><p>' + esc(item.value || '') + '</p></div></div>' +
      (item.category || item.signal_type ? '<span class="evidence-card__category">' + esc(categoryLabel(item.category || item.signal_type)) + '</span>' : '') + '</article>';
  }

  function dossierHtml() {
    var evidence = Object.keys(state.evidenceCatalog).map(function (id, index) {
      var item = state.evidenceCatalog[id];
      return Object.assign({ id: id, index: String(index + 1).padStart(2, '0') }, item);
    });
    return '<aside class="dossier-panel"><div class="dossier-panel__head"><div><span class="micro-label">Expediente activo</span><h2>Pistas reunidas</h2></div><span class="dossier-count">' + evidence.length + '</span></div>' +
      '<p class="dossier-intro">Asigna valor solo a las señales que usarías para defender tu conclusión.</p>' +
      '<div class="evidence-list">' + evidence.map(evidenceCard).join('') + '</div></aside>';
  }

  function confidenceHtml() {
    return '<section class="confidence-panel"><div><span class="micro-label">Tu nivel de compromiso</span><h3>¿Cuánto sostendrías esta lectura?</h3></div><div class="confidence-options" role="radiogroup">' + CONF_ORDER.map(function (value) {
      return '<button type="button" role="radio" aria-checked="' + (state.confidence === value) + '" class="confidence-choice ' + (state.confidence === value ? 'is-active' : '') + '" data-confidence="' + value + '"><span></span>' + CONF_LABEL[value] + '</button>';
    }).join('') + '</div></section>';
  }

  function optionHtml(option) {
    var id = typeof option === 'string' ? option : option.id;
    var text = typeof option === 'string' ? categoryLabel(option) : (option.text || option.label || categoryLabel(option.id));
    return '<button type="button" class="theory-card ' + (state.selection === id ? 'is-active' : '') + '" data-option="' + esc(id) + '" aria-pressed="' + (state.selection === id) + '"><span class="theory-card__mark"></span><span>' + esc(human(text)) + '</span></button>';
  }

  function decisionHtml(step) {
    var options = step.options || [];
    var meta = phaseMeta(step);
    var hasOptions = options.length > 0;
    var isHypothesis = step.kind === 'hypothesis';
    var weighted = Object.keys(state.evidenceWeights).some(function (key) { return state.evidenceWeights[key]; });
    var ready = hasOptions ? Boolean(state.selection && state.confidence) : Boolean(weighted || state.confidence);
    var buttonLabel = step.id === 'revise' ? 'Registrar mi revisión' : isHypothesis ? 'Presentar mi lectura' : 'Registrar hallazgo';
    var optionsBlock = hasOptions
      ? '<div class="theory-list">' + options.map(optionHtml).join('') + '</div>'
      : '<div class="inspection-instruction"><span class="inspection-symbol">⌖</span><div><strong>Trabaja directamente sobre las pistas</strong><p>Examina el objeto y asigna valor a la evidencia que merece entrar en tu teoría.</p></div></div>';
    return '<section class="decision-panel"><span class="micro-label">' + esc(meta[0]) + '</span><h2>' + esc(human(step.prompt || meta[1])) + '</h2><p class="decision-brief">' + esc(meta[1]) + '</p>' + optionsBlock +
      confidenceHtml() +
      '<details class="field-notes"><summary>Añadir una nota privada <span>opcional</span></summary><textarea id="justification" rows="3" placeholder="Anota una duda, una condición o aquello que buscarías para cambiar de opinión.">' + esc(state.justification) + '</textarea></details>' +
      '<button class="primary-action" id="submitDecision" ' + (ready ? '' : 'disabled') + '><span>' + buttonLabel + '</span><i>→</i></button><p class="action-note">La evaluación ocurre en servidor y tu decisión queda registrada como parte del expediente.</p></section>';
  }

  function mentorHtml() {
    if (!state.mentorNotes.length) return '';
    var note = state.mentorNotes[state.mentorNotes.length - 1];
    return '<aside class="mentor-note"><span class="mentor-note__icon ep-icon ep-icon--mentor" aria-hidden="true"></span><div><span class="micro-label">Nota del analista</span><strong>' + esc(categoryLabel(note.category)) + '</strong><p>' + esc(human(note.text)) + '</p></div></aside>';
  }

  function caseBrief() {
    var data = state.caseData || {};
    return human(data.brief || (cfg.lab === 'label' ? 'Determina qué afirma el documento y qué sigue siendo una inferencia.' : 'Determina qué puede defenderse observando esta botella.'));
  }

  function bindCommon() {
    app.querySelectorAll('[data-weight-for]').forEach(function (button) {
      button.onclick = function () {
        var id = button.getAttribute('data-weight-for');
        var weight = button.getAttribute('data-weight');
        var normalized = cfg.lab === 'label' ? { contextual: 'secondary', relevant: 'relevant', decisive: 'key' }[weight] : weight;
        state.evidenceWeights[id] = state.evidenceWeights[id] === normalized ? null : normalized;
        stepView();
      };
    });
    app.querySelectorAll('[data-option]').forEach(function (button) {
      button.onclick = function () { state.selection = button.getAttribute('data-option'); stepView(); };
    });
    app.querySelectorAll('[data-confidence]').forEach(function (button) {
      button.onclick = function () { state.confidence = button.getAttribute('data-confidence'); stepView(); };
    });
    app.querySelectorAll('[data-focus-evidence]').forEach(function (button) {
      button.onclick = function () {
        var target = document.getElementById('evidence-' + button.getAttribute('data-focus-evidence'));
        if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.classList.add('is-focused'); setTimeout(function () { target.classList.remove('is-focused'); }, 900); }
      };
    });
    var notes = document.getElementById('justification');
    if (notes) notes.oninput = function () { state.justification = notes.value; };
  }

  function stepView() {
    var step = state.step;
    if (!step) return recoveryView('Este expediente ya no tiene una fase activa.');
    var pending = pendingContradiction(step);
    if (pending) return contradictionView(step, pending);
    (step.evidence || []).forEach(function (item) {
      state.evidenceCatalog[item.id] = { label: item.label, value: item.value, category: item.category || item.signal_type || '' };
    });
    chip.textContent = cfg.shortTitle + ' · ' + phaseMeta(step)[0];
    app.innerHTML = '<div class="case-shell"><header class="case-header"><div><span class="eyebrow">' + esc(cfg.kicker) + '</span><h1>' + esc(cfg.title) + '</h1><p>' + esc(caseBrief()) + '</p></div>' + progressHtml() + '</header>' +
      '<div class="investigation-grid"><section class="artifact-stage">' + artifactHtml(Object.keys(state.evidenceCatalog).map(function (id) { return Object.assign({ id: id }, state.evidenceCatalog[id]); })) + mentorHtml() + '</section>' + dossierHtml() + decisionHtml(step) + '</div></div>';
    bindCommon();
    var submitButton = document.getElementById('submitDecision');
    if (submitButton) submitButton.onclick = submitCurrent;
  }

  function pendingContradiction(step) {
    var prior = state.commitments[state.commitments.length - 1] || null;
    if (!prior || state.contradictionResolvedStepId === step.id) return null;
    var fresh = (step.evidence || []).filter(function (item) { return !(item.id in state.evidenceCatalog); });
    return fresh.length ? { priorCommit: prior, newEvidence: fresh } : null;
  }

  function contradictionView(step, pending) {
    chip.textContent = cfg.shortTitle + ' · Punto de giro';
    var interpretation = Object.keys(CONTRADICTION_INTERP).map(function (key) {
      return '<button class="turn-choice ' + (state.contradictionInterp === key ? 'is-active' : '') + '" data-interp="' + key + '">' + CONTRADICTION_INTERP[key] + '</button>';
    }).join('');
    var actions = state.contradictionInterp ? '<div class="turn-actions"><span class="micro-label">Tu decisión</span>' + Object.keys(REVISION_ACTION).map(function (key) {
      return '<button class="turn-choice ' + (state.contradictionAction === key ? 'is-active' : '') + '" data-action="' + key + '">' + REVISION_ACTION[key] + '</button>';
    }).join('') + '</div>' : '';
    app.innerHTML = '<div class="turning-point"><span class="turning-point__signal">NUEVA EVIDENCIA</span><h1>Tu teoría acaba de ser puesta a prueba</h1><p>Una investigación sólida no protege su primera idea: comprueba si todavía merece sostenerse.</p><div class="turning-comparison"><article><span>Lectura anterior</span><strong>' + esc(human(pending.priorCommit.hypothesis_text)) + '</strong></article><div class="turning-arrow">→</div><article class="is-new"><span>Hallazgo nuevo</span>' + pending.newEvidence.map(function (item) { return '<strong>' + esc(item.label) + '</strong><small>' + esc(item.value) + '</small>'; }).join('') + '</article></div><section class="turn-question"><span class="micro-label">Interpreta el cambio</span><h2>¿Qué hace esta evidencia con tu lectura?</h2><div class="turn-options">' + interpretation + '</div>' + actions + '<button class="primary-action" id="continueTurn" ' + (state.contradictionAction ? '' : 'disabled') + '><span>Volver al expediente</span><i>→</i></button></section></div>';
    app.querySelectorAll('[data-interp]').forEach(function (button) { button.onclick = function () { state.contradictionInterp = button.getAttribute('data-interp'); state.contradictionAction = null; contradictionView(step, pending); }; });
    app.querySelectorAll('[data-action]').forEach(function (button) { button.onclick = function () { state.contradictionAction = button.getAttribute('data-action'); contradictionView(step, pending); }; });
    document.getElementById('continueTurn').onclick = function () {
      state.contradictionResolvedStepId = step.id;
      state.pendingRevisionMeta = { interpretation: state.contradictionInterp, action: state.contradictionAction, prior_hypothesis: pending.priorCommit.hypothesis_text, new_evidence_ids: pending.newEvidence.map(function (item) { return item.id; }) };
      state.contradictionInterp = null;
      state.contradictionAction = null;
      stepView();
    };
  }

  function addCommitment() {
    if (state.step.kind !== 'hypothesis' || !state.selection) return;
    var chosen = (state.step.options || []).find(function (option) { return (typeof option === 'string' ? option : option.id) === state.selection; });
    var text = chosen ? (typeof chosen === 'string' ? categoryLabel(chosen) : (chosen.text || chosen.label || chosen.id)) : state.selection;
    var snapshot = { step_id: state.step.id, hypothesis: state.selection, hypothesis_text: text, confidence: state.confidence, evidence_weights: Object.assign({}, state.evidenceWeights), committed_at: new Date().toISOString() };
    if (state.pendingRevisionMeta) { snapshot.revision = state.pendingRevisionMeta; state.pendingRevisionMeta = null; }
    var latest = state.commitments[state.commitments.length - 1];
    if (latest && latest.step_id === snapshot.step_id && latest.hypothesis === snapshot.hypothesis && latest.confidence === snapshot.confidence) return;
    state.commitments.push(snapshot);
  }

  function submitCurrent() {
    if (state.busy) return;
    addCommitment();
    submit();
  }

  async function api(path, body) {
    if (!navigator.onLine) throw new Error('OFFLINE');
    var token = await getAuthToken();
    if (!token) throw new Error('NO_AUTH_SESSION');
    var response = await fetch(API + path, { method: 'POST', cache: 'no-store', headers: { Authorization: 'Bearer ' + token, apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    var data = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(data.error || 'REQUEST_FAILED');
    return data;
  }

  function requestKey() {
    var key = sessionStorage.getItem(cfg.requestKey);
    if (!key) { key = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random(); sessionStorage.setItem(cfg.requestKey, key); }
    return key;
  }

  function newRequestKey() {
    var key = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + '-' + Math.random();
    sessionStorage.setItem(cfg.requestKey, key);
    return key;
  }

  function loading(message) {
    chip.textContent = cfg.shortTitle + ' · Analizando';
    app.innerHTML = '<div class="lab-loading"><div class="lab-loading__scanner"><span></span></div><span class="eyebrow">Expediente en curso</span><h1>' + esc(message) + '</h1><p>Tu progreso permanece protegido mientras verificamos la siguiente fase.</p></div>';
  }

  function resetState() {
    state.session = null; state.step = null; state.progress = { current: 1, total: 1 }; state.caseData = null;
    state.selection = ''; state.evidenceWeights = {}; state.confidence = ''; state.justification = ''; state.busy = false;
    state.evaluations = []; state.commitments = []; state.evidenceCatalog = {}; state.contradictionInterp = null;
    state.contradictionAction = null; state.contradictionResolvedStepId = null; state.pendingRevisionMeta = null; state.mentorNotes = []; state.completed = false;
  }

  async function startAnotherCase() {
    resetState(); newRequestKey(); loading('Abriendo un expediente nuevo…'); await beginSession();
  }

  async function beginSession() {
    try {
      var data = await api(cfg.startEndpoint, { request_key: requestKey() });
      state.session = data.session_id;
      state.step = data.step;
      state.progress = data.progress || state.progress;
      state.caseData = data.case || state.caseData;
      if (!data.step && ['reveal_available', 'completed'].indexOf(data.state) >= 0) return reveal();
      if (!data.step) return recoveryView('El expediente anterior ya fue cerrado.');
      if (window.EpistemicProfile) window.EpistemicProfile.startSession({ module: cfg.module, mode: 'server', competencies: [cfg.shortTitle] });
      stepView();
    } catch (error) {
      if (error.message === 'NO_AUTH_SESSION') return authRequired();
      if (error.message === 'OFFLINE') return recoveryView('Estás sin conexión.');
      recoveryView('No pudimos recuperar el expediente.');
    }
  }

  async function submit() {
    if (state.busy) return;
    state.busy = true;
    loading('Contrastando tu decisión con la evidencia…');
    var usedIds = Object.keys(state.evidenceWeights).filter(function (id) { return state.evidenceWeights[id]; });
    var answer = { response: state.selection || 'cannot_determine', evidence_used: usedIds, evidence_weights: state.evidenceWeights, justification: state.justification, confidence: state.confidence || 'cannot_determine' };
    try {
      var data = await api(cfg.submitEndpoint, { session_id: state.session, idempotency_key: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), step_key: state.step.id, step_kind: state.step.kind, answer: answer });
      if (state.step.kind === 'hypothesis' && data.evaluation) state.evaluations.push(data.evaluation);
      var feedback = data.evaluation && data.evaluation.mentor_feedback;
      if (feedback && feedback.text && feedback.category !== 'confirmation') {
        var previous = state.mentorNotes[state.mentorNotes.length - 1];
        if (!previous || previous.text !== feedback.text) state.mentorNotes.push(feedback);
      }
      if (window.EpistemicProfile && data.evaluation) window.EpistemicProfile.decisionMade({ itemId: state.session, phaseId: state.step.id, response: data.evaluation.result && data.evaluation.result.band, correctnessBand: data.evaluation.result && data.evaluation.result.band, confidence: state.confidence, competency: cfg.shortTitle });
      if (data.step) {
        var nextOptions = data.step.options || [];
        var selectionStillExists = nextOptions.some(function (option) { return (typeof option === 'string' ? option : option.id) === state.selection; });
        state.step = data.step;
        state.progress = data.progress || { current: state.progress.current + 1, total: state.progress.total };
        if (!selectionStillExists) state.selection = '';
        state.justification = '';
        state.busy = false;
        stepView();
      } else {
        state.progress = data.progress || state.progress;
        state.busy = false;
        reveal();
      }
    } catch (error) {
      state.busy = false;
      recoveryView(error.message === 'OFFLINE' ? 'La conexión se interrumpió antes de guardar.' : 'No pudimos registrar esta decisión.', submitCurrent);
    }
  }

  function unique(array) {
    return array.filter(function (value, index) { return value && array.indexOf(value) === index; });
  }

  function evidenceNames(ids) {
    return unique(ids || []).map(function (id) { return state.evidenceCatalog[id] ? state.evidenceCatalog[id].label : human(id); });
  }

  function buildRevealBoard() {
    var selected = [], ignored = [], over = [];
    var latest = state.evaluations[state.evaluations.length - 1] || {};
    var evidence = latest.evidence || {};
    selected = evidence.selected || [];
    ignored = evidence.ignored || [];
    over = evidence.overweighted || [];
    selected = evidenceNames(selected);
    ignored = evidenceNames(ignored);
    over = evidenceNames(over);
    var calibration = latest && latest.calibration ? CALIBRATION_LABEL[latest.calibration.band] : '';
    return '<section class="resolution-section"><div class="resolution-section__head"><span class="micro-label">Mapa de evidencia</span><h2>Qué sostuvo realmente tu decisión</h2></div><div class="resolution-columns">' +
      '<article class="resolution-card is-supported"><span>Bien utilizada</span><p>' + esc(selected.join(' · ') || 'No registraste evidencia como soporte principal.') + '</p></article>' +
      (over.length ? '<article class="resolution-card is-warning"><span>Sobreponderada</span><p>' + esc(over.join(' · ')) + '</p></article>' : '') +
      '<article class="resolution-card"><span>Quedó fuera</span><p>' + esc(ignored.join(' · ') || 'No quedó evidencia relevante sin revisar.') + '</p></article></div>' +
      (calibration ? '<div class="calibration-result"><span class="calibration-result__dial"></span><div><strong>Calibración</strong><p>' + esc(calibration) + '</p></div></div>' : '') + '</section>';
  }

  function buildReasoningReplay() {
    var filtered = state.commitments.filter(function (commitment, index, list) {
      if (!index) return true;
      var previous = list[index - 1];
      return commitment.hypothesis_text !== previous.hypothesis_text || commitment.confidence !== previous.confidence || commitment.revision;
    });
    if (!filtered.length) return '<p class="muted">La sesión no incluyó una teoría estructurada.</p>';
    return '<section class="resolution-section"><div class="resolution-section__head"><span class="micro-label">Reconstrucción</span><h2>Cómo evolucionó tu lectura</h2></div><div class="reasoning-path">' + filtered.map(function (commitment, index) {
      var label = commitment.revision ? 'Revisión' : index === 0 ? 'Primera teoría' : 'Actualización';
      return '<article class="reasoning-node ' + (commitment.revision ? 'is-revision' : '') + '"><span>' + label + '</span><strong>' + esc(human(commitment.hypothesis_text)) + '</strong><small>Confianza: ' + esc(CONF_LABEL[commitment.confidence] || human(commitment.confidence)) + '</small></article>';
    }).join('<div class="reasoning-connector">→</div>') + '</div></section>';
  }

  function revealView() {
    var revealData = state.revealData || {};
    chip.textContent = cfg.shortTitle + ' · Expediente resuelto';
    var sections = [
      ['Qué ocurrió', revealData.layer1],
      ['Tu lectura', revealData.layer2],
      ['Uso de evidencia', revealData.layer3],
      ['Regla transferible', revealData.layer4]
    ].filter(function (entry) { return entry[1]; });
    app.innerHTML = '<div class="resolution-shell"><header class="resolution-hero"><div><span class="eyebrow">Expediente cerrado</span><h1>La evidencia ya puede hablar</h1><p>' + esc(caseBrief()) + '</p></div><div class="resolution-seal"><span>CASO</span><strong>RESUELTO</strong></div></header><div class="resolution-overview"><div>' + artifactHtml(Object.keys(state.evidenceCatalog).map(function (id) { return Object.assign({ id: id }, state.evidenceCatalog[id]); }), false) + '</div><div class="resolution-story">' + sections.map(function (entry, index) { return '<article><span>0' + (index + 1) + '</span><div><strong>' + esc(entry[0]) + '</strong><p>' + esc(human(entry[1])) + '</p></div></article>'; }).join('') + '</div></div>' + buildRevealBoard() + buildReasoningReplay() + '<div class="resolution-actions"><button class="primary-action" id="startTransfer"><span>Abrir el caso de transferencia</span><i>→</i></button><a class="secondary-action" href="/dashboard/">Volver al Dashboard</a><button class="secondary-action" id="anotherCase">Nuevo expediente</button></div></div>';
    document.getElementById('startTransfer').onclick = transferStart;
    document.getElementById('anotherCase').onclick = startAnotherCase;
  }

  async function reveal() {
    loading('Cerrando el expediente…');
    try {
      var data = await api(cfg.revealEndpoint, { session_id: state.session });
      state.revealData = data.reveal || {};
      state.completed = true;
      if (window.EpistemicProfile) window.EpistemicProfile.sessionCompleted({ module: cfg.module, itemId: state.session });
      revealView();
    } catch (error) { recoveryView('El expediente todavía no puede cerrarse.'); }
  }

  function firstMisconceptionHint() {
    for (var index = 0; index < state.evaluations.length; index += 1) {
      var mentor = state.evaluations[index] && state.evaluations[index].mentor;
      if (mentor && mentor.misconception_code) return mentor.misconception_code;
    }
    return null;
  }

  async function transferStart() {
    loading('Preparando una contraprueba en otro contexto…');
    try {
      var data = await api(cfg.transferStartEndpoint, { misconception_hint: firstMisconceptionHint(), session_id: state.session });
      transferView(data.task, null);
    } catch (error) { recoveryView('No pudimos abrir el caso de transferencia.'); }
  }

  function transferView(task, result) {
    chip.textContent = cfg.shortTitle + ' · Caso de transferencia';
    var evidence = (task.relevant_evidence || []).map(function (item, index) { return Object.assign({ index: String(index + 1).padStart(2, '0') }, item); });
    var options = (task.options || []).map(function (option) { return '<button class="theory-card" data-transfer-option="' + esc(option.id) + '" ' + (result ? 'disabled' : '') + '><span class="theory-card__mark"></span><span>' + esc(human(option.text)) + '</span></button>'; }).join('');
    var outcome = result ? '<section class="transfer-outcome ' + (result.correct ? 'is-correct' : 'is-rethink') + '"><span class="micro-label">' + (result.correct ? 'Patrón reconocido' : 'Revisa el patrón') + '</span><h2>' + (result.correct ? 'Trasladaste la regla a un contexto nuevo' : 'La conclusión necesita otra lectura') + '</h2><p>' + esc(human(result.feedback)) + '</p>' + (result.rule ? '<div class="transfer-rule"><strong>Regla que acabas de poner a prueba</strong><p>' + esc(human(result.rule)) + '</p></div>' : '') + '</section>' : '';
    app.innerHTML = '<div class="transfer-shell"><header><span class="eyebrow">Cold case · Transferencia</span><h1>La misma estructura, otra apariencia</h1><p>' + esc(human(task.new_context)) + '</p></header><div class="transfer-grid"><section><span class="micro-label">Nuevas pistas</span><div class="evidence-list">' + evidence.map(transferEvidenceCard).join('') + '</div></section><section class="decision-panel"><span class="micro-label">Tu decisión</span><h2>¿Qué lectura resiste mejor esta evidencia?</h2><div class="theory-list">' + options + '</div></section></div>' + outcome + (result ? '<div class="resolution-actions"><button class="primary-action" id="anotherCase"><span>Abrir otro expediente</span><i>→</i></button><a class="secondary-action" href="/dashboard/">Volver al Dashboard</a><button class="secondary-action" id="backResolution">Revisar mi expediente</button></div>' : '') + '</div>';
    app.querySelectorAll('[data-transfer-option]').forEach(function (button) { button.onclick = function () { transferSubmit(task, button.getAttribute('data-transfer-option')); }; });
    if (result) {
      document.getElementById('anotherCase').onclick = startAnotherCase;
      document.getElementById('backResolution').onclick = revealView;
    }
  }

  async function transferSubmit(task, optionId) {
    loading('Contrastando la transferencia…');
    try { var data = await api(cfg.transferSubmitEndpoint, { task_id: task.id, option_id: optionId }); transferView(task, data); }
    catch (error) { recoveryView('No pudimos evaluar la transferencia.'); }
  }

  function recoveryView(message, retry) {
    chip.textContent = cfg.shortTitle + ' · Recuperación';
    app.innerHTML = '<div class="recovery-card"><span class="eyebrow">El expediente está a salvo</span><h1>' + esc(message) + '</h1><p>' + (retry ? 'Tu decisión sigue en esta pantalla y puedes intentar guardarla otra vez.' : 'No necesitas repetir el mismo intento. Puedes abrir un expediente nuevo o volver a tu panel.') + '</p><div class="resolution-actions">' + (retry ? '<button class="primary-action" id="retryAction"><span>Reintentar guardado</span><i>→</i></button>' : '<button class="primary-action" id="recoverNew"><span>Abrir un expediente nuevo</span><i>→</i></button>') + '<a class="secondary-action" href="/dashboard/">Volver al Dashboard</a></div></div>';
    var recoverNew = document.getElementById('recoverNew');
    if (recoverNew) recoverNew.onclick = startAnotherCase;
    var retryAction = document.getElementById('retryAction');
    if (retryAction) retryAction.onclick = retry;
  }

  function authRequired() {
    chip.textContent = cfg.shortTitle + ' · Acceso';
    app.innerHTML = '<div class="recovery-card"><span class="eyebrow">Archivo reservado</span><h1>Inicia sesión para abrir un expediente completo</h1><p>La demo muestra la mecánica. Una cuenta activa permite guardar decisiones, calibración y transferencia.</p><div class="resolution-actions"><a class="primary-action" href="/login/?next=/' + cfg.route + '/"><span>Entrar para investigar</span><i>→</i></a><a class="secondary-action" href="/">Volver al inicio</a></div></div>';
  }

  function publicDemo() {
    chip.textContent = 'Demo interactiva · sin progreso';
    var demoEvidence = cfg.lab === 'label'
      ? [{ id: 'demo-origin', label: 'Origen', value: 'Valle Central' }, { id: 'demo-year', label: 'Añada', value: '2022' }, { id: 'demo-variety', label: 'Variedad', value: 'No declarada' }]
      : [{ id: 'demo-cage', label: 'Morrión', value: 'Presente y tensado' }, { id: 'demo-glass', label: 'Vidrio', value: 'Verde muy oscuro' }, { id: 'demo-weight', label: 'Peso', value: 'Mayor de lo habitual' }];
    app.innerHTML = '<div class="demo-shell"><header><span class="eyebrow">Prueba de campo</span><h1>' + esc(cfg.title) + '</h1><p>' + esc(cfg.demoBrief) + '</p></header><div class="demo-grid"><section>' + artifactHtml(demoEvidence) + '</section><section class="demo-investigation"><span class="micro-label">Tres pistas · una conclusión prudente</span><h2>¿Qué merece entrar en tu teoría?</h2><p>Explora las marcas y abre cada pista. El objetivo no es adivinar: es separar evidencia de intuición.</p><div class="demo-clues">' + demoEvidence.map(function (item, index) { return '<button data-demo-clue="' + index + '"><span>0' + (index + 1) + '</span><strong>' + esc(item.label) + '</strong><small>Examinar</small></button>'; }).join('') + '</div><div class="demo-finding" id="demoFinding">Selecciona una pista para empezar.</div><a class="primary-action" href="/login/?next=/' + cfg.route + '/"><span>Abrir un caso completo</span><i>→</i></a></section></div></div>';
    var messages = cfg.lab === 'label'
      ? ['Es información explícita: puedes citarla.', 'Es un dato visible, pero por sí solo explica poco.', 'La ausencia es evidencia de un límite, no de mala fe.']
      : ['Confirma presión interna significativa.', 'Protege de la luz; no demuestra edad.', 'Puede ser marketing o construcción: no es una señal diagnóstica.'];
    app.querySelectorAll('[data-demo-clue]').forEach(function (button) { button.onclick = function () { document.getElementById('demoFinding').textContent = messages[Number(button.getAttribute('data-demo-clue'))]; }; });
    app.querySelectorAll('[data-focus-evidence]').forEach(function (button, index) { button.onclick = function () { document.getElementById('demoFinding').textContent = messages[index] || messages[0]; }; });
  }

  async function start() {
    publicDemo();
    try { if (await getAuthToken()) { loading('Recuperando tu expediente…'); await beginSession(); } }
    catch (_) { publicDemo(); }
  }

  window.addEventListener('online', setNetwork);
  window.addEventListener('offline', setNetwork);
  setNetwork();
  window.InvestigationLabTest = { human: human, phaseMeta: phaseMeta, buildRevealBoard: buildRevealBoard, buildReasoningReplay: buildReasoningReplay };
  start();
})();
