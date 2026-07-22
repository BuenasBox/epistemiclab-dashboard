// -----------------------------------------------------------------------
// GOVERNANCE FLAGS
// training_item_only = true
// official_wset_question = false
// safe_for_examiner = false
// examiner_scoring_allowed = false
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// MOCK DATA — 4 PREGUNTAS DE ENTRENAMIENTO
// micro_drill: type "micro_sba" only (v2.2 SBA purity)
// -----------------------------------------------------------------------

// QUESTIONS: dynamic from window.PREGUNTAS_BANK
let QUESTIONS = [];
let ACTIVE_MODE = null;
const REQUEST_TIMEOUT_MS = 15000;

function localizedDifficulty(value){
  const key=String(value||'').trim().toLowerCase();
  return {
    foundation:'Fundamento',beginner:'Inicial',intermediate:'Intermedio',
    advanced:'Avanzado',expert:'Experto'
  }[key]||value||'—';
}

function localizedTopic(value){
  const raw=String(value||'').trim();
  if(!raw||/^RA\d(?:\s*\/.*)?$/i.test(raw))return raw||'—';
  const terms={ageing:'crianza',vessel:'recipiente',comparison:'comparación',biological:'biológica',vs:'frente a',oxidative:'oxidativa',canada:'Canadá',icewine:'vino de hielo',acidity:'acidez',cost:'coste',fermentation:'fermentación',harvest:'cosecha',style:'estilo',variety:'variedad',drying:'secado',airflow:'flujo de aire',fortification:'fortificación',extraction:'extracción',port:'Oporto',sherry:'Jerez',volume:'volumen',fortified:'fortificados',wines:'vinos',germany:'Alemania',selection:'selección',concentration:'concentración',risk:'riesgo',press:'prensado',yield:'rendimiento',label:'etiqueta',law:'normativa',late:'tardía',colour:'color',aroma:'aroma',timing:'momento',heat:'calor',stability:'estabilidad',quality:'calidad',method:'método',cooling:'enfriamiento',influence:'influencia',early:'temprana',old:'vieja',oak:'madera',raisining:'pasificación',skin:'hollejos',contact:'contacto',warm:'cálida',young:'joven',blend:'mezcla',aged:'envejecido',youthful:'juvenil',maturation:'maduración',bottle:'botella',price:'precio',factors:'factores',acid:'acidez',morning:'matinal',mist:'niebla',balance:'equilibrio',selective:'selectiva',picking:'vendimia',vintage:'añada',transition:'transición',freshness:'frescura',first:'primera',classification:'clasificación',conditions:'condiciones',protection:'protección',consistency:'consistencia',overdraw:'extracción excesiva',sparkling:'espumosos',still:'tranquilos',storage:'conservación',and:'y',service:'servicio',readiness:'preparación',sweet:'dulce',must:'mosto',open:'abierta',pairing:'maridaje',blue:'azul',cheese:'queso',dessert:'postre',portion:'porción',temperature:'temperatura',addition:'adición',viticulture:'viticultura',wine:'vino',food:'gastronomía',winemaking:'vinificación'};
  const label=raw.split('_').map(part=>terms[part.toLowerCase()]||part).join(' ');
  return label.charAt(0).toUpperCase()+label.slice(1);
}

async function fetchWithTimeout(url,options){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
  try{return await fetch(url,{...(options||{}),signal:controller.signal});}
  finally{clearTimeout(timer);}
}

function bankToQ(item){
  return {
    id:item.id, source_question_id:item.source_question_id,
    topic:localizedTopic(item.topic), ra:item.ra||'—', difficulty:localizedDifficulty(item.difficulty),
    cognitive_skill:item.ra?('RA: '+item.ra):'—', est_time:'45–90 s',
    text:item.text||'', options:item.options||[],
    enriched:!!item.enriched,
    // Answer key and pedagogical result are resolved server-side AFTER the
    // student submits (validate-sba-answer). They are intentionally null here so
    // the browser never receives the correct answer or the feedback in advance.
    correct_index:null, correct_letter:null,
    feedback_by_mode:null, causal_chain:null,
    distractor_traps:null, misconception:null,
    cross_exam_challenge:null, sat_relevance:null,
    micro_drill:null,
  };
}
function showModeAuthMessage(show){
  const el=document.getElementById('modeAuthMsg');
  if(el) el.classList.toggle('show', !!show);
}
function setModeStatus(message,state){
  const el=document.getElementById('modeStatusMsg');
  const loading=state==='loading';
  document.querySelectorAll('.mode-btn').forEach(btn=>{btn.disabled=loading;});
  document.getElementById('mode-overlay')?.setAttribute('aria-busy',String(loading));
  if(!el)return;
  el.textContent=message||'';
  el.className='mode-status-msg'+(message?' show':'')+(state?' '+state:'');
}
async function loadMode(mode){
  try{
    showModeAuthMessage(false);
    const token=await requireAuth();
    const size={quick_drill:5,express:10,standard:25,mock_theory_1:50}[mode]||10;
    const params=new URLSearchParams({limit:String(size),mode,cycle:'1'});
    const resp=await fetchWithTimeout('https://hylknjjhmxsuuwbsslkr.supabase.co/functions/v1/get-sba-bank?'+params,
      {headers:{'Authorization':'Bearer '+token},cache:'no-store'});
    if(resp.status===401){
      showModeAuthMessage(true);
      console.error('Authentication required');
      return false;
    }
    if(!resp.ok) throw new Error('get-sba-bank status: '+resp.status);
    const {items}=await resp.json();
    const all=items||[];
    if(!Array.isArray(all)||all.length!==size) throw new Error('Incomplete question set');
    ACTIVE_MODE=mode;
    // The backend returns exactly the requested random, not-yet-completed set.
    // Local recency is no longer authoritative across devices or sign-ins.
    QUESTIONS=all.map(bankToQ);
    return true;
  }catch(e){
    console.error('loadMode error:',e);
    if(String(e && e.message)==='NO_AUTH_SESSION') showModeAuthMessage(true);
    return false;
  }
}
function startMode(mode){
  setModeStatus('Validando tu acceso…','loading');
  const accessMode = {
    quick_drill: 'sba_quick_drill',
    express: 'sba_express',
    standard: 'sba_standard',
    mock_theory_1: 'sba_mock_theory',
  }[mode] || mode;

  // If access gate exists, use it; otherwise proceed directly
  if(window.WSETModeAccessGate){
    window.WSETModeAccessGate.request({
        route: '/diagnostic-sba/',
        experience: 'diagnostic_sba',
        mode: accessMode,
        enforcement: 'active',
    }).then(decision=>{
      if(decision.would_allow) {
        startAllowedMode(mode).catch(e=>console.error('startAllowedMode error:',e));
      } else {
        setModeStatus('','');
      }
    }).catch(error=>{
      console.error('[startMode] Access check failed:',error);
      setModeStatus('No pudimos validar tu acceso. Intenta de nuevo.','error');
    });
  } else setModeStatus('No pudimos validar tu acceso. Recarga la página e intenta de nuevo.','error');
}

