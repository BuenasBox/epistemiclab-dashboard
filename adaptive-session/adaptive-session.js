'use strict';

/* ---- State ---- */
const STATE = {
  payload:    null,
  satPayload: null,
  satWineIdx: 0,
  screen:     0,
  qIdx:       0,
  selected:   null,
  confirmed:  false,
  attempts:   [],
  sessionId:  new Date().toISOString(),
};
const ADAPTIVE_REQUEST_TIMEOUT_MS = 15000;

async function adaptiveFetch(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ADAPTIVE_REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...(options || {}), signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timer);
  }
}

function localizedDifficulty(value) {
  const key = String(value || '').trim().toLowerCase();
  return {
    foundation: 'Fundamento', beginner: 'Inicial', intermediate: 'Intermedio',
    advanced: 'Avanzado', expert: 'Experto',
  }[key] || value || '—';
}

function localizedTopic(value) {
  const raw = String(value || '').trim();
  if (!raw || /^RA\d(?:\s*\/.*)?$/i.test(raw)) return raw || '—';
  const terms = {ageing:'crianza',vessel:'recipiente',comparison:'comparación',biological:'biológica',vs:'frente a',oxidative:'oxidativa',canada:'Canadá',icewine:'vino de hielo',acidity:'acidez',cost:'coste',fermentation:'fermentación',harvest:'cosecha',style:'estilo',variety:'variedad',drying:'secado',airflow:'flujo de aire',fortification:'fortificación',extraction:'extracción',port:'Oporto',sherry:'Jerez',volume:'volumen',fortified:'fortificados',wines:'vinos',germany:'Alemania',selection:'selección',concentration:'concentración',risk:'riesgo',press:'prensado',yield:'rendimiento',label:'etiqueta',law:'normativa',late:'tardía',colour:'color',aroma:'aroma',timing:'momento',heat:'calor',stability:'estabilidad',quality:'calidad',method:'método',cooling:'enfriamiento',influence:'influencia',early:'temprana',old:'vieja',oak:'madera',raisining:'pasificación',skin:'hollejos',contact:'contacto',warm:'cálida',young:'joven',blend:'mezcla',aged:'envejecido',youthful:'juvenil',maturation:'maduración',bottle:'botella',price:'precio',factors:'factores',acid:'acidez',morning:'matinal',mist:'niebla',balance:'equilibrio',selective:'selectiva',picking:'vendimia',vintage:'añada',transition:'transición',freshness:'frescura',first:'primera',classification:'clasificación',conditions:'condiciones',protection:'protección',consistency:'consistencia',overdraw:'extracción excesiva',sparkling:'espumosos',still:'tranquilos',storage:'conservación',and:'y',service:'servicio',readiness:'preparación',sweet:'dulce',must:'mosto',open:'abierta',pairing:'maridaje',blue:'azul',cheese:'queso',dessert:'postre',portion:'porción',temperature:'temperatura',addition:'adición',viticulture:'viticultura',wine:'vino',food:'gastronomía',winemaking:'vinificación'};
  const label = raw.split('_').map(part => terms[part.toLowerCase()] || part).join(' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function setAdaptiveStatus(message, state) {
  const status = $('adp-status');
  const loading = state === 'loading';
  document.querySelectorAll('.adp-btn').forEach(button => { button.disabled = loading; });
  if (!status) return;
  status.textContent = message || '';
  status.className = 'adp-status' + (message ? ' show' : '') + (state === 'error' ? ' error' : '');
}

function setAnswerStatus(message) {
  const status = $('answer-status');
  if (!status) return;
  status.textContent = message || '';
  status.classList.toggle('show', !!message);
}

/* ---- Challenge type labels ---- */
const CHALLENGE_LABELS = {
  theory_foundation: 'Teoría',
  recall:            'Memoria',
  reasoning:         'Razonamiento',
  causal_chain:      'Cadena causal',
  misconception_repair: 'Reparación',
  challenge:         'Desafío',
  comparison:        'Comparación',
};

const CHALLENGE_CSS = {
  theory_foundation: 'cb-recall',
  recall:            'cb-recall',
  reasoning:         'cb-reasoning',
  causal_chain:      'cb-causal_chain',
  misconception_repair: 'cb-misconception_rep',
  challenge:         'cb-challenge',
  comparison:        'cb-comparison',
};

const CORRECT_PERFORMANCE = {
  recall:            'concepto asentado',
  reasoning:         'razonamiento sólido',
  causal_chain:      'cadena causal conectada',
  misconception_repair: 'patrón corregido',
  challenge:         'nivel desafío superado',
  comparison:        'comparación precisa',
};

const INCORRECT_PERFORMANCE = {
  recall:            'requiere refuerzo',
  reasoning:         'falta conectar la lógica',
  causal_chain:      'cadena causal incompleta',
  misconception_repair: 'idea errónea activa',
  challenge:         'zona de desarrollo identificada',
  comparison:        'comparación requiere revisión',
};

/* ---- DOM helpers ---- */
function $(id) { return document.getElementById(id); }

function el(tag, attrs, ...children) {
  const e = document.createElement(tag);
  if (attrs) {
    if (attrs.class) e.className = attrs.class;
    if (attrs.id)    e.id = attrs.id;
    Object.entries(attrs).forEach(([k, v]) => {
      if (k !== 'class' && k !== 'id') e.setAttribute(k, v);
    });
  }
  children.forEach(c => {
    if (c == null) return;
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  });
  return e;
}

function txt(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.textContent = text;
  return e;
}

/* ---- Screen transitions ---- */
function showScreen(n) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = $(`screen-${n}`);
  STATE.screen = n;
  // Scroll to top before making it active
  screen.scrollTop = 0;
  requestAnimationFrame(() => screen.classList.add('active'));
}

