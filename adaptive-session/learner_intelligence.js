// learner_intelligence.js — Phase Y.1 vertical slice + Phase Y.2 (verbs, OR, shared)
// Distinction Coach + Performance Analytics + Adaptive Weakness Engine.
// Entrenamiento formativo. NO evaluación oficial WSET. safe_for_examiner=false.
// Deterministic client-side logic over localStorage history. No network calls.
window.LI = (function () {
  'use strict';
  const HK = 'wset_learner_history_v1';
  const CAP = 50; // max stored sessions

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function coach() { return window.DISTINCTION_COACH || null; }

  /* ───────── History (shared foundation) ───────── */
  function history() {
    try { return JSON.parse(localStorage.getItem(HK) || '[]'); } catch (e) { return []; }
  }
  function append(rec) {
    try {
      const h = history();
      h.push(rec);
      localStorage.setItem(HK, JSON.stringify(h.slice(-CAP)));
    } catch (e) { /* localStorage unavailable */ }
  }
  function recordSBASession(sessionId, mode, attempts) {
    append({
      type: 'sba', session_id: sessionId, mode: mode,
      completed_at: new Date().toISOString(),
      attempts: attempts.map(a => ({
        question_id: a.question_id, ra_id: a.ra_id || null,
        topic: a.topic || null, correct: !!a.correct,
      })),
    });
  }
  function recordSATSession(mode, reviews) {
    append({
      type: 'sat', mode: mode, completed_at: new Date().toISOString(),
      reviews: reviews.map(r => ({
        prompt_id: r.prompt_id,
        issues: (r.findings || []).filter(f => !f.ok).map(f => f.code),
      })),
    });
  }
  // Phase Y.2 — open-response sessions (command-verb performance)
  function recordORSession(mode, results) {
    append({
      type: 'or', mode: mode, completed_at: new Date().toISOString(),
      items: (results || []).map(r => ({
        item_id: r.item_id, ra_id: r.ra_id || null, topic: r.topic || null,
        verb: r.verb || null,
        concepts_total: r.concepts_total | 0,
        concepts_absent: r.concepts_absent | 0,
        causal_missing: !!r.causal_missing,
        structure_ok: (typeof r.structure_ok === 'boolean') ? r.structure_ok : null,
        chain_fuerza: r.chain_fuerza || null,
      })),
    });
  }

  /* ───────── Command-verb detection (deterministic, ES/EN) ───────── */
  const VERB_PATTERNS = [
    ['identify_explain', /identifi[a-z]*\s+y\s+expli|identify\s+and\s+explain/],
    ['describe', /\bdescri/],
    ['explain', /\bexpli|\bexplain/],
    ['compare', /\bcompar/],
    ['justify', /\bjustifi|\bjustify/],
    ['evaluate', /\bevalu/],
    ['assess', /\bvalor|\bassess/],
    ['why', /\bpor\s+que\b|\bwhy\b/],
    ['discuss', /\bdiscut|\banaliz|\bdiscuss/],
    ['outline', /\besboz|\bresum|\boutline/],
    ['list', /\benumer|\blist[ae]?\b/],
    ['state', /\bindiqu|\bindica\b|\bsenal|\bmencion|\bstate\b/],
    ['how', /^[¿?\s]*como\b|\bde\s+que\s+manera\b/],
  ];
  function detectVerb(text) {
    if (window.VerbContract) return window.VerbContract.detect(text);
    const low = String(text || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (let i = 0; i < VERB_PATTERNS.length; i++) {
      if (VERB_PATTERNS[i][1].test(low)) return VERB_PATTERNS[i][0];
    }
    return null;
  }

  /* ───────── Phase Z — Matriz Maestra WSET L3 (estructura por verbo) ───────── */
  // Patrón pedagógico, no scoring oficial.
  const VERB_MATRIX_FALLBACK = {
    describe: { busca: 'Características objetivas. No análisis, no ventajas/desventajas.', estructura: ['Qué es', 'Características', 'Datos relevantes'], causal: false },
    explain: { busca: 'Relación causa-efecto.', estructura: ['Factor', 'Consecuencia', 'Resultado', 'Impacto en calidad'], causal: true },
    why: { busca: 'Justificación.', estructura: ['Problema', 'Método utilizado', 'Beneficio obtenido', 'Impacto final'], causal: true },
    how: { busca: 'Mecanismo.', estructura: ['Factor', 'Mecanismo', 'Resultado', 'Impacto final'], causal: true },
    discuss: { busca: 'Análisis.', estructura: ['Factor', 'Qué provoca', 'Cómo afecta el estilo', 'Cómo afecta la calidad'], causal: true },
    assess: { busca: 'Valoración.', estructura: ['Ventajas', 'Desventajas', 'Conclusión'], causal: false, balance: true },
    evaluate: { busca: 'Juicio crítico.', estructura: ['Aspecto positivo', 'Importancia', 'Aspecto negativo', 'Importancia', 'Balance final'], causal: false, balance: true, frases: ['En conjunto…', 'En general…'] },
    compare: { busca: 'Comparación directa, factor a factor.', estructura: ['Factor', 'Región A', 'Región B', 'Impacto'], causal: false, compare: true },
    identify_explain: { busca: 'Reconocimiento + análisis.', estructura: ['Identificar', 'Explicar', 'Consecuencia', 'Resultado'], causal: true },
    justify: { busca: 'Justificación con evidencia.', estructura: ['Juicio', 'Evidencia', 'Evidencia', 'Conclusión'], causal: true },
    outline: { busca: 'Resumen estructurado.', estructura: ['Punto principal 1', 'Punto principal 2', 'Punto principal 3'], causal: false },
    state: { busca: 'Dato puntual.', estructura: ['Respuesta breve'], causal: false },
    list: { busca: 'Enumeración sin explicación.', estructura: ['Elementos'], causal: false },
  };
  const VERB_MATRIX = window.VerbContract ? window.VerbContract.matrix() : VERB_MATRIX_FALLBACK;

  const CAUSAL_CONNECTORS = ['porque', 'ya que', 'debido', 'por lo tanto', 'esto provoca', 'lo que', 'conduce', 'resulta', 'provoca', 'produce', 'da lugar', 'como consecuencia', 'por ello'];
  const BALANCE_MARKERS = ['en conjunto', 'en general', 'sin embargo', 'por otro lado', 'en balance', 'aunque'];
  const COMPARE_MARKERS = ['mientras que', 'en cambio', 'a diferencia', 'frente a', 'whereas', 'mientras'];

  function _norm(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  // Estructura cognitiva esperada para el verbo — verificación determinista.
  function structureCoach(verb, answer) {
    const m = VERB_MATRIX[verb]; if (!m) return null;
    const low = _norm(answer);
    const has = arr => arr.some(c => low.indexOf(c) !== -1);
    let ok = true, nota = 'Estructura adecuada para «' + verb + '».';
    if (m.causal && !has(CAUSAL_CONNECTORS)) {
      ok = false;
      nota = 'No se detecta lenguaje causa-efecto. Estructura esperada: ' + m.estructura.join(' → ') + '.';
    } else if (m.compare && !has(COMPARE_MARKERS)) {
      ok = false;
      nota = 'Compara factor a factor (Factor → Región A → Región B → Impacto); no describas una región completa y luego la otra.';
    } else if (m.balance && !has(BALANCE_MARKERS)) {
      ok = false;
      nota = 'Falta el balance final (' + m.estructura.join(' → ') + '). Frases útiles: «En conjunto…», «En general…».';
    }
    return { ok: ok, nota: nota, estructura: m.estructura, busca: m.busca };
  }

  // Universal Distinction Chain: Factor → vid → uva → vino → calidad.
  const CHAIN_STAGES = [
    ['la vid', ['vid', 'planta', 'vina', 'cepa', 'viñedo', 'vinedo']],
    ['la uva', ['uva', 'baya', 'fruta', 'maduracion', 'azucar', 'acidez de la uva']],
    ['el vino', ['vino', 'estilo', 'cuerpo', 'aroma', 'sabor', 'estructura']],
    ['la calidad', ['calidad', 'complejidad', 'equilibrio', 'concentracion', 'intensidad']],
  ];
  function chainCoach(answer) {
    const low = _norm(answer);
    const present = [], missing = [];
    CHAIN_STAGES.forEach(st => {
      (st[1].some(k => low.indexOf(k) !== -1) ? present : missing).push(st[0]);
    });
    const connector = CAUSAL_CONNECTORS.some(c => low.indexOf(c) !== -1);
    const fuerza = (present.length >= 3 && connector) ? 'completa'
      : (present.length >= 2 ? 'parcial' : 'debil');
    return { present: present, missing: missing, connector: connector, fuerza: fuerza };
  }

  /* ───────── Performance Analytics ───────── */
  function analytics() {
    const h = history();
    const ra = {}, topics = {}, satIssues = {}, verbs = {};
    const chain = { n: 0, weak: 0 };
    let sbaSessions = 0, satSessions = 0, orSessions = 0;
    h.forEach(s => {
      if (s.type === 'or') {
        orSessions++;
        (s.items || []).forEach(it => {
          if (!it.verb) return;
          const v = verbs[it.verb] = verbs[it.verb] || { n: 0, weak: 0 };
          v.n++;
          if ((it.concepts_absent | 0) > 0 || it.causal_missing || it.structure_ok === false) v.weak++;
          if (it.chain_fuerza) { chain.n++; if (it.chain_fuerza !== 'completa') chain.weak++; }
        });
        return;
      }
      if (s.type === 'sba') {
        sbaSessions++;
        (s.attempts || []).forEach(a => {
          if (a.ra_id) {
            ra[a.ra_id] = ra[a.ra_id] || { n: 0, c: 0 };
            ra[a.ra_id].n++; if (a.correct) ra[a.ra_id].c++;
          }
          if (a.topic) {
            const t = topics[a.topic] = topics[a.topic] || { n: 0, c: 0, missSessions: {} };
            t.n++; if (a.correct) t.c++; else t.missSessions[s.session_id || s.completed_at] = 1;
          }
        });
      } else if (s.type === 'sat') {
        satSessions++;
        (s.reviews || []).forEach(r => (r.issues || []).forEach(code => {
          satIssues[code] = (satIssues[code] || 0) + 1;
        }));
      }
    });
    return { ra: ra, topics: topics, satIssues: satIssues, verbs: verbs, chain: chain,
      sbaSessions: sbaSessions, satSessions: satSessions, orSessions: orSessions };
  }

  function weakSet(a) {
    a = a || analytics();
    const weakRAs = Object.keys(a.ra).filter(r => a.ra[r].n >= 4 && a.ra[r].c / a.ra[r].n < 0.6).sort();
    const weakTopics = Object.keys(a.topics)
      .filter(t => (a.topics[t].n - a.topics[t].c) >= 2)
      .sort((x, y) => (a.topics[y].n - a.topics[y].c) - (a.topics[x].n - a.topics[x].c) || x.localeCompare(y));
    const strongTopics = Object.keys(a.topics)
      .filter(t => a.topics[t].n >= 3 && a.topics[t].c / a.topics[t].n >= 0.8).sort();
    // "Misconception trend" proxy: topics failed in 2+ distinct sessions
    const mcTrends = Object.keys(a.topics)
      .filter(t => Object.keys(a.topics[t].missSessions).length >= 2).sort();
    // Command verbs with recurrent structural weakness
    const weakVerbs = Object.keys(a.verbs || {})
      .filter(v => a.verbs[v].n >= 2 && a.verbs[v].weak / a.verbs[v].n >= 0.5).sort();
    return { weakRAs: weakRAs, weakTopics: weakTopics, strongTopics: strongTopics,
      mcTrends: mcTrends, weakVerbs: weakVerbs };
  }

  /* ───────── Adaptive Weakness Engine ───────── */
  // Deterministic re-ordering: weak-area unseen items first, then unseen,
  // then seen. Preserves caller's shuffled order within each band.
  function prioritize(items, recentIds) {
    const ws = weakSet();
    const weakT = {}, weakR = {};
    ws.weakTopics.forEach(t => weakT[t] = 1);
    ws.weakRAs.forEach(r => weakR[r] = 1);
    const band = it => {
      const seen = recentIds.indexOf(it.source_question_id) !== -1;
      const weak = weakT[it.topic] || weakR[it.ra] ? 1 : 0;
      if (weak && !seen) return 0;
      if (!seen) return 1;
      if (weak) return 2;
      return 3;
    };
    return items.map((it, i) => [band(it), i, it])
      .sort((x, y) => x[0] - y[0] || x[1] - y[1])
      .map(e => e[2]);
  }

  /* ───────── Distinction Coach — SAT structural review ───────── */
  function coachSAT(text, wine) {
    const C = coach(); if (!C) return null;
    const low = String(text || '').toLowerCase();
    const findings = [];
    const isRed = /tinto|red/i.test(wine.wine_type || '');

    // 1. SAT section completeness
    (C.sat_sections || []).forEach(sec => {
      const ok = (sec.detect || []).some(k => low.indexOf(k) !== -1);
      findings.push({
        code: 'seccion_' + sec.id, ok: ok,
        label: 'Sección ' + sec.label.toUpperCase(),
        detail: ok ? 'presente' : 'no detectada — el orden WSET exige las 4 secciones',
      });
    });

    // 2. Palate element coverage
    const missing = [];
    Object.keys(C.palate_element_detect || {}).forEach(el => {
      if (el === 'tanino' && !isRed) return;
      const ok = C.palate_element_detect[el].some(k => low.indexOf(k) !== -1);
      if (!ok) missing.push(el);
    });
    findings.push({
      code: 'boca_elementos', ok: missing.length === 0,
      label: 'Elementos de BOCA',
      detail: missing.length === 0 ? 'cobertura completa'
        : 'faltan: ' + missing.join(', '),
    });

    // 3. Scale vocabulary usage
    let scaleHits = 0;
    Object.keys(C.scales || {}).forEach(k => {
      (C.scales[k] || []).forEach(v => { if (low.indexOf(String(v).toLowerCase()) !== -1) scaleHits++; });
    });
    findings.push({
      code: 'vocabulario_escalas', ok: scaleHits >= 4,
      label: 'Vocabulario de escalas SAT',
      detail: scaleHits + ' término(s) de escala oficial detectado(s)' + (scaleHits >= 4 ? '' : ' — usa los valores oficiales (p. ej. acidez alta, cuerpo medio(+))'),
    });

    // 4. Quality conclusion + justification
    const qTerm = (C.quality_terms || []).find(q => low.indexOf(q) !== -1);
    findings.push({
      code: 'calidad_declarada', ok: !!qTerm,
      label: 'Nivel de calidad',
      detail: qTerm ? ('declarado: «' + qTerm + '»') : 'no detectado — concluye con un nivel de calidad oficial',
    });
    if (qTerm) {
      const just = (C.justification_connectors || []).some(c => low.indexOf(c) !== -1);
      findings.push({
        code: 'calidad_justificada', ok: just,
        label: 'Justificación de calidad',
        detail: just ? 'razonamiento presente' : C.quality_principle,
      });
    }

    // 5. Readiness conclusion
    const rOk = /potencial|beber ahora|demasiado joven|demasiado viejo|guarda/.test(low);
    findings.push({
      code: 'estado_consumo', ok: rOk,
      label: 'Estado para el consumo',
      detail: rOk ? 'presente' : 'no detectado — indica potencial de guarda o consumo',
    });

    // 6. Simple wine exception
    if (wine.is_simple && /terciari/.test(low)) {
      findings.push({ code: 'vino_simple_terciarios', ok: false, label: 'Excepción vino simple', detail: C.simple_wine_note });
    }
    return findings;
  }

  function hintFor(findings) {
    const C = coach(); if (!C || !C.mentor_hints) return null;
    const map = [
      ['boca_elementos', 'SAT_palate'], ['seccion_boca', 'SAT_palate'],
      ['seccion_nariz', 'SAT_nose'], ['seccion_aspecto', 'SAT_appearance'],
      ['calidad_justificada', 'SAT_quality'], ['calidad_declarada', 'SAT_quality'],
      ['estado_consumo', 'SAT_readiness'],
    ];
    for (let i = 0; i < map.length; i++) {
      if (findings.some(f => f.code === map[i][0] && !f.ok)) {
        const h = C.mentor_hints[map[i][1]];
        if (h && h.hint) return h.hint;
      }
    }
    return null;
  }

  /* ───────── Rendering ───────── */
  // Phase Y.2 — Distinction Coach: command-verb guidance card
  const VERB_LABELS = {
    describe: 'DESCRIBE', explain: 'EXPLICA', compare: 'COMPARA',
    assess: 'VALORA', evaluate: 'EVALÚA', justify: 'JUSTIFICA',
  };
  function renderVerbCoach(verb) {
    const C = coach();
    const cv = C && C.command_verbs && C.command_verbs[verb];
    if (!cv) return '';
    const li = (arr, mark, toneClass) => (arr || []).map(x =>
      '<div class="li-coach-line"><span class="li-tone ' + toneClass + '">' + mark + '</span> ' + esc(x) + '</div>').join('');
    return '<div class="li-coach-card">' +
      '<div class="li-coach-heading li-coach-heading--compact">DISTINCTION COACH · VERBO DE COMANDO: ' + esc(VERB_LABELS[verb] || verb.toUpperCase()) + '</div>' +
      '<div class="li-coach-definition">' + esc(cv.definition || '') + '</div>' +
      li(cv.do, '<span class="ep-icon ep-icon--success" aria-hidden="true"></span>', 'is-ok') + li(cv.do_not, '<span class="ep-icon ep-icon--error" aria-hidden="true"></span>', 'needs-work') +
      (cv.mentor_hint ? '<div class="li-mentor-box li-mentor-box--compact"><div class="li-mentor-label">MENTOR</div><div class="li-mentor-copy li-mentor-copy--small">' + esc(cv.mentor_hint) + '</div></div>' : '') +
      '<div class="li-governance-note">Guía estructural formativa · NO evaluación oficial WSET</div></div>';
  }


  /* ───────── Phase Z — Distinction Coach para respuesta abierta ───────── */
  // contentFb (opcional): { concepts_detected:[], concepts_absent:[] }
  function coachOpenResponse(stem, answer, topic, contentFb) {
    const verb = detectVerb(stem);
    const st = verb ? structureCoach(verb, answer) : null;
    const m = verb ? VERB_MATRIX[verb] : null;
    const ch = (m && m.causal) ? chainCoach(answer) : null;
    const bien = [], mejorar = [];
    if (contentFb && (contentFb.concepts_detected || []).length) {
      bien.push('Identificas: ' + contentFb.concepts_detected.slice(0, 3).join(', ') + '.');
    }
    if (st && st.ok) bien.push(st.nota);
    if (!bien.length) bien.push('Has construido una respuesta propia — ahora afinemos su estructura.');
    if (contentFb && (contentFb.concepts_absent || []).length) {
      mejorar.push('Falta desarrollar: ' + contentFb.concepts_absent.slice(0, 3).join(', ') + '.');
    }
    if (st && !st.ok) mejorar.push(st.nota);
    if (ch && ch.fuerza !== 'completa') {
      mejorar.push('Cadena causal ' + (ch.fuerza === 'parcial' ? 'incompleta' : 'débil')
        + (ch.missing.length ? ' — no conectas el efecto con ' + ch.missing.join(' ni ') + '.' : '.')
        + ' Patrón: Factor → vid → uva → vino → impacto en calidad.');
    }
    const practica = verb && st && !st.ok
      ? 'Practica más preguntas «' + verb + '» con la estructura ' + st.estructura.join(' → ') + '.'
      : (ch && ch.fuerza !== 'completa' ? 'Practica encadenar causa → efecto hasta la calidad del vino.' : null);
    let html = '<div class="li-coach-card">'
      + '<div class="li-coach-heading">DISTINCTION COACH · TU RESPUESTA</div>';
    bien.forEach(b => { html += '<div class="li-coach-response-line"><span class="li-tone is-ok"><span class="ep-icon ep-icon--success" aria-hidden="true"></span></span> ' + esc(b) + '</div>'; });
    mejorar.forEach(x => { html += '<div class="li-coach-response-line"><span class="li-tone is-warn">△</span> ' + esc(x) + '</div>'; });
    if (topic) html += '<div class="li-coach-response-line li-coach-response-line--topic"><span class="li-tone is-gold">↻</span> Tema a repasar: ' + esc(topic) + '.</div>';
    if (practica) html += '<div class="li-coach-response-line"><span class="li-tone is-gold">→</span> ' + esc(practica) + '</div>';
    html += '<div class="li-governance-note">Guía formativa sobre estructura y razonamiento. No valida precisión enológica ni asigna notas. NO evaluación oficial WSET.</div></div>';
    return { html: html, verb: verb, structure_ok: st ? st.ok : null, chain_fuerza: ch ? ch.fuerza : null };
  }

  /* ───────── Phase Z — Próxima ruta recomendada ───────── */
  const VERB_LABELS_REF = { describe: 'Describe', explain: 'Explain', compare: 'Compare', assess: 'Assess', evaluate: 'Evaluate', justify: 'Justify', why: 'Why', how: 'How', discuss: 'Discuss', identify_explain: 'Identify & Explain', outline: 'Outline', state: 'State', list: 'List' };
  const SAT_NEXT = {
    calidad_justificada: 'Practica justificar el nivel de calidad con 3+ observaciones (BLIC).',
    calidad_declarada: 'Concluye siempre con un nivel de calidad oficial.',
    estado_consumo: 'Practica el razonamiento de potencial de guarda (SAT readiness).',
    boca_elementos: 'Repasa la lista completa de elementos de BOCA del SAT.',
    vocabulario_escalas: 'Usa los valores oficiales de las escalas SAT.',
  };
  // Y.1.1: Structured recommendation engine (not just strings)
  function recommendNext() {
    const a = analytics();
    const ws = weakSet(a);
    const recs = [];
    ws.weakVerbs.slice(0, 2).forEach(v => {
      const m = VERB_MATRIX[v];
      recs.push('Más preguntas «' + (VERB_LABELS_REF[v] || v) + '»' + (m ? ' — estructura ' + m.estructura.join(' → ') : '') + '.');
    });
    ws.weakRAs.slice(0, 2).forEach(r => recs.push('Refuerza ' + r + ' en tu próxima sesión SBA.'));
    ws.weakTopics.slice(0, 3).forEach(t => recs.push('Repasa el tema: ' + t + '.'));
    if (a.chain.n && a.chain.weak / a.chain.n >= 0.5) {
      recs.push('Entrena la cadena: Factor → vid → uva → vino → impacto en calidad.');
    }
    Object.keys(a.satIssues).sort((x, y) => a.satIssues[y] - a.satIssues[x] || x.localeCompare(y))
      .slice(0, 2).forEach(k => { if (SAT_NEXT[k]) recs.push(SAT_NEXT[k]); });
    return recs;
  }

  // Y.1.1: Structured remediation recommendation
  function remediationPlan() {
    const a = analytics();
    const ws = weakSet(a);
    if (!ws.weakRAs.length && !ws.weakTopics.length && !ws.weakVerbs.length) {
      return {
        status: 'ready',
        message: 'Tu progreso es sólido. Sigue practicando para alcanzar Distinction.',
        actions: []
      };
    }
    const actions = [];
    if (ws.weakRAs.length && a.sbaSessions >= 4) {
      ws.weakRAs.slice(0, 1).forEach(ra => {
        actions.push({
          type: 'practice_weak_ra',
          ra: ra,
          label: 'Refuerza ' + ra,
          reason: 'Principal área de mejora en SBA',
          mode: 'sba_standard'
        });
      });
    }
    if (ws.weakTopics.length && a.sbaSessions >= 3) {
      ws.weakTopics.slice(0, 1).forEach(topic => {
        actions.push({
          type: 'practice_weak_topic',
          topic: topic,
          label: 'Practica: ' + topic,
          reason: 'Tema con fallos recurrentes',
          mode: 'sba_standard'
        });
      });
    }
    if (ws.weakVerbs.length && a.orSessions >= 2) {
      ws.weakVerbs.slice(0, 1).forEach(verb => {
        actions.push({
          type: 'practice_weak_verb',
          verb: verb,
          label: 'Mejora en preguntas «' + (VERB_LABELS_REF[verb] || verb) + '»',
          reason: 'Estructura débil en respuestas abiertas',
          mode: 'open_response_standard'
        });
      });
    }
    if (a.satIssues && Object.keys(a.satIssues).length && a.satSessions >= 1) {
      const topIssue = Object.keys(a.satIssues).sort((x, y) => a.satIssues[y] - a.satIssues[x])[0];
      if (SAT_NEXT[topIssue]) {
        actions.push({
          type: 'practice_sat_issue',
          issue: topIssue,
          label: 'Mejora SAT: ' + SAT_ISSUE_LABELS[topIssue],
          reason: SAT_NEXT[topIssue],
          mode: 'sat_sprint'
        });
      }
    }
    if (!actions.length && a.sbaSessions >= 2) {
      actions.push({
        type: 'continue_practice',
        label: 'Continúa practicando SBA',
        reason: 'Aún necesitamos más datos para recomendaciones precisas',
        mode: 'sba_standard'
      });
    }
    return {
      status: actions.length ? 'has_recommendations' : 'insufficient_data',
      message: actions.length
        ? (actions.length === 1 ? 'Tu principal enfoque' : 'Tus áreas a mejorar')
        : 'Aún necesitamos más intentos para recomendar con precisión.',
      actions: actions,
      confidence: actions.length > 2 ? 'high' : (actions.length > 0 ? 'medium' : 'low')
    };
  }

  // Y.1.3: Progress tracking
  function progressReport() {
    const a = analytics();
    const ws = weakSet(a);
    const report = {
      totalSessions: a.sbaSessions + a.satSessions + a.orSessions,
      byExperience: {
        sba: { sessions: a.sbaSessions, items: Object.keys(a.topics || {}).length },
        sat: { sessions: a.satSessions, issues: Object.keys(a.satIssues || {}).length },
        or: { sessions: a.orSessions, verbs: Object.keys(a.verbs || {}).length }
      },
      weakAreas: ws.weakRAs,
      strongAreas: ws.strongTopics,
      trends: {
        improving: [],
        declining: [],
        stable: []
      }
    };
    Object.keys(a.topics || {}).forEach(t => {
      const topic = a.topics[t];
      if (topic.n >= 3) {
        const recent = topic.n - (topic.c || 0);
        if (recent < 1) report.trends.improving.push(t);
        else if (recent >= 2) report.trends.declining.push(t);
        else report.trends.stable.push(t);
      }
    });
    return report;
  }

  function renderCoachPanel(findings) {
    if (!findings) return '';
    const rows = findings.map(f =>
      '<div class="li-review-row">' +
      '<span class="li-review-mark ' + (f.ok ? 'is-ok' : 'is-warn') + '"><span class="ep-icon ep-icon--' + (f.ok ? 'success' : 'pending-step') + '" aria-hidden="true"></span></span>' +
      '<div><div class="li-review-label">' + esc(f.label) + '</div>' +
      '<div class="li-review-detail">' + esc(f.detail) + '</div></div></div>'
    ).join('');
    const hint = hintFor(findings);
    return '<div class="li-review-card">' +
      '<div class="li-coach-heading">DISTINCTION COACH · REVISIÓN ESTRUCTURAL</div>' +
      rows +
      (hint ? '<div class="li-mentor-box"><div class="li-mentor-label li-mentor-label--spaced">MENTOR</div><div class="li-mentor-copy">' + esc(hint) + '</div></div>' : '') +
      '<div class="li-governance-note li-governance-note--review">Revisión estructural formativa. No valida la precisión de tus descriptores ni asigna notas. NO evaluación oficial WSET.</div></div>';
  }

  const SAT_ISSUE_LABELS = {
    seccion_aspecto: 'Sección ASPECTO omitida', seccion_nariz: 'Sección NARIZ omitida',
    seccion_boca: 'Sección BOCA omitida', seccion_conclusiones: 'CONCLUSIONES omitidas',
    boca_elementos: 'Elementos de boca incompletos', vocabulario_escalas: 'Poco vocabulario de escalas',
    calidad_declarada: 'Calidad sin declarar', calidad_justificada: 'Calidad sin justificar',
    estado_consumo: 'Estado de consumo omitido', vino_simple_terciarios: 'Terciarios en vino simple',
  };

  function renderProgress() {
    const a = analytics();
    const ws = weakSet(a);
    if (!a.sbaSessions && !a.satSessions && !a.orSessions) {
      return '<div class="li-progress-empty">Aún no hay sesiones registradas. Completa una sesión para activar tu análisis de progreso.</div>';
    }
    let html = '<div class="li-progress">';
    // RA bars
    html += '<div class="li-progress-section-title li-progress-section-title--first">RENDIMIENTO POR RESULTADO DE APRENDIZAJE</div>';
    ['RA1', 'RA2', 'RA3', 'RA4', 'RA5'].forEach(r => {
      const d = a.ra[r];
      const pct = d && d.n ? Math.round(100 * d.c / d.n) : null;
      const toneClass = pct === null ? 'is-empty' : pct >= 75 ? 'is-ok' : pct >= 60 ? 'is-warn' : 'needs-work';
      html += '<div class="li-progress-row">' +
        '<span class="li-progress-ra">' + r + '</span>' +
        '<div class="li-progress-track">' +
        (pct === null ? '' : '<div class="li-progress-fill ' + toneClass + '" data-progress="' + pct + '"></div>') + '</div>' +
        '<span class="li-progress-value ' + toneClass + '">' + (pct === null ? 'sin datos' : pct + '% · ' + d.n) + '</span></div>';
    });
    const chips = (arr, cls) => arr.slice(0, 6).map(t => '<span class="chip ' + cls + '">' + esc(t) + '</span>').join('');
    if (ws.weakTopics.length) {
      html += '<div class="li-progress-section-title">TEMAS DÉBILES (≥2 fallos)</div><div class="db-chips">' + chips(ws.weakTopics, 'chip-amber') + '</div>';
    }
    if (ws.mcTrends.length) {
      html += '<div class="li-progress-section-title">FALLOS RECURRENTES (varias sesiones)</div><div class="db-chips">' + chips(ws.mcTrends, 'chip-red') + '</div>';
    }
    const verbKeys = Object.keys(a.verbs || {}).sort();
    if (verbKeys.length) {
      html += '<div class="li-progress-section-title">VERBOS DE COMANDO (respuesta abierta)</div>';
      verbKeys.forEach(v => {
        const d = a.verbs[v];
        const weakPct = Math.round(100 * d.weak / d.n);
        const toneClass = weakPct >= 50 ? 'needs-work' : weakPct > 0 ? 'is-warn' : 'is-ok';
        html += '<div class="li-verb-row">' +
          '<span class="li-verb-name">' + esc(VERB_LABELS[v] || v) + '</span>' +
          '<span class="li-verb-value ' + toneClass + '">' + d.weak + ' de ' + d.n + ' con lagunas estructurales</span></div>';
      });
      if (ws.weakVerbs.length) {
        html += '<div class="db-chips li-progress-chips">' + chips(ws.weakVerbs.map(v => VERB_LABELS[v] || v), 'chip-red') + '</div>';
      }
    }
    if (a.chain.n) {
      const toneClass = a.chain.weak / a.chain.n >= 0.5 ? 'needs-work' : a.chain.weak ? 'is-warn' : 'is-ok';
      html += '<div class="li-progress-section-title">CADENAS CAUSALES</div>'
        + '<div class="li-chain-value ' + toneClass + '">' + a.chain.weak + ' de ' + a.chain.n + ' respuesta(s) causal(es) con eslabones débiles</div>';
    }
    const satKeys = Object.keys(a.satIssues).sort((x, y) => a.satIssues[y] - a.satIssues[x] || x.localeCompare(y));
    if (satKeys.length) {
      html += '<div class="li-progress-section-title">DEBILIDADES SAT</div>';
      satKeys.slice(0, 5).forEach(k => {
        html += '<div class="li-progress-item">△ ' + esc(SAT_ISSUE_LABELS[k] || k) + ' <span class="li-progress-count">×' + a.satIssues[k] + '</span></div>';
      });
    }
    const recs = recommendNext();
    if (recs.length) {
      html += '<div class="li-progress-section-title">PRÓXIMA RUTA RECOMENDADA</div>';
      recs.slice(0, 5).forEach(r => { html += '<div class="li-progress-item"><span class="li-tone is-gold">→</span> ' + esc(r) + '</div>'; });
    }
    // Evolución por sesión (SBA)
    const evo = history().filter(s => s.type === 'sba' && (s.attempts || []).length)
      .slice(-5).map(s => Math.round(100 * s.attempts.filter(x => x.correct).length / s.attempts.length));
    if (evo.length >= 2) {
      html += '<div class="li-progress-section-title">EVOLUCIÓN (últimas sesiones SBA)</div>'
        + '<div class="li-progress-evolution">' + evo.join('% → ') + '%</div>';
    }
    html += '<div class="li-progress-note">' + a.sbaSessions + ' sesión(es) SBA · ' + a.satSessions + ' sesión(es) SAT · ' + a.orSessions + ' sesión(es) respuesta abierta · datos locales de entrenamiento · NO evaluación oficial WSET</div></div>';
    return html;
  }

  // applyProgressStyles: aplica el ancho CSS de las barras '--progress' tras
  // insertar el HTML de renderProgress() en el DOM (CSP-safe: CSSOM, no
  // style="" en el markup). Llamar inmediatamente después de asignar
  // innerHTML con el resultado de renderProgress().
  function applyProgressStyles(root) {
    if (!root) return;
    root.querySelectorAll('[data-progress]').forEach(function (el) {
      el.style.setProperty('--progress', el.getAttribute('data-progress') + '%');
    });
  }

  return {
    history: history, recordSBASession: recordSBASession, recordSATSession: recordSATSession,
    recordORSession: recordORSession, detectVerb: detectVerb,
    analytics: analytics, weakSet: weakSet, prioritize: prioritize,
    coachSAT: coachSAT, renderCoachPanel: renderCoachPanel, renderProgress: renderProgress,
    renderVerbCoach: renderVerbCoach, structureCoach: structureCoach, chainCoach: chainCoach,
    coachOpenResponse: coachOpenResponse, recommendNext: recommendNext,
    applyProgressStyles: applyProgressStyles,
  };
})();