async function startAllowedMode(mode){
  setModeStatus('Cargando preguntas…','loading');
  const ok = await loadMode(mode);
  if(!ok || !Array.isArray(QUESTIONS) || !QUESTIONS.length){
    console.warn('[startAllowedMode] no se pudieron cargar preguntas; se mantiene el selector de modo');
    setModeStatus('No pudimos cargar las preguntas. Revisa tu sesión e intenta de nuevo.','error');
    return;
  }
  document.getElementById('mode-overlay').classList.remove('active');
  STATE.stage='prepare'; STATE.questionIndex=0;
  STATE.selectedOption=null; STATE.selectedConfidence=null; STATE.selectedTag=null;
  render();
  setModeStatus('','');
}


// -----------------------------------------------------------------------
// STATE
// -----------------------------------------------------------------------
const STATE = {
  stage: 'prepare',
  questionIndex: 0,
  selectedOption: null,
  selectedConfidence: null,
  selectedTag: null,
  crossChanged: false,
  pressureMode: false,
  mentorMode: 'mentor',
  timerInterval: null,
  timerSeconds: 0,
  timeElapsed: 0,
  readTimeElapsed: 0,
  drillSelectedOption: null,
  drillSubmitted: false,
  attempts: [],
  historyRecorded: false,
  session: {
    answered: 0,
    correct: 0,
    overconfident: 0,
    hesitated: 0,
    causalWeakness: 0,
    trapSusceptibility: 0
  }
};

// -----------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------
function currentQ() { return QUESTIONS[STATE.questionIndex]; }

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function mentorLabel() {
  return { mentor: 'Mentor Guía', trainer: 'Entrenador Técnico', reviewer: 'Revisor Estricto' }[STATE.mentorMode] || 'Mentor Guía';
}

// Fallback determinista por pregunta (auditoría Z.2): se usa cuando el banco
// no incluye feedback_by_mode. Construido solo con campos existentes del ítem.
function fallbackFeedback(q) {
  if(typeof q.correct_index!=='number'){
    return 'No pudimos recuperar la retroalimentación de esta pregunta. Intenta nuevamente.';
  }
  const idx = q.correct_index;
  const letter = String.fromCharCode(65 + idx);
  const correctTxt = (q.options && q.options[idx]) || '';
  return `La respuesta correcta es ${letter}: «${correctTxt}». ` +
    `Tema: ${q.topic} · ${q.ra}. Repasa este concepto antes de la siguiente sesión.`;
}

// ---- Stage pips ----
function updateStagePips() {
  const stages = ['prepare','read','commit','cross','reveal','train','map'];
  const idx = stages.indexOf(STATE.stage);
  document.querySelectorAll('.stage-pip').forEach((p, i) => {
    p.classList.remove('active','done');
    if (i === idx) p.classList.add('active');
    else if (i < idx) p.classList.add('done');
  });
  const labels = {
    prepare:'PREPARAR', read:'LEER', commit:'CONFIRMAR',
    cross:'CONTRASTE', reveal:'REVELAR', train:'ENTRENAR', map:'MAPA COGNITIVO'
  };
  document.getElementById('stageLabelText').innerHTML =
    `Etapa<span>${labels[STATE.stage] || ''}</span>`;
}

// ---- Orb ----
const ORB_CONFIGS = {
  prepare: { speed:'orb-calm',   color:'var(--cyan)', label:'En espera',     reading:'Preparando sesión...' },
  read:    { speed:'orb-calm',   color:'var(--ok)', label:'Activo',         reading:'Observando lectura...' },
  commit:  { speed:'orb-active', color:'var(--gold)', label:'Atento',         reading:'Registrando razonamiento...' },
  cross:   { speed:'orb-intense',color:'var(--warn)', label:'Intenso',        reading:'Analizando decisión...' },
  reveal:  { speed:'orb-active', color:'#8b7cf6', label:'Procesando',     reading:'Evaluando respuesta...' },
  train:   { speed:'orb-calm',   color:'var(--cyan)', label:'Entrenando',     reading:'Reforzando concepto...' },
  map:     { speed:'orb-calm',   color:'var(--gold)', label:'Mapa listo',     reading:'Generando huella cognitiva...' }
};

function setOrbStage(stage) {
  const cfg = ORB_CONFIGS[stage] || ORB_CONFIGS.prepare;
  const orb = document.getElementById('signalOrb');
  orb.className = 'orb-svg ' + cfg.speed;
  orb.querySelectorAll('.ring').forEach(r => r.setAttribute('stroke', cfg.color));
  orb.querySelector('.core-pulse').setAttribute('fill', cfg.color);
  document.getElementById('orbStatusLine').textContent = cfg.label;
  document.getElementById('orbReadingLine').textContent = cfg.reading;
}

// ---- Timer arc around orb ----
// r=36 → circumference ≈ 226.2
const ARC_CIRCUM = 226.2;
function setTimerArc(remaining, total, color) {
  const arc = document.getElementById('timerArc');
  if (!arc) return;
  const pct = remaining / total;
  const offset = ARC_CIRCUM * (1 - pct);
  arc.setAttribute('stroke-dashoffset', offset);
  arc.setAttribute('stroke', color);
  arc.setAttribute('opacity', '0.7');
}
function hideTimerArc() {
  const arc = document.getElementById('timerArc');
  if (arc) arc.setAttribute('opacity', '0');
}

// ---- Confidence circular gauge ----
// r=22 → circumference ≈ 138.2
const CONF_CIRCUM = 138.2;
function setConfGauge(conf) {
  const arc = document.getElementById('confGaugeArc');
  const txt = document.getElementById('confGaugeText');
  if (!arc || !txt) return;
  const map = {
    seguro:     { pct:1.0, color:'var(--ok)', label:'100%' },
    bastante:   { pct:0.7, color:'var(--warn)', label:'70%' },
    dudas:      { pct:0.4, color:'var(--gold)', label:'40%' },
    adivinando: { pct:0.15,color:'var(--block)', label:'15%' }
  };
  const d = map[conf];
  if (!d) return;
  arc.setAttribute('stroke-dashoffset', CONF_CIRCUM * (1 - d.pct));
  arc.setAttribute('stroke', d.color);
  txt.setAttribute('fill', d.color);
  txt.textContent = d.label;
}
function resetConfGauge() {
  const arc = document.getElementById('confGaugeArc');
  const txt = document.getElementById('confGaugeText');
  if (arc) { arc.setAttribute('stroke-dashoffset', CONF_CIRCUM); arc.setAttribute('stroke','#525e6e'); }
  if (txt) { txt.setAttribute('fill','#525e6e'); txt.textContent = '—'; }
}