/* ---- Chip factories ---- */
function makeChips(items, cls) {
  const wrap = el('div', { class: 'cs-chips' });
  if (!items || items.length === 0) {
    wrap.appendChild(txt('span', 'cs-empty', '—'));
    return wrap;
  }
  items.forEach(item => {
    const c = txt('span', `chip ${cls}`, item);
    wrap.appendChild(c);
  });
  return wrap;
}

/* ---- Screen 0: Mission Briefing ---- */
function renderScreen0() {
  const p = STATE.payload;
  const b = p.mission_briefing;
  const container = $('s0-content');
  container.innerHTML = '';

  // Header
  const hdr = el('div', { class: 's0-header' });
  hdr.appendChild(txt('div', 's0-eyebrow', 'Sesión Adaptativa'));
  hdr.appendChild(txt('div', 's0-title', 'MISIÓN DE ENTRENAMIENTO'));
  const modeBadge = txt('div', 's0-mode-badge', p.session_mode);
  hdr.appendChild(modeBadge);
  container.appendChild(hdr);

  // Cognitive state grid
  const grid = el('div', { class: 'cs-grid' });

  const cards = [
    { label: 'Áreas fuertes',    items: b.strong_areas,        labelCls: 'cs-card-label-green',  chipCls: 'chip-green'  },
    { label: 'Áreas débiles',    items: b.weak_areas,          labelCls: 'cs-card-label-amber',  chipCls: 'chip-amber'  },
    { label: 'Ideas erróneas',   items: b.active_misconceptions, labelCls: 'cs-card-label-red',   chipCls: 'chip-red'    },
    { label: 'Brechas causales', items: b.causal_gaps,         labelCls: 'cs-card-label-purple', chipCls: 'chip-purple' },
  ];

  cards.forEach(({ label, items, labelCls, chipCls }) => {
    const card = el('div', { class: 'cs-card' });
    card.appendChild(txt('div', `cs-card-label ${labelCls}`, label));
    card.appendChild(makeChips(items, chipCls));
    grid.appendChild(card);
  });
  container.appendChild(grid);

  // Objective block
  const obj = el('div', { class: 'objective-block' });
  obj.appendChild(txt('div', 'objective-label', 'Objetivo de sesión'));
  obj.appendChild(txt('div', 'objective-text', b.session_objective));
  container.appendChild(obj);

  // Meta row
  const meta = el('div', { class: 's0-meta' });
  const count = el('div', { class: 's0-meta-count' });
  count.innerHTML = `<strong>${p.questions.length}</strong> retos · modo <strong>${p.session_mode}</strong>`;
  meta.appendChild(count);
  const tbType = b.training_type || 'refuerzo';
  const tbCls = `training-badge tb-${tbType}`;
  const tbLabel = { diagnostico: 'DIAGNÓSTICO', refuerzo: 'REFUERZO' }[tbType] || tbType.toUpperCase();
  meta.appendChild(txt('span', tbCls, tbLabel));
  container.appendChild(meta);

  // Start button
  const startBtn = el('button', { class: 'btn btn-primary', onclick: 'startMission()' });
  startBtn.textContent = 'INICIAR MISIÓN';
  container.appendChild(startBtn);
}