// ---- Causal bars ----
function setCausalBars(level) {
  // level 0-5
  for (let i = 1; i <= 5; i++) {
    const bar = document.getElementById('cbar' + i);
    if (bar) bar.classList.toggle('lit', i <= level);
  }
}

// ---- Hesitation dots ----
function triggerHesDot(idx) {
  const dot = document.getElementById('hd' + idx);
  if (dot) dot.classList.add('triggered');
  const lbl = document.getElementById('hesLabel');
  if (lbl) lbl.innerHTML = '<span class="ep-icon ep-icon--confidence-signal" aria-hidden="true"></span> ' + STATE.session.hesitated;
}

// ---- Misconception glyph ----
function activateMisconGlyph(on) {
  document.getElementById('misconGlyph')?.classList.toggle('active', on);
}

// ---- Session stats sidebar ----
function updateSessionStats() {
  const s = STATE.session;
  document.getElementById('statQTotal').textContent = s.answered + ' / ' + QUESTIONS.length;
  document.getElementById('statCorrect').textContent =
    s.answered > 0 ? Math.round(s.correct / s.answered * 100) + '%' : '—';
  document.getElementById('statConf').textContent =
    s.overconfident > 0 ? '<span class="ep-icon ep-icon--warning" aria-hidden="true"></span> ' + s.overconfident : '—';
  document.getElementById('statHes').textContent =
    s.hesitated > 0 ? s.hesitated : '—';
}

// ---- Timer ----
function stopTimer() {
  if (STATE.timerInterval) { clearInterval(STATE.timerInterval); STATE.timerInterval = null; }
  hideTimerArc();
}

function startTimer(seconds, onTick, onEnd) {
  stopTimer();
  STATE.timerSeconds = seconds;
  let elapsed = 0;
  onTick(seconds, elapsed, seconds);
  STATE.timerInterval = setInterval(() => {
    elapsed++;
    STATE.timerSeconds--;
    onTick(STATE.timerSeconds, elapsed, seconds);
    if (STATE.timerSeconds <= 0) { stopTimer(); if (onEnd) onEnd(); }
  }, 1000);
}

function timerColor(pct) {
  if (pct > 0.55) return 'var(--ok)';
  if (pct > 0.25) return 'var(--warn)';
  return 'var(--block)';
}

// ---- Pressure / Mentor ----
function togglePressure() {
  STATE.pressureMode = document.getElementById('pressureToggle').checked;
  const b = document.getElementById('pressureBadge');
  b.className = 'pressure-badge ' + (STATE.pressureMode ? 'on' : 'off');
  b.textContent = STATE.pressureMode ? '⬤ Activado' : '⬤ Desactivado';
}
function updateMentorMode() {
  STATE.mentorMode = document.getElementById('mentorMode').value;
}

// -----------------------------------------------------------------------
// RENDER DISPATCH
// -----------------------------------------------------------------------
function render() {
  updateStagePips();
  setOrbStage(STATE.stage);
  updateSessionStats();
  // Phase P.1: el selector de mentor solo es visible cuando el ítem actual
  // tiene feedback_by_mode real (lote enriquecido). Sin datos = sin control placebo.
  (function(){
    const sel = document.getElementById('mentorMode');
    if (!sel) return;
    const q = (typeof QUESTIONS !== 'undefined' && QUESTIONS && QUESTIONS.length) ? currentQ() : null;
    const isAvailable = Boolean(q && q.feedback_by_mode);
    sel.hidden = !isAvailable;
    sel.setAttribute('aria-hidden', String(!isAvailable));
  })();
  ({ prepare:renderPrepare, read:renderRead, commit:renderCommit,
     cross:renderCross, reveal:renderReveal, train:renderTrain, map:renderMap
  })[STATE.stage]?.();
}

// -----------------------------------------------------------------------
// STAGE 1: PREPARE
// -----------------------------------------------------------------------
function renderPrepare() {
  stopTimer();
  resetConfGauge();
  setCausalBars(0);
  activateMisconGlyph(false);
  const q = currentQ();
  document.getElementById('mainContent').innerHTML = `
    <div class="fade-in">
      <div class="q-counter">
        Pregunta <strong>${STATE.questionIndex + 1} de ${QUESTIONS.length}</strong>
        &nbsp;·&nbsp; Pregunta de Entrenamiento
      </div>

      <div class="section-label section-label--prepare">Preparar</div>

      <div class="q-meta">
        <span class="q-tag train"><span class="ep-icon ep-icon--lock" aria-hidden="true"></span> Entrenamiento</span>
        <span class="q-tag topic">${escapeHtml(q.topic)}</span>
        <span class="q-tag diff">Nivel 3 · ${escapeHtml(q.difficulty)}</span>
        <span class="q-tag skill">${escapeHtml(q.cognitive_skill)}</span>
      </div>

      <div class="prepare-meta">
        <div class="prepare-meta-item">
          <div class="prepare-meta-item-label">Habilidad cognitiva</div>
          <div class="prepare-meta-item-value">${escapeHtml(q.cognitive_skill)}</div>
        </div>
        <div class="prepare-meta-item">
          <div class="prepare-meta-item-label">Tiempo estimado</div>
          <div class="prepare-meta-item-value">${escapeHtml(q.est_time)}</div>
        </div>
        <div class="prepare-meta-item">
          <div class="prepare-meta-item-label">Modo presión</div>
          <div class="prepare-meta-item-value">${STATE.pressureMode ? '<span class="ep-icon ep-icon--confidence-signal" aria-hidden="true"></span> Activado' : 'Normal'}</div>
        </div>

      </div>

      <div class="mentor-frame">
        <div class="mentor-frame-label">Señal del mentor</div>
        <div class="mentor-frame-text">
          Esta pregunta evalúa <em>${escapeHtml(q.cognitive_skill)}</em>.
          Antes de entrar en modo examen, asegúrate de que puedes razonar la cadena causal completa — no solo recordar la respuesta.
        </div>
      </div>

      <button class="btn btn--shine btn--glow commit-btn" onclick="goToRead()">
        Entrar en modo examen →
      </button>
    </div>
  `;
}