/* ---- Start mission ---- */
function startMission() {
  if (!STATE.payload || STATE.payload.questions.length === 0) return;
  STATE.qIdx = 0;
  STATE.attempts = [];
  STATE.selected = null;
  STATE.confirmed = false;
  renderQuestion();
  showScreen(1);
}

/* ---- Screen 1: Question rendering ---- */
function renderQuestion() {
  setAnswerStatus('');
  const p = STATE.payload;
  const q = p.questions[STATE.qIdx];
  const total = p.questions.length;

  // Progress bar
  $('progress-fill').style.width = `${(STATE.qIdx / total) * 100}%`;

  // Header
  const hdr = $('q-header');
  hdr.innerHTML = '';
  hdr.appendChild(txt('span', 'q-ra', q.ra_id || 'RA?'));
  hdr.appendChild(txt('span', 'q-sep', '·'));
  hdr.appendChild(txt('span', 'q-topic', q.topic || ''));
  hdr.appendChild(txt('span', 'q-sep', '·'));
  const cbCls = `challenge-badge ${CHALLENGE_CSS[q.challenge_type] || 'cb-recall'}`;
  hdr.appendChild(txt('span', cbCls, CHALLENGE_LABELS[q.challenge_type] || q.challenge_type));
  const counter = txt('span', 'q-counter', `${STATE.qIdx + 1} / ${total}`);
  hdr.appendChild(counter);

  // Stem
  $('q-stem').textContent = q.stem || '';

  // Options
  const wrap = $('options-wrap');
  wrap.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  letters.forEach(letter => {
    const text = (q.options || {})[letter];
    if (!text) return;
    const btn = el('button', {
      class: 'option-btn',
      'data-letter': letter,
    });
    btn.addEventListener('click', () => selectOption(letter));
    btn.appendChild(txt('span', 'option-letter', letter));
    const optTxt = document.createElement('span');
    optTxt.textContent = text;
    btn.appendChild(optTxt);
    wrap.appendChild(btn);
  });

  // Reset continue button
  const cont = $('btn-continue');
  cont.hidden = true;
  cont.disabled = false;
  cont.textContent = 'CONFIRMAR RESPUESTA';

  STATE.selected = null;
  STATE.confirmed = false;
}

function selectOption(letter) {
  if (STATE.confirmed) return;
  STATE.selected = letter;

  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.classList.remove('selected');
    if (btn.getAttribute('data-letter') === letter) {
      btn.classList.add('selected');
    }
  });

  $('btn-continue').hidden = false;
}

/* ---- Confirm and go to feedback ---- */
async function confirmAnswer() {
  if (!STATE.selected || STATE.confirmed) return;
  STATE.confirmed = true;
  $('btn-continue').disabled = true;
  setAnswerStatus('');

  const q = STATE.payload.questions[STATE.qIdx];
  let correct = false;
  try {
    const token = await requireAuth();
    const resp = await adaptiveFetch('https://hylknjjhmxsuuwbsslkr.supabase.co/functions/v1/validate-sba-answer', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: q.question_id,
        selected_letter: STATE.selected,
        mode: 'mentor',
        session_mode: STATE.payload.api_mode
      })
    });
    if (!resp.ok) throw new Error('validate-sba-answer status: ' + resp.status);
    const result = await resp.json();
    if (!/^[A-D]$/.test(result.correct_letter || '')) throw new Error('Invalid validation response');
    correct = !!result.correct;
    q.correct_answer = result.correct_letter || null;
    q.feedback = {
      explanation: typeof result.feedback === 'string'
        ? result.feedback
        : (result.feedback && result.feedback.explanation) ||
          `La respuesta correcta es ${result.correct_letter || '—'}.`
    };
    q.causal_chain = result.causal_chain || null;
    q.micro_drill = result.micro_drill || null;
  } catch (error) {
    console.error('Unable to validate adaptive answer:', error);
    STATE.confirmed = false;
    $('btn-continue').disabled = false;
    $('btn-continue').textContent = 'REINTENTAR VALIDACIÓN';
    setAnswerStatus('No pudimos validar tu respuesta. Revisa tu conexión e intenta de nuevo.');
    return;
  }

  STATE.attempts.push({
    question_id:    q.question_id,
    selected:       STATE.selected,
    correct:        correct,
    challenge_type: q.challenge_type,
    topic:          q.topic,
    ra_id:          q.ra_id,
  });

  // Visual feedback on options before switching screen
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true;
    const letter = btn.getAttribute('data-letter');
    if (letter === STATE.selected && correct) {
      btn.classList.remove('selected');
      btn.classList.add('confirmed-right');
    } else if (letter === STATE.selected && !correct) {
      btn.classList.remove('selected');
      btn.classList.add('confirmed-wrong');
    }
  });

  setTimeout(() => {
    renderFeedback(q, correct);
    showScreen(2);
  }, 400);
}