// -----------------------------------------------------------------------
// STAGE 2: READ — Question as HERO
// -----------------------------------------------------------------------
function renderRead() {
  const q = currentQ();
  const totalTime = STATE.pressureMode ? 45 : 90;
  STATE.readTimeElapsed = 0;
  document.getElementById('mainContent').innerHTML = `
    <div class="fade-in">
      <div class="q-counter">Pregunta <strong>${STATE.questionIndex + 1} de ${QUESTIONS.length}</strong></div>

      <div class="q-meta">
        <span class="q-tag train">Entrenamiento</span>
        <span class="q-tag topic">${escapeHtml(q.topic)}</span>
        <span class="q-tag diff">${escapeHtml(q.difficulty)}</span>
      </div>

      <div class="question-hero">${escapeHtml(q.text)}</div>

      <div class="read-hint">Lee la pregunta con atención. Las opciones aparecerán cuando estés listo.</div>

      <button class="btn btn--shine btn--glow commit-btn" id="readyBtn" onclick="goToCommit()">
        Estoy listo para responder →
      </button>
    </div>
  `;

  startTimer(totalTime, (remaining, elapsed, total) => {
    STATE.readTimeElapsed = elapsed;
    const pct = remaining / total;
    const color = timerColor(pct);
    setTimerArc(remaining, total, color);
  }, () => { goToCommit(); });
}

// -----------------------------------------------------------------------
// STAGE 3: COMMIT
// -----------------------------------------------------------------------
function renderCommit() {
  stopTimer();
  const q = currentQ();
  STATE.selectedOption = null;
  STATE.selectedConfidence = null;
  STATE.selectedTag = null;
  STATE.timeElapsed = 0;
  STATE.drillSubmitted = false;
  resetConfGauge();

  const totalTime = STATE.pressureMode ? 45 : 120;

  document.getElementById('mainContent').innerHTML = `
    <div class="fade-in">
      <div class="q-counter">Pregunta <strong>${STATE.questionIndex + 1} de ${QUESTIONS.length}</strong></div>
      <div class="section-label section-label--stage">Confirmar respuesta</div>

      <div class="question-text">${escapeHtml(q.text)}</div>

      <div class="options-list" id="optionsList">
        ${q.options.map((o, i) => `
          <button class="btn btn--ghost option-btn" id="opt${i}" onclick="selectOption(${i})">
            <span class="opt-letter">${String.fromCharCode(65+i)}</span>
            <span>${escapeHtml(o)}</span>
          </button>
        `).join('')}
      </div>

      <div class="section-sep"></div>

      <div class="confidence-section">
        <div class="conf-label">Calibración de confianza — selecciona antes de confirmar</div>
        <div class="conf-options">
          <button class="btn btn--ghost conf-btn" id="conf-seguro" onclick="selectConf('seguro')">Seguro/a</button>
          <button class="btn btn--ghost conf-btn" id="conf-bastante" onclick="selectConf('bastante')">Bastante seguro/a</button>
          <button class="btn btn--ghost conf-btn" id="conf-dudas" onclick="selectConf('dudas')">Tengo dudas</button>
          <button class="btn btn--ghost conf-btn" id="conf-adivinando" onclick="selectConf('adivinando')">Estoy adivinando</button>
        </div>
      </div>

      <div class="microtag-section">
        <div class="microtag-label">Razonamiento (opcional)</div>
        <div class="microtag-options">
          <button class="btn btn--ghost microtag-btn" id="tag-eliminacion" onclick="selectTag('eliminacion')">Por eliminación</button>
          <button class="btn btn--ghost microtag-btn" id="tag-libro" onclick="selectTag('libro')">Lo recuerdo del libro</button>
          <button class="btn btn--ghost microtag-btn" id="tag-causal" onclick="selectTag('causal')">Razonamiento causal</button>
          <button class="btn btn--ghost microtag-btn" id="tag-instinto" onclick="selectTag('instinto')">Instinto</button>
        </div>
      </div>

      <button class="btn btn--shine btn--glow commit-btn" id="commitBtn" onclick="commitAnswer()" disabled>
        <span class="lock-animation" id="lockIcon"><span class="ep-icon ep-icon--unlock" aria-hidden="true"></span></span>
        Confirmar respuesta
      </button>
    </div>
  `;

  startTimer(totalTime, (remaining, elapsed, total) => {
    STATE.timeElapsed = elapsed;
    const pct = remaining / total;
    setTimerArc(remaining, total, timerColor(pct));
  }, () => { commitAnswer(); });
}

function selectOption(i) {
  STATE.selectedOption = i;
  document.querySelectorAll('.option-btn').forEach((b, idx) => b.classList.toggle('selected', idx === i));
  checkCommitReady();
}