/* ---- Screen 2: Feedback ---- */
function renderFeedback(q, correct) {
  const fb = q.feedback || {};
  const ct = q.challenge_type || 'recall';

  // Status
  const status = $('fb-status');
  status.innerHTML = '';
  const dotCls = correct ? 'fb-dot fb-dot-correct' : 'fb-dot fb-dot-incorrect';
  const lblCls = correct ? 'fb-label fb-label-correct' : 'fb-label fb-label-incorrect';
  const perfLabel = correct
    ? (CORRECT_PERFORMANCE[ct] || 'concepto asentado')
    : (INCORRECT_PERFORMANCE[ct] || 'requiere refuerzo');
  status.appendChild(el('span', { class: dotCls }));
  status.appendChild(txt('span', lblCls, perfLabel));

  // Explanation
  const expl = $('fb-explanation');
  expl.textContent = fb.explanation || '';

  // Misconception note
  const mcNote = $('fb-mc-note');
  if (fb.misconception_note) {
    mcNote.hidden = false;
    mcNote.innerHTML = `<span class="fb-mc-icon">⚠</span>${escTxt(fb.misconception_note)}`;
  } else {
    mcNote.hidden = true;
  }

  // Auditoría Z.2: se retira el "mentor hint" estático (mismo texto en inglés para
  // toda respuesta incorrecta — mensaje placebo). Reactivar solo con hints por ítem.
  const mentor = document.getElementById('fb-mentor');
  if (mentor) mentor.hidden = true;

  // WWJ badge
  const wwj = $('fb-wwj-badge');
  wwj.hidden = !fb.wwj_available;

  // Next button label
  const isLast = STATE.qIdx >= STATE.payload.questions.length - 1;
  $('btn-next').textContent = isLast ? 'VER RESUMEN' : 'SIGUIENTE RETO';

  animateFeedbackReveal(fb.misconception_note);
}

// animateFeedbackReveal / animateDebriefingReveal — Fase de animación
// unificada del sistema: el resultado por reto aparece en un pop suave
// (no un veredicto seco) y, en el debriefing, las métricas y las burbujas
// de fortalezas/brechas/misconceptions entran en cascada. Respeta
// prefers-reduced-motion.
function asReduceMotion() {
  return typeof window !== 'undefined' && window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function asStagger(nodes, startDelay, gap) {
  nodes.forEach((el, i) => { setTimeout(() => { el.classList.add('as-in'); }, startDelay + i * gap); });
}
function animateFeedbackReveal(hasMcNote) {
  const status = $('fb-status');
  const expl = $('fb-explanation');
  const mcNote = $('fb-mc-note');
  [status, expl, mcNote].forEach(el => el && el.classList.remove('as-in'));
  if (asReduceMotion()) {
    if (status) status.classList.add('as-in');
    if (expl) expl.classList.add('as-in');
    if (hasMcNote && mcNote) mcNote.classList.add('as-in');
    return;
  }
  if (status) setTimeout(() => status.classList.add('as-in'), 40);
  if (expl) setTimeout(() => expl.classList.add('as-in'), 160);
  if (hasMcNote && mcNote) setTimeout(() => mcNote.classList.add('as-in'), 300);
}

function escTxt(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ---- Next question ---- */
function nextQuestion() {
  const total = STATE.payload.questions.length;
  if (STATE.qIdx >= total - 1) {
    renderDebriefing();
    showScreen(3);
  } else {
    STATE.qIdx++;
    renderQuestion();
    showScreen(1);
  }
}

/* ---- Screen 3: Debriefing ---- */
function renderDebriefing() {
  const p = STATE.payload;
  const now = new Date();
  const completedAt = now.toISOString();

  // Persist to localStorage
  try {
    const record = {
      session_id:   STATE.sessionId,
      mode:         p.session_mode,
      attempts:     STATE.attempts.map(a => ({
        question_id:    a.question_id,
        selected:       a.selected,
        correct:        a.correct,
        challenge_type: a.challenge_type,
      })),
      completed_at: completedAt,
    };
    localStorage.setItem('wset_session_results', JSON.stringify(record));
  } catch (_) { /* localStorage may be unavailable */ }

  // Phase Y.1 — append to longitudinal learner history (analytics + weakness engine)
  if (window.LI) LI.recordSBASession(STATE.sessionId, p.session_mode, STATE.attempts);

  // Timestamp
  $('db-timestamp').textContent = `${now.toLocaleDateString('es-ES')} · ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;

  // Compute stats
  const total     = STATE.attempts.length;
  const solid     = STATE.attempts.filter(a => a.correct).length;
  const gaps      = total - solid;
  const mc_hit    = STATE.attempts.filter(a => a.challenge_type === 'misconception_repair' && !a.correct);
  const strong_topics = [...new Set(STATE.attempts.filter(a => a.correct).map(a => a.topic).filter(Boolean))];
  const gap_topics    = [...new Set(STATE.attempts.filter(a => !a.correct).map(a => a.topic).filter(Boolean))];

  // Next mission suggestion
  let nextMission = 'Continúa con la siguiente sesión Exprés · 10 para consolidar lo trabajado.';
  if (gap_topics.length > 0) {
    const focus = gap_topics.slice(0, 2).join(' y ');
    nextMission = `Próxima sesión: refuerzo enfocado en ${focus}. ${solid > 0 ? `Consolida los ${solid} conceptos sólidos primero.` : ''}`;
  } else if (solid === total && total > 0) {
    nextMission = `Excelente rendimiento. Siguiente paso: sesión Estándar · 25 o Simulacro Teoría Parte 1 · 50 para avanzar en profundidad.`;
  }

  const container = $('db-content');
  container.innerHTML = '';

  // Metrics row
  const metrics = el('div', { class: 'db-metrics' });
  const metricData = [
    { val: total, label: 'retos\ncompletados', cls: 'db-metric-val-green' },
    { val: solid, label: 'conceptos\nconsolidados', cls: 'db-metric-val-green' },
    { val: gaps,  label: 'brechas\ndetectadas', cls: gaps > 0 ? 'db-metric-val-amber' : 'db-metric-val-green' },
  ];
  metricData.forEach(({ val, label, cls }) => {
    const card = el('div', { class: 'db-metric' });
    const v = txt('div', `db-metric-val ${cls}`, String(val));
    card.appendChild(v);
    const lbl = txt('div', 'db-metric-label', label);
    lbl.style.whiteSpace = 'pre-line';
    card.appendChild(lbl);
    metrics.appendChild(card);
  });
  container.appendChild(metrics);

  // Strengths
  if (strong_topics.length > 0) {
    const sec = el('div', { class: 'db-section' });
    sec.appendChild(txt('div', 'db-section-label', 'Fortalezas consolidadas esta sesión'));
    const chips = el('div', { class: 'db-chips' });
    strong_topics.forEach(t => chips.appendChild(txt('span', 'chip chip-green', t)));
    sec.appendChild(chips);
    container.appendChild(sec);
  }

  // Gaps
  if (gap_topics.length > 0) {
    const sec = el('div', { class: 'db-section' });
    sec.appendChild(txt('div', 'db-section-label', 'Brechas detectadas'));
    const chips = el('div', { class: 'db-chips' });
    gap_topics.forEach(t => chips.appendChild(txt('span', 'chip chip-amber', t)));
    sec.appendChild(chips);
    container.appendChild(sec);
  }

  // Misconceptions triggered
  if (mc_hit.length > 0) {
    const sec = el('div', { class: 'db-section' });
    sec.appendChild(txt('div', 'db-section-label', 'Ideas erróneas activadas'));
    const chips = el('div', { class: 'db-chips' });
    mc_hit.forEach(a => chips.appendChild(txt('span', 'chip chip-red', a.question_id)));
    sec.appendChild(chips);
    container.appendChild(sec);
  }

  // Next mission
  const nextBox = el('div', { class: 'db-next' });
  nextBox.appendChild(txt('div', 'db-next-label', 'Siguiente misión sugerida'));
  nextBox.appendChild(txt('div', 'db-next-text', nextMission));
  container.appendChild(nextBox);

  // Dashboard CTA
  const dashboardBtn = el('button', { class: 'btn btn-primary', onclick: "window.location.href='/dashboard/'" });
  dashboardBtn.textContent = 'IR A MI DASHBOARD';
  container.appendChild(dashboardBtn);

  // Restart button
  const restartBtn = el('button', { class: 'btn btn-secondary', onclick: 'restartSession()' });
  restartBtn.textContent = 'NUEVA SESIÓN';
  container.appendChild(restartBtn);

  // Footer
  const footer = el('div', { class: 'db-footer' });
  footer.textContent = 'Práctica formativa · Desarrollo de razonamiento profesional';
  container.appendChild(footer);

  animateDebriefingReveal(container);
}
function animateDebriefingReveal(container) {
  const metricCards = container.querySelectorAll('.db-metric');
  const chips = container.querySelectorAll('.chip');
  const nextBox = container.querySelector('.db-next');
  if (asReduceMotion()) {
    metricCards.forEach(el => el.classList.add('as-in'));
    chips.forEach(el => el.classList.add('as-in'));
    if (nextBox) nextBox.classList.add('as-in');
    return;
  }
  asStagger(metricCards, 60, 90);
  const chipsStart = 60 + metricCards.length * 90 + 140;
  asStagger(chips, chipsStart, 70);
  if (nextBox) setTimeout(() => nextBox.classList.add('as-in'), chipsStart + chips.length * 70 + 120);
}

/* ---- Restart ---- */
function restartSession() {
  STATE.qIdx = 0;
  STATE.selected = null;
  STATE.confirmed = false;
  STATE.attempts = [];
  STATE.sessionId = new Date().toISOString();
  startMission();
}

/* ---- Bootstrap ---- */

// ═══════════════════════════════════════════════════════════
// PROTECTED SESSION CLIENTS
// ═══════════════════════════════════════════════════════════
async function buildSBA(mode){
  try{
    const token=await requireAuth();
    {
      const size={express_10:10,standard_25:25,mock_theory_50:50}[mode]||10;
      const weakness=window.LI?LI.weakSet():{weakRAs:[],weakTopics:[],strongTopics:[],mcTrends:[]};
      const params=new URLSearchParams({limit:String(size),cycle:'1',strategy:'adaptive',mode});
      if(weakness.weakTopics.length)params.set('weak_topics',weakness.weakTopics.slice(0,20).join(','));
      if(weakness.weakRAs.length)params.set('weak_ras',weakness.weakRAs.slice(0,10).join(','));
      const response=await adaptiveFetch(
        'https://hylknjjhmxsuuwbsslkr.supabase.co/functions/v1/get-sba-bank?'+params.toString(),
        {headers:{'Authorization':'Bearer '+token}}
      );
      if(!response.ok){console.error('get-sba-bank status:',response.status);return null;}
      const bank=await response.json();
      const selected=Array.isArray(bank.items)?bank.items:[];
      if(selected.length!==size){console.error('API returned an incomplete adaptive session');return null;}
      const modeLabel={express_10:'Exprés · 10',standard_25:'Estándar · 25',mock_theory_50:'Simulacro Teoría · 50'}[mode]||mode;
      return {
        generated_at:new Date().toISOString(), session_mode:modeLabel, api_mode:mode,
        pool_size:bank.remaining_in_cycle||selected.length, pool_source:'supabase_cycle', target_size:selected.length,
        governance:{safe_for_examiner:false,examiner_scoring_allowed:false,training_item_only:true},
        mission_briefing:{strong_areas:weakness.strongTopics.slice(0,4),weak_areas:weakness.weakTopics.slice(0,4),
          active_misconceptions:weakness.mcTrends.slice(0,3),causal_gaps:[],
          training_type:weakness.weakTopics.length?'refuerzo':'diagnostico',
          session_objective:weakness.weakTopics.length
            ?'Sesión adaptativa: refuerzo priorizado en '+weakness.weakTopics.slice(0,2).join(' y ')
            :'Sesión de entrenamiento formativo WSET L3'},
        questions:selected.map(item=>{
          const letters=['A','B','C','D'];
          return {
            question_id:item.id, priority_score:1, stem:item.text,
            options:(item.options||[]).reduce((result,value,index)=>{result[letters[index]||String(index)]=value;return result;},{}),
            correct_answer:null, topic:localizedTopic(item.topic), ra_id:item.ra||'—',
            difficulty:localizedDifficulty(item.difficulty), challenge_type:'theory_foundation', feedback:{}
          };
        })
      };
    }
  }catch(e){console.error('buildSBA error:',e);return null;}
}
async function buildSAT(mode){
  const cnt=(mode==='sat_sprint')?1:2;
  const wines=[];
  try{
    const token=await requireAuth();
    for(let attempt=0;attempt<cnt*4 && wines.length<cnt;attempt++){
      const response=await adaptiveFetch(
        'https://hylknjjhmxsuuwbsslkr.supabase.co/functions/v1/get-sat-wines?mode=bottle_guided',
        {headers:{'Authorization':'Bearer '+token}}
      );
      if(!response.ok)throw new Error('get-sat-wines status: '+response.status);
      const payload=await response.json();
      const row=Array.isArray(payload.wines)?payload.wines[0]:null;
      if(!row||wines.some(w=>w.prompt_id===row.id))continue;
      const identity=(row.guided_identity&&typeof row.guided_identity==='object')?row.guided_identity:{};
      const name=identity.display_name||identity.wine_name||row.display_label||('Vino de práctica '+(wines.length+1));
      const place=identity.region||'';
      wines.push({
        prompt_id:row.id,
        wine_type:row.wine_type||identity.wine_type||'',
        wine_name:name,
        description:'Construye una nota SAT completa para '+name+(place?' ('+place+')':'')+'.',
        training_note:'Practica la secuencia Aspecto → Nariz → Boca → Conclusiones. La plataforma revisará la estructura, no revelará un perfil canónico.',
      });
    }
  }catch(error){
    console.error('Unable to prepare protected SAT practice:',error);
    return null;
  }
  if(wines.length!==cnt)return null;

  return {type:'sat',mode,duration_minutes:mode==='sat_mock'?30:null,wines:wines,
    governance:{safe_for_examiner:false,examiner_scoring_allowed:false,training_item_only:true}};
}

let _satTmr=null, _satSec=0;

function startAdp(mode){
  const accessMode = {
    express_10: 'adaptive_express',
    standard_25: 'adaptive_standard',
    mock_theory_50: 'adaptive_mock_theory',
    sat_sprint: 'sat_sprint',
    sat_practice: 'sat_practice',
    sat_mock: 'sat_mock',
  }[mode] || mode;
  setAdaptiveStatus('Validando tu acceso…','loading');
  if(!window.WSETModeAccessGate){
    setAdaptiveStatus('No pudimos validar tu acceso. Recarga la página e intenta de nuevo.','error');
    return;
  }
  window.WSETModeAccessGate.request({
      route: '/adaptive-session/',
      experience: 'adaptive_session',
      mode: accessMode,
      enforcement: 'active',
  }).then(decision=>{
    if(decision.would_allow) return startAllowedAdp(mode);
    setAdaptiveStatus('','');
  }).catch(error=>{
    console.error('Adaptive access check failed:',error);
    setAdaptiveStatus('No pudimos validar tu acceso. Intenta de nuevo.','error');
  });
}

async function startAllowedAdp(mode){
  setAdaptiveStatus('Preparando tu sesión…','loading');
  if(mode.startsWith('sat_')){
    STATE.satPayload=await buildSAT(mode); STATE.satWineIdx=0; STATE.satResponses={};
    if(!STATE.satPayload){
      setAdaptiveStatus('No pudimos preparar la práctica SAT. Intenta de nuevo.','error');
      return;
    }
    document.getElementById('adp-ol').classList.remove('active');
    setAdaptiveStatus('','');
    showScreen('sat'); renderSAT();
    if(STATE.satPayload&&STATE.satPayload.duration_minutes){
      _satSec=STATE.satPayload.duration_minutes*60; clearInterval(_satTmr);
      _satTmr=setInterval(()=>{
        _satSec=Math.max(0,_satSec-1);
        const el=document.getElementById('sat-timer');
        if(el){const m=Math.floor(_satSec/60),s=_satSec%60;el.textContent=m+':'+String(s).padStart(2,'0');el.style.color=_satSec<120?'#e45c5c':'#c9a84c';}
        if(!_satSec)clearInterval(_satTmr);
      },1000);
    }
  } else {
    STATE.payload=await buildSBA(mode);
    if(!STATE.payload){
      setAdaptiveStatus('No pudimos cargar las preguntas. Intenta de nuevo.','error');
      return;
    }
    document.getElementById('adp-ol').classList.remove('active');
    setAdaptiveStatus('','');
    STATE.screen=0; STATE.qIdx=0; STATE.selected=null; STATE.confirmed=false;
    showScreen(0); renderScreen0();
  }
}

function renderSAT(){
  const p=STATE.satPayload; if(!p)return;
  const wines=p.wines||[], idx=STATE.satWineIdx||0, wine=wines[idx], el=document.getElementById('sat-content');
  if(!wine||!el)return;
  const tot=wines.length, dur=p.duration_minutes;
  el.innerHTML=`<div class="as-sat-shell">
    <div class="as-sat-header">
      <div><div class="as-sat-eyebrow">Cata SAT · Vino ${idx+1} de ${tot}</div>
      <div class="as-sat-wine-name">${escTxt(wine.wine_name)}</div></div>
      ${dur?`<div class="as-sat-timer-wrap"><div class="as-sat-timer-label">Tiempo restante</div><div id="sat-timer" class="as-sat-timer">${dur}:00</div></div>`:''}
    </div>
    <div class="as-sat-panel">
      <div class="as-sat-panel-label">DESCRIPCIÓN</div>
      <div class="as-sat-description">${escTxt(wine.description)}</div>
    </div>
    <div class="as-sat-panel">
      <div class="as-sat-panel-label">TU ANÁLISIS SAT</div>
      <div class="as-sat-order-note">Orden WSET: Aspecto → Nariz → Boca → Conclusiones</div>
      <textarea id="sat-resp-${wine.prompt_id}" class="as-sat-response"
        placeholder="ASPECTO: [intensidad] [color]&#10;NARIZ: [intensidad] · [aromas]&#10;BOCA: [dulzor] · [acidez] · [tanino] · [alcohol] · [cuerpo] · [sabores] · [final]&#10;CONCLUSIONES: [calidad] · [potencial]"></textarea>
    </div>
    <div class="as-sat-training-note">
      <div class="as-sat-training-label">NOTA FORMATIVA</div>
      <div class="as-sat-training-copy">${escTxt(wine.training_note||wine.style||'Entrenamiento SAT formativo')}</div>
    </div>
    ${wine.coaching_hints && wine.coaching_hints.length > 0 ? `<div class="as-sat-coaching">
      <div class="as-sat-coaching-title">ORIENTACIÓN PEDAGÓGICA</div>
      <ul class="as-sat-coaching-list">
        ${wine.coaching_hints.slice(0,2).map(h => `<li class="as-sat-coaching-item">${escTxt(h)}</li>`).join('')}
      </ul>
    </div>` : ''}
    <div class="as-sat-actions">
      ${idx+1<tot
        ?`<button class="as-sat-button as-sat-button--next" onclick="satNext()">Siguiente →</button>`
        :`<button class="as-sat-button as-sat-button--finish" onclick="finishSAT()">Finalizar ✓</button>`}
    </div>
  </div>`;
}

function satCapture(){
  const p=STATE.satPayload; if(!p)return;
  const wine=(p.wines||[])[STATE.satWineIdx||0]; if(!wine)return;
  const ta=document.getElementById('sat-resp-'+wine.prompt_id);
  if(ta){STATE.satResponses=STATE.satResponses||{};STATE.satResponses[wine.prompt_id]=ta.value;}
}
function satNext(){
  satCapture();
  STATE.satWineIdx++;renderSAT();window.scrollTo({top:0,behavior:'smooth'});
}
function finishSAT(){
  clearInterval(_satTmr);
  satCapture();
  // Phase Y.1 — Distinction Coach: structural review of each SAT response
  let coachHtml='', reviews=[];
  if(window.LI&&window.DISTINCTION_COACH){
    const p=STATE.satPayload, resp=STATE.satResponses||{};
    (p.wines||[]).forEach(w=>{
      const findings=LI.coachSAT(resp[w.prompt_id]||'',w);
      if(findings){
        reviews.push({prompt_id:w.prompt_id,findings:findings});
        coachHtml+=`<div class="as-sat-coach-wine">${escTxt(w.wine_name)}</div>`+LI.renderCoachPanel(findings);
      }
    });
    if(reviews.length)LI.recordSATSession(p.mode,reviews);
  }
  document.getElementById('sat-content').innerHTML=`<div class="as-sat-complete">
    <div class="as-sat-complete-icon">✓</div>
    <div class="as-sat-complete-title">Práctica SAT completada</div>
    <div class="as-sat-complete-note">Entrenamiento formativo. Evaluación oficial requiere Examiner WSET acreditado.</div>
    ${coachHtml}
    <button class="as-sat-button as-sat-button--restart" onclick="document.getElementById('adp-ol').classList.add('active')">← Nueva sesión</button>
  </div>`;
  window.scrollTo({top:0,behavior:'smooth'});
}
function toggleProgress(){
  const box=document.getElementById('li-progress'); if(!box)return;
  if(box.hidden){box.innerHTML=window.LI?LI.renderProgress():'';box.hidden=false;}
  else box.hidden=true;
}

document.addEventListener('DOMContentLoaded',function(){/* mode overlay visible */});