function selectConf(c) {
  STATE.selectedConfidence = c;
  document.querySelectorAll('.conf-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('conf-' + c)?.classList.add('selected');
  setConfGauge(c);
  checkCommitReady();
}

function selectTag(t) {
  STATE.selectedTag = STATE.selectedTag === t ? null : t;
  document.querySelectorAll('.microtag-btn').forEach(b => b.classList.remove('selected'));
  if (STATE.selectedTag) document.getElementById('tag-' + STATE.selectedTag)?.classList.add('selected');
  // Update causal bars
  if (STATE.selectedTag === 'causal') setCausalBars(4);
  else if (STATE.selectedTag === 'eliminacion') setCausalBars(2);
  else if (STATE.selectedTag === 'libro') setCausalBars(3);
  else setCausalBars(1);
}

function checkCommitReady() {
  const btn = document.getElementById('commitBtn');
  if (btn) btn.disabled = !(STATE.selectedOption !== null && STATE.selectedConfidence !== null);
}

function commitAnswer() {
  if (STATE.selectedOption === null || STATE.selectedConfidence === null) return;
  stopTimer();
  const btn = document.getElementById('commitBtn');
  if (btn) {
    btn.classList.add('locked','locking');
    const icon = document.getElementById('lockIcon');
    if (icon) icon.innerHTML = '<span class="ep-icon ep-icon--lock" aria-hidden="true"></span>';
    btn.disabled = true;
  }
  STATE.stage = 'cross';
  render();
}

// -----------------------------------------------------------------------
// STAGE 4: CROSS-EXAMINE
// -----------------------------------------------------------------------
function renderCross() {
  const q = currentQ();
  STATE.crossChanged = false;
  document.getElementById('mainContent').innerHTML = `
    <div class="fade-in">
      <div class="q-counter">Pregunta <strong>${STATE.questionIndex + 1} de ${QUESTIONS.length}</strong></div>
      <div class="section-label section-label--stage">Contraste · Pre-revelación</div>

      <div class="question-text">${escapeHtml(q.text)}</div>

      <div class="cross-current-answer">
        Tu respuesta:
        <strong class="cross-current-answer-value">${String.fromCharCode(65 + STATE.selectedOption)}. ${escapeHtml(q.options[STATE.selectedOption])}</strong>
      </div>

      ${q.cross_exam_challenge ? `
      <div class="cross-challenge">
        <div class="cross-challenge-label"><span class="ep-icon ep-icon--confidence-signal" aria-hidden="true"></span> Desafío del mentor</div>
        <div class="cross-challenge-text">${escapeHtml(q.cross_exam_challenge)}</div>
      </div>` : ''}

      <div class="cross-confirmation-copy">
        ¿Confirmas tu respuesta o deseas cambiarla?
      </div>

      <div class="hesitation-track">
        <div class="hesitation-dot" id="hesitationDot"></div>
        <span id="hesitationLabel" class="hesitation-track-label">Sin vacilación registrada</span>
      </div>

      <div class="btn-row cross-actions">
        <button class="btn btn--shine btn--glow commit-btn" onclick="confirmCross()"><span class="ep-icon ep-icon--lock" aria-hidden="true"></span> Confirmo mi respuesta</button>
        <button class="btn btn--ghost" onclick="changeCross()">Cambiar respuesta</button>
      </div>

      <div id="changeOptionsArea" class="hidden change-options-area">
        <div class="change-options-label">
          Selecciona nueva respuesta (bloqueo definitivo):
        </div>
        <div class="options-list" id="changeOptionsList">
          ${q.options.map((o, i) => `
            <button class="btn btn--ghost option-btn ${i === STATE.selectedOption ? 'selected' : ''}" id="chopt${i}" onclick="reSelectOption(${i})">
              <span class="opt-letter">${String.fromCharCode(65+i)}</span>
              <span>${escapeHtml(o)}</span>
            </button>
          `).join('')}
        </div>
        <button class="btn btn--shine btn--glow commit-btn change-options-submit" onclick="hardLock()">
          <span class="ep-icon ep-icon--lock" aria-hidden="true"></span> Confirmar nueva respuesta (definitivo)
        </button>
      </div>
    </div>
  `;
}

function changeCross() {
  STATE.crossChanged = true;
  document.getElementById('hesitationDot')?.classList.add('triggered');
  const lbl = document.getElementById('hesitationLabel');
  if (lbl) lbl.innerHTML = '<span class="ep-icon ep-icon--confidence-signal" aria-hidden="true"></span> Vacilación detectada';
  document.getElementById('changeOptionsArea')?.classList.remove('hidden');
}

function reSelectOption(i) {
  STATE.selectedOption = i;
  document.querySelectorAll('[id^="chopt"]').forEach((b, idx) => b.classList.toggle('selected', idx === i));
}

function confirmCross() { goToReveal(); }
function hardLock()     { goToReveal(); }

function showAnswerError(message){
  let alert=document.getElementById('answerValidationError');
  if(!alert){
    alert=document.createElement('div');
    alert.id='answerValidationError';
    alert.setAttribute('role','alert');
    alert.className='answer-validation-error';
    document.getElementById('mainContent')?.prepend(alert);
  }
  alert.textContent=message;
}

async function goToReveal() {
  stopTimer();
  const q = currentQ();
  // Server-side grading + post-answer pedagogical result. The browser submits
  // the chosen option; the backend decides correctness and returns ONLY the
  // final result the student is allowed to see.
  let isCorrect = false;
  try {
    const token = await requireAuth();
    const selLetter = (typeof STATE.selectedOption === 'number')
      ? String.fromCharCode(65 + STATE.selectedOption) : '';
    const resp = await fetchWithTimeout('https://hylknjjhmxsuuwbsslkr.supabase.co/functions/v1/validate-sba-answer', {
      method:'POST',
      headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
      cache:'no-store',
      body: JSON.stringify({
        item_id:q.id,
        selected_letter:selLetter,
        mode:STATE.mentorMode,
        session_mode:ACTIVE_MODE
      })
    });
    if (resp.ok) {
      const r = await resp.json();
      if(typeof r.correct_index!=='number') throw new Error('Invalid validation response');
      isCorrect = !!r.correct;
      if (typeof r.correct_index === 'number') q.correct_index = r.correct_index;
      q.correct_letter = r.correct_letter || q.correct_letter;
      q.causal_chain = r.causal_chain || null;
      q.micro_drill = r.micro_drill || null;
      q.feedback_by_mode = r.feedback ? { mentor:r.feedback, trainer:r.feedback, reviewer:r.feedback } : null;
    } else {
      console.error('validate-sba-answer status:', resp.status);
      showAnswerError('No pudimos validar tu respuesta. Intenta de nuevo; tu avance no se perdió.');
      return;
    }
  } catch(e){
    console.error('validate-sba-answer error:', e);
    showAnswerError('No pudimos validar tu respuesta. Revisa tu conexión e intenta de nuevo.');
    return;
  }
  STATE.session.answered++;
  if (isCorrect) STATE.session.correct++;
  if (!isCorrect && STATE.selectedConfidence === 'seguro') STATE.session.overconfident++;
  if (STATE.crossChanged) STATE.session.hesitated++;
  // Phase Y.2 — longitudinal history (Performance Analytics + Weakness Engine)
  STATE.attempts.push({ question_id: q.source_question_id, ra_id: q.ra, topic: q.topic, correct: isCorrect });
  // Update instruments
  if (!isCorrect && STATE.selectedConfidence === 'seguro') activateMisconGlyph(true);
  if (STATE.crossChanged) triggerHesDot(Math.min(STATE.session.hesitated - 1, 3));
  STATE.stage = 'reveal';
  render();
}

// -----------------------------------------------------------------------
// STAGE 5: REVEAL
// -----------------------------------------------------------------------
// -----------------------------------------------------------------------
// REVEAL ANIMATIONS — Fase de animación unificada del sistema. La cabina
// ya tiene su propio vocabulario visual para la fase de PREGUNTA (orbe,
// vacilación, lock-bounce); esto anima solo la fase de RESULTADO (reveal
// por pregunta y mapa cognitivo de sesión), con el mismo espíritu que
// Open Response Lab / Mentor / Dashboard / Simulacro: nada de "BIEN/MAL"
// como golpe seco, sino una revelación en cascada que además señala dónde
// reforzar. Respeta prefers-reduced-motion.
// -----------------------------------------------------------------------
function animateResultReveal() {
  var root = document.getElementById('mainContent');
  if (!root) return;
  var badge = root.querySelector('.correctness-badge');
  var chips = root.querySelectorAll('.reveal-metrics .metric-chip');
  var nodes = root.querySelectorAll('.causal-node');
  function reveal() {
    if (badge) badge.classList.add('rv-in');
    chips.forEach(function (c, idx) { c.style.setProperty('--i', String(idx)); c.classList.add('rv-in'); });
    nodes.forEach(function (n, idx) { n.style.setProperty('--i', String(idx)); n.classList.add('rv-in'); });
  }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveal();
  } else {
    requestAnimationFrame(function () { requestAnimationFrame(reveal); });
  }
}
function animateMapReveal(accuracy) {
  var root = document.getElementById('mainContent');
  if (!root) return;
  if (window.LI) LI.applyProgressStyles(root);
  var cells = root.querySelectorAll('.stat-cell');
  var chips = root.querySelectorAll('.metric-chip');
  var ringValue = root.querySelector('.stat-ring-value');
  var finalOffset = 263.9 * (1 - accuracy / 100);
  function reveal() {
    if (ringValue) ringValue.setAttribute('stroke-dashoffset', String(finalOffset));
    cells.forEach(function (c, idx) { c.style.setProperty('--i', String(idx)); c.classList.add('rv-in'); });
    chips.forEach(function (c, idx) { c.style.setProperty('--i', String(idx)); c.classList.add('rv-in'); });
  }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reveal();
  } else {
    requestAnimationFrame(function () { requestAnimationFrame(reveal); });
  }
}
function renderReveal() {
  const q = currentQ();
  const isCorrect = (typeof q.correct_index === 'number') && (STATE.selectedOption === q.correct_index);
  const timing = getTimingBand(STATE.timeElapsed);
  const isOverconf = !isCorrect && STATE.selectedConfidence === 'seguro';
  const _fbm=q.feedback_by_mode||{}; const feedback=_fbm[STATE.mentorMode]||_fbm.mentor||fallbackFeedback(q);
  const correctIdx = (typeof q.correct_index === 'number') ? q.correct_index : -1;

  document.getElementById('mainContent').innerHTML = `
    <div class="fade-in">
      <div class="q-counter">Pregunta <strong>${STATE.questionIndex + 1} de ${QUESTIONS.length}</strong></div>
      <div class="section-label section-label--stage">Resultado y retroalimentación</div>

      <div class="correctness-badge ${isCorrect ? 'correct' : 'wrong'}">
        <div class="correctness-icon"><span class="ep-icon ep-icon--${isCorrect ? 'success' : 'error'}" aria-hidden="true"></span><span class="ep-sr-only">${isCorrect ? 'Respuesta correcta' : 'Respuesta incorrecta'}</span></div>
        <div>
          <div class="correctness-text">${isCorrect ? 'Respuesta correcta' : 'Respuesta incorrecta'}</div>
          <div class="correctness-detail">
            ${isCorrect
              ? 'Bien razonado.'
              : (correctIdx>=0 ? `La correcta era: <strong class="correct-answer-letter">${String.fromCharCode(65 + correctIdx)}</strong>` : '')}
          </div>
        </div>
      </div>

      ${isOverconf ? `<div class="overconf-banner"><span class="ep-icon ep-icon--warning" aria-hidden="true"></span> Sobreconfianza detectada — respondiste "Seguro/a" pero la respuesta fue incorrecta</div>` : ''}

      <div class="reveal-metrics">
        <div class="metric-chip">
          <div class="metric-chip-label">Tiempo de respuesta</div>
          <div class="metric-chip-value ${timing.cls}">${STATE.timeElapsed} s</div>
        </div>
        <div class="metric-chip">
          <div class="metric-chip-label">Banda temporal</div>
          <div class="metric-chip-value metric-chip-value--small ${timing.cls}">${timing.label}</div>
        </div>
        <div class="metric-chip">
          <div class="metric-chip-label">Confianza declarada</div>
          <div class="metric-chip-value ${isOverconf ? 'danger' : ''}">${getConfLabel(STATE.selectedConfidence)}</div>
        </div>
        <div class="metric-chip">
          <div class="metric-chip-label">Vacilación</div>
          <div class="metric-chip-value ${STATE.crossChanged ? 'warn' : ''}">${STATE.crossChanged ? 'Sí — cambiada' : 'No'}</div>
        </div>
      </div>

      <div class="reveal-options">
        <div class="reveal-options-label">Opciones</div>
        <div class="options-list">
          ${q.options.map((o, i) => `
            <button class="btn btn--ghost option-btn ${
              i === correctIdx ? 'correct-reveal' :
              (i === STATE.selectedOption && !isCorrect) ? 'wrong-reveal' : 'neutral-reveal'
            }" disabled>
              <span class="opt-letter">${String.fromCharCode(65+i)}</span>
              <span>${escapeHtml(o)}</span>
            </button>
          `).join('')}
        </div>
      </div>

      ${q.causal_chain ? `
      <div class="causal-chain">
        <div class="causal-chain-title">▶ Cadena Causal</div>
        <div class="causal-flow">
          <div class="causal-node causa">
            <div class="causal-node-label">Causa</div>
            <div class="causal-node-text">${escapeHtml(q.causal_chain.causa||'')}</div>
          </div>
          <div class="causal-arrow">→</div>
          <div class="causal-node mecanismo">
            <div class="causal-node-label">Mecanismo</div>
            <div class="causal-node-text">${escapeHtml(q.causal_chain.mecanismo||'')}</div>
          </div>
          <div class="causal-arrow">→</div>
          <div class="causal-node efecto">
            <div class="causal-node-label">Efecto</div>
            <div class="causal-node-text">${escapeHtml(q.causal_chain.efecto||'')}</div>
          </div>
        </div>
      </div>` : ''}

      ${q.distractor_traps ? `
      <div class="feedback-block">
        <div class="feedback-block-title distractor">Trampas de distractor</div>
        <p>${escapeHtml(q.distractor_traps)}</p>
      </div>` : ''}

      ${q.misconception ? `
      <div class="feedback-block">
        <div class="feedback-block-title misconception">Misconception frecuente</div>
        <p><em>${escapeHtml(q.misconception)}</em></p>
      </div>` : ''}

      ${q.sat_relevance ? `
      <div class="feedback-block">
        <div class="feedback-block-title sat">Relevancia SAT</div>
        <p>${escapeHtml(q.sat_relevance)}</p>
      </div>` : ''}

      <div class="feedback-block">
        <div class="feedback-block-title mentor">${q.feedback_by_mode ? mentorLabel() : 'Guía de repaso'}</div>
        <p>${escapeHtml(feedback)}</p>
      </div>

      <button class="btn btn--shine btn--glow nav-btn primary-nav" onclick="goToTrain()">${
        q.micro_drill
          ? 'Continuar → Micro-entrenamiento SBA'
          : (STATE.questionIndex + 1 < QUESTIONS.length ? 'Siguiente pregunta →' : 'Ver Mapa Cognitivo →')
      }</button>
    </div>
  `;
  animateResultReveal();
}

// -----------------------------------------------------------------------
// STAGE 6: TRAIN — micro_sba ONLY
// -----------------------------------------------------------------------
function renderTrain() {
  const q = currentQ();
  const drill=q.micro_drill||null;
  if(!drill){nextQuestion();return;}
  STATE.drillSelectedOption = null;
  STATE.drillSubmitted = false;

  document.getElementById('mainContent').innerHTML = `
    <div class="fade-in">
      <div class="q-counter">Pregunta <strong>${STATE.questionIndex + 1} de ${QUESTIONS.length}</strong></div>
      <div class="section-label section-label--stage">Micro-entrenamiento</div>

      <div class="drill-section">
        <div class="drill-title">▶ Ejercicio de Consolidación · SBA</div>
        <div class="drill-prompt">${escapeHtml(drill.prompt)}</div>

        <div class="drill-options" id="drillOptions">
          ${drill.options.map((o, i) => `
            <button class="btn btn--ghost drill-opt-btn" id="dopt${i}" onclick="selectDrillOption(${i})">
              <span class="drill-opt-letter">${String.fromCharCode(65+i)}</span>
              <span>${escapeHtml(o)}</span>
            </button>
          `).join('')}
        </div>

        <button class="btn btn--shine btn--glow commit-btn drill-submit-btn" id="drillSubmitBtn" onclick="submitDrill()" disabled>
          Verificar respuesta
        </button>

        <div id="drillExplanation" class="drill-explanation"></div>
      </div>

      <button class="btn btn--ghost nav-btn" id="nextQBtn" hidden onclick="nextQuestion()">
        ${STATE.questionIndex + 1 < QUESTIONS.length ? 'Siguiente pregunta →' : 'Ver Mapa Cognitivo →'}
      </button>
    </div>
  `;
}

function selectDrillOption(i) {
  if (STATE.drillSubmitted) return;
  STATE.drillSelectedOption = i;
  document.querySelectorAll('.drill-opt-btn').forEach((b, idx) => b.classList.toggle('drill-selected', idx === i));
  const btn = document.getElementById('drillSubmitBtn');
  if (btn) btn.disabled = false;
}

function submitDrill() {
  if (STATE.drillSubmitted || STATE.drillSelectedOption === null) return;
  STATE.drillSubmitted = true;
  const q = currentQ();
  const drill=q.micro_drill||null;
  if(!drill){nextQuestion();return;}
  const isCorrect = STATE.drillSelectedOption === drill.correct_index;

  document.querySelectorAll('.drill-opt-btn').forEach((b, i) => {
    b.disabled = true;
    b.classList.remove('drill-selected');
    if (i === drill.correct_index) b.classList.add('drill-correct-reveal');
    else if (i === STATE.drillSelectedOption && !isCorrect) b.classList.add('drill-wrong-reveal');
    else b.classList.add('drill-neutral-reveal');
  });

  const expEl = document.getElementById('drillExplanation');
  if (expEl) {
    expEl.className = 'drill-explanation ' + (isCorrect ? 'correct' : 'wrong');
    expEl.innerHTML = isCorrect ? '<span class="ep-icon ep-icon--success" aria-hidden="true"></span> ' + drill.explanation : '<span class="ep-icon ep-icon--error" aria-hidden="true"></span> ' + drill.remediation_signal + ' · Respuesta correcta: ' + String.fromCharCode(65 + drill.correct_index) + '.';
  }

  const btn = document.getElementById('drillSubmitBtn');
  if (btn) { btn.disabled = true; btn.classList.add('is-submitted'); }

  document.getElementById('nextQBtn').hidden = false;
}

function nextQuestion() {
  if (STATE.questionIndex + 1 < QUESTIONS.length) {
    STATE.questionIndex++;
    STATE.stage = 'prepare';
  } else {
    STATE.stage = 'map';
  }
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -----------------------------------------------------------------------
// STAGE 7: SESSION MAP
// -----------------------------------------------------------------------
function renderMap() {
  stopTimer();
  // Phase Y.2 — record session once into shared learner history
  if (window.LI && !STATE.historyRecorded && STATE.attempts.length) {
    LI.recordSBASession('dsba_' + Date.now(), ACTIVE_MODE || 'standard', STATE.attempts);
    STATE.historyRecorded = true;
  }
  const s = STATE.session;
  const total = s.answered || 1;
  const accuracy = Math.round((s.correct / total) * 100);
  const overconfRate = Math.round((s.overconfident / total) * 100);
  const hesRate = Math.round((s.hesitated / total) * 100);
  const causalWeakness = 100 - accuracy;
  const trapSusc = Math.round(((total - s.correct) / total) * 60);

  const radarData = [
    accuracy,
    Math.max(0, 100 - overconfRate * 2),
    Math.max(0, 100 - hesRate * 2),
    Math.max(0, 100 - causalWeakness),
    Math.max(0, 100 - trapSusc)
  ];
  const radarLabels = ['Precisión','Calibración','Decisión','Causal','Anti-trampa'];

  function patternNote() {
    if (s.overconfident > 0 && s.hesitated > 0)
      return 'Patrón mixto: sobreconfianza en algunos ítems, vacilación en otros. Revisa tu calibración antes del examen.';
    if (s.overconfident > 0)
      return 'Tendencia a sobreestimar la certeza. Practica identificar cuándo estás razonando vs. recordando.';
    if (s.hesitated > 0)
      return 'Tendencia a vacilar bajo presión de contraste. Confía más en tu primer razonamiento causal.';
    if (accuracy === 100)
      return 'Excelente sesión. Todas las respuestas correctas. Aumenta el modo de presión para el siguiente ciclo.';
    return 'Tiendes a confundir causa con correlación en cadenas complejas. Practica la estructura CAUSA → MECANISMO → EFECTO.';
  }

  document.getElementById('mainContent').innerHTML = `
    <div class="fade-in">
      <div class="section-label section-label--map">Mapa Cognitivo · Sesión completada</div>

      <div class="stat-ring-wrap"><svg class="stat-ring rv-in" viewBox="0 0 100 100" role="img" aria-label="Precisión global: ${accuracy}%"><circle class="stat-ring-track" cx="50" cy="50" r="42"/><circle class="stat-ring-value" cx="50" cy="50" r="42" stroke-dasharray="263.9" stroke-dashoffset="263.9"/><text x="50" y="55" text-anchor="middle">${accuracy}%</text></svg></div>

      <div class="session-stats-grid">
        <div class="stat-cell">
          <div class="stat-cell-label">Precisión global</div>
          <div class="stat-cell-value ${accuracy >= 75 ? 'good' : accuracy >= 50 ? 'warn' : 'danger'}">${accuracy}%</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Correctas / Total</div>
          <div class="stat-cell-value">${s.correct} / ${s.answered}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Sobreconfianza</div>
          <div class="stat-cell-value ${s.overconfident > 0 ? 'warn' : ''}">${s.overconfident > 0 ? s.overconfident + ' evento(s)' : '—'}</div>
        </div>
        <div class="stat-cell">
          <div class="stat-cell-label">Vacilaciones</div>
          <div class="stat-cell-value ${s.hesitated > 0 ? 'warn' : ''}">${s.hesitated > 0 ? s.hesitated : '—'}</div>
        </div>
      </div>

      <div class="radar-wrap">${buildRadarSVG(radarData, radarLabels)}</div>

      <div class="pattern-note">
        <strong>Patrón detectado:</strong> ${patternNote()}
      </div>

      <div class="feedback-block">
        <div class="feedback-block-title mentor">Resumen de sesión · ${mentorLabel()}</div>
        <p>
          Completaste ${s.answered} pregunta(s) de entrenamiento.
          ${s.correct === s.answered
            ? 'Todas correctas — demuestras dominio de los conceptos evaluados.'
            : `${s.correct} correcta(s). Las preguntas fallidas son oportunidades de diagnóstico, no penalizaciones.`}
          ${s.overconfident > 0 ? ' La sobreconfianza detectada sugiere revisar la técnica de calibración antes del examen oficial.' : ''}
          ${s.hesitated > 0 ? ' Las vacilaciones indican áreas donde el razonamiento causal necesita consolidación adicional.' : ''}
        </p>
      </div>

      <div class="cognitive-indicators-label">
        Indicadores de huella cognitiva
      </div>
      <div class="cognitive-indicators-grid">
        ${radarLabels.map((l, i) => `
          <div class="metric-chip metric-chip--centered">
            <div class="metric-chip-label">${l}</div>
            <div class="metric-chip-value ${radarData[i] >= 70 ? 'good' : radarData[i] >= 40 ? 'warn' : 'danger'}">${radarData[i]}</div>
          </div>
        `).join('')}
      </div>

      <button class="btn btn--shine btn--glow nav-btn primary-nav" onclick="restartSession()">Nueva sesión de entrenamiento</button>
      <button class="btn btn--ghost nav-btn" onclick="restartSession()">Repasar desde pregunta 1</button>

      <div class="session-info-panel session-info-panel--progress">
        <div class="session-info-title">
          Tu progreso acumulado
        </div>
        ${window.LI ? LI.renderProgress() : ''}
      </div>

      <div class="session-info-panel session-info-panel--governance">
        <div class="session-info-title">
          Recordatorio de gobernanza
        </div>
        <div class="session-info-copy">
          Este es un instrumento de entrenamiento para desarrollar tu razonamiento.
          Tu progreso se registra automáticamente.
        </div>
      </div>
    </div>
  `;
  animateMapReveal(accuracy);
}

// -----------------------------------------------------------------------
// RADAR SVG
// -----------------------------------------------------------------------
function buildRadarSVG(data, labels) {
  const cx = 150, cy = 150, r = 108;
  const n = data.length;
  function toCart(angle, radius) {
    const rad = (angle - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }
  let gridLines = '';
  [20,40,60,80,100].forEach(pct => {
    const rr = (pct/100)*r;
    const pts = Array.from({length:n},(_,i)=>{const {x,y}=toCart((360/n)*i,rr);return x+','+y;}).join(' ');
    gridLines += `<polygon points="${pts}" fill="none" stroke="#1e2430" stroke-width="0.8"/>`;
  });
  let axes = '';
  for (let i=0;i<n;i++) {
    const {x,y}=toCart((360/n)*i,r);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#1e2430" stroke-width="0.8"/>`;
  }
  const dataPts = data.map((d,i)=>{const {x,y}=toCart((360/n)*i,(d/100)*r);return x+','+y;}).join(' ');
  let lbls='', dots='';
  labels.forEach((l,i) => {
    const {x,y}=toCart((360/n)*i,r+22);
    lbls+=`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="#a7b0be" font-size="11" font-family="system-ui">${l}</text>`;
  });
  data.forEach((d,i) => {
    const {x,y}=toCart((360/n)*i,(d/100)*r);
    dots+=`<circle cx="${x}" cy="${y}" r="3.5" fill="var(--gold)"/>`;
  });
  return `<svg viewBox="0 0 300 300" width="280" height="280" xmlns="http://www.w3.org/2000/svg">${gridLines}${axes}<polygon points="${dataPts}" fill="var(--gold)" fill-opacity="0.12" stroke="var(--gold)" stroke-width="1.5"/>${dots}${lbls}<circle cx="${cx}" cy="${cy}" r="3" fill="#3a3a4a"/></svg>`;
}

// -----------------------------------------------------------------------
// UTILS
// -----------------------------------------------------------------------
function getTimingBand(secs) {
  if (secs < 30) return { label: 'Respuesta rápida (<30 s)', cls: 'good' };
  if (secs <= 60) return { label: 'Ritmo normal (30–60 s)', cls: '' };
  return { label: 'Indecisión (>60 s)', cls: 'warn' };
}
function getConfLabel(conf) {
  return { seguro:'Seguro/a', bastante:'Bastante seguro/a', dudas:'Tengo dudas', adivinando:'Estoy adivinando' }[conf] || '—';
}

function goToRead()    { STATE.stage = 'read';   render(); window.scrollTo({top:0,behavior:'smooth'}); }
function goToCommit()  { stopTimer(); STATE.stage = 'commit'; render(); window.scrollTo({top:0,behavior:'smooth'}); }
function goToTrain()   { STATE.stage = 'train';  render(); window.scrollTo({top:0,behavior:'smooth'}); }

function restartSession() {
  STATE.crossChanged=false; STATE.drillSelectedOption=null; STATE.drillSubmitted=false;
  STATE.session={answered:0,correct:0,overconfident:0,hesitated:0,causalWeakness:0,trapSusceptibility:0};
  STATE.attempts=[]; STATE.historyRecorded=false;
  resetConfGauge(); setCausalBars(0); activateMisconGlyph(false);
  document.querySelectorAll('.hes-dot').forEach(d=>d.classList.remove('triggered'));
  document.getElementById('hesLabel').textContent='—';
  document.getElementById('mode-overlay').classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

// -----------------------------------------------------------------------
// INIT
// -----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded',function(){
  // Mode overlay visible; quiz starts on mode selection.
});
