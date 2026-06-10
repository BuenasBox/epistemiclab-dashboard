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
    const low = String(text || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (let i = 0; i < VERB_PATTERNS.length; i++) {
      if (VERB_PATTERNS[i][1].test(low)) return VERB_PATTERNS[i][0];
    }
    return null;
  }

  /* ───────── Phase Z — Matriz Maestra WSET L3 (estructura por verbo) ───────── */
  // Patrón pedagógico, no scoring oficial.
  const VERB_MATRIX = {
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
    const li = (arr, mark, col) => (arr || []).map(x =>
      '<div style="font-size:11px;color:#a7b0be;margin:2px 0"><span style="color:' + col + '">' + mark + '</span> ' + esc(x) + '</div>').join('');
    return '<div style="background:#161b24;border:1px solid #2a3242;border-radius:8px;padding:14px;margin:12px 0;text-align:left">' +
      '<div style="font-size:11px;letter-spacing:.12em;color:#c9a84c;margin-bottom:6px">DISTINCTION COACH · VERBO DE COMANDO: ' + esc(VERB_LABELS[verb] || verb.toUpperCase()) + '</div>' +
      '<div style="font-size:12px;color:#f5f7fa;margin-bottom:8px">' + esc(cv.definition || '') + '</div>' +
      li(cv.do, '✓', '#2ec27e') + li(cv.do_not, '✗', '#e45c5c') +
      (cv.mentor_hint ? '<div style="margin-top:8px;background:rgba(201,168,76,.07);border:1px solid #7a6230;border-radius:6px;padding:8px"><div style="font-size:10px;color:#c9a84c;margin-bottom:2px">MENTOR</div><div style="font-size:11px;color:#a7b0be">' + esc(cv.mentor_hint) + '</div></div>' : '') +
      '<div style="font-size:10px;color:#525e6e;margin-top:8px">Guía estructural formativa · NO evaluación oficial WSET</div></div>';
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
    let html = '<div style="background:#161b24;border:1px solid #2a3242;border-radius:8px;padding:14px;margin:12px 0;text-align:left">'
      + '<div style="font-size:11px;letter-spacing:.12em;color:#c9a84c;margin-bottom:8px">DISTINCTION COACH · TU RESPUESTA</div>';
    bien.forEach(b => { html += '<div style="font-size:12px;color:#a7b0be;margin:3px 0"><span style="color:#2ec27e">✓</span> ' + esc(b) + '</div>'; });
    mejorar.forEach(x => { html += '<div style="font-size:12px;color:#a7b0be;margin:3px 0"><span style="color:#e0a93e">△</span> ' + esc(x) + '</div>'; });
    if (topic) html += '<div style="font-size:12px;color:#a7b0be;margin:6px 0 0"><span style="color:#c9a84c">↻</span> Tema a repasar: ' + esc(topic) + '.</div>';
    if (practica) html += '<div style="font-size:12px;color:#a7b0be;margin:3px 0"><span style="color:#c9a84c">→</span> ' + esc(practica) + '</div>';
    html += '<div style="font-size:10px;color:#525e6e;margin-top:8px">Guía formativa sobre estructura y razonamiento. No valida precisión enológica ni asigna notas. NO evaluación oficial WSET.</div></div>';
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

  function renderCoachPanel(findings) {
    if (!findings) return '';
    const rows = findings.map(f =>
      '<div style="display:flex;gap:8px;align-items:flex-start;padding:5px 0;border-bottom:1px solid #1c222d">' +
      '<span style="font-size:12px;color:' + (f.ok ? '#2ec27e' : '#e0a93e') + '">' + (f.ok ? '✓' : '△') + '</span>' +
      '<div><div style="font-size:12px;color:#f5f7fa">' + esc(f.label) + '</div>' +
      '<div style="font-size:11px;color:#a7b0be">' + esc(f.detail) + '</div></div></div>'
    ).join('');
    const hint = hintFor(findings);
    return '<div style="background:#161b24;border:1px solid #2a3242;border-radius:8px;padding:16px;margin:14px 0;text-align:left">' +
      '<div style="font-size:11px;letter-spacing:.12em;color:#c9a84c;margin-bottom:8px">DISTINCTION COACH · REVISIÓN ESTRUCTURAL</div>' +
      rows +
      (hint ? '<div style="margin-top:10px;background:rgba(201,168,76,.07);border:1px solid #7a6230;border-radius:6px;padding:10px"><div style="font-size:10px;color:#c9a84c;margin-bottom:3px">MENTOR</div><div style="font-size:12px;color:#a7b0be">' + esc(hint) + '</div></div>' : '') +
      '<div style="font-size:10px;color:#525e6e;margin-top:10px">Revisión estructural formativa. No valida la precisión de tus descriptores ni asigna notas. NO evaluación oficial WSET.</div></div>';
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
      return '<div style="font-size:12px;color:#a7b0be;padding:14px 0">Aún no hay sesiones registradas. Completa una sesión para activar tu análisis de progreso.</div>';
    }
    let html = '<div style="text-align:left">';
    // RA bars
    html += '<div style="font-size:11px;letter-spacing:.1em;color:#525e6e;margin:10px 0 6px">RENDIMIENTO POR RESULTADO DE APRENDIZAJE</div>';
    ['RA1', 'RA2', 'RA3', 'RA4', 'RA5'].forEach(r => {
      const d = a.ra[r];
      const pct = d && d.n ? Math.round(100 * d.c / d.n) : null;
      const col = pct === null ? '#525e6e' : pct >= 75 ? '#2ec27e' : pct >= 60 ? '#c9a84c' : '#e45c5c';
      html += '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
        '<span style="font-size:11px;color:#a7b0be;width:30px">' + r + '</span>' +
        '<div style="flex:1;height:7px;background:#1c222d;border-radius:4px;overflow:hidden">' +
        (pct === null ? '' : '<div style="width:' + pct + '%;height:100%;background:' + col + '"></div>') + '</div>' +
        '<span style="font-size:11px;color:' + col + ';width:70px;text-align:right">' + (pct === null ? 'sin datos' : pct + '% · ' + d.n) + '</span></div>';
    });
    const chips = (arr, cls) => arr.slice(0, 6).map(t => '<span class="chip ' + cls + '">' + esc(t) + '</span>').join('');
    if (ws.weakTopics.length) {
      html += '<div style="font-size:11px;letter-spacing:.1em;color:#525e6e;margin:14px 0 6px">TEMAS DÉBILES (≥2 fallos)</div><div class="db-chips">' + chips(ws.weakTopics, 'chip-amber') + '</div>';
    }
    if (ws.mcTrends.length) {
      html += '<div style="font-size:11px;letter-spacing:.1em;color:#525e6e;margin:14px 0 6px">FALLOS RECURRENTES (varias sesiones)</div><div class="db-chips">' + chips(ws.mcTrends, 'chip-red') + '</div>';
    }
    const verbKeys = Object.keys(a.verbs || {}).sort();
    if (verbKeys.length) {
      html += '<div style="font-size:11px;letter-spacing:.1em;color:#525e6e;margin:14px 0 6px">VERBOS DE COMANDO (respuesta abierta)</div>';
      verbKeys.forEach(v => {
        const d = a.verbs[v];
        const weakPct = Math.round(100 * d.weak / d.n);
        const col = weakPct >= 50 ? '#e45c5c' : weakPct > 0 ? '#c9a84c' : '#2ec27e';
        html += '<div style="display:flex;align-items:center;gap:8px;margin:3px 0">' +
          '<span style="font-size:11px;color:#a7b0be;width:78px">' + esc(VERB_LABELS[v] || v) + '</span>' +
          '<span style="font-size:11px;color:' + col + '">' + d.weak + ' de ' + d.n + ' con lagunas estructurales</span></div>';
      });
      if (ws.weakVerbs.length) {
        html += '<div class="db-chips" style="margin-top:6px">' + chips(ws.weakVerbs.map(v => VERB_LABELS[v] || v), 'chip-red') + '</div>';
      }
    }
    if (a.chain.n) {
      const ccol = a.chain.weak / a.chain.n >= 0.5 ? '#e45c5c' : a.chain.weak ? '#c9a84c' : '#2ec27e';
      html += '<div style="font-size:11px;letter-spacing:.1em;color:#525e6e;margin:14px 0 6px">CADENAS CAUSALES</div>'
        + '<div style="font-size:12px;color:' + ccol + '">' + a.chain.weak + ' de ' + a.chain.n + ' respuesta(s) causal(es) con eslabones débiles</div>';
    }
    const satKeys = Object.keys(a.satIssues).sort((x, y) => a.satIssues[y] - a.satIssues[x] || x.localeCompare(y));
    if (satKeys.length) {
      html += '<div style="font-size:11px;letter-spacing:.1em;color:#525e6e;margin:14px 0 6px">DEBILIDADES SAT</div>';
      satKeys.slice(0, 5).forEach(k => {
        html += '<div style="font-size:12px;color:#a7b0be;margin:3px 0">△ ' + esc(SAT_ISSUE_LABELS[k] || k) + ' <span style="color:#525e6e">×' + a.satIssues[k] + '</span></div>';
      });
    }
    const recs = recommendNext();
    if (recs.length) {
      html += '<div style="font-size:11px;letter-spacing:.1em;color:#525e6e;margin:14px 0 6px">PRÓXIMA RUTA RECOMENDADA</div>';
      recs.slice(0, 5).forEach(r => { html += '<div style="font-size:12px;color:#a7b0be;margin:3px 0"><span style="color:#c9a84c">→</span> ' + esc(r) + '</div>'; });
    }
    // Evolución por sesión (SBA)
    const evo = history().filter(s => s.type === 'sba' && (s.attempts || []).length)
      .slice(-5).map(s => Math.round(100 * s.attempts.filter(x => x.correct).length / s.attempts.length));
    if (evo.length >= 2) {
      html += '<div style="font-size:11px;letter-spacing:.1em;color:#525e6e;margin:14px 0 6px">EVOLUCIÓN (últimas sesiones SBA)</div>'
        + '<div style="font-size:12px;color:#a7b0be">' + evo.join('% → ') + '%</div>';
    }
    html += '<div style="font-size:10px;color:#525e6e;margin-top:14px">' + a.sbaSessions + ' sesión(es) SBA · ' + a.satSessions + ' sesión(es) SAT · ' + a.orSessions + ' sesión(es) respuesta abierta · datos locales de entrenamiento · NO evaluación oficial WSET</div></div>';
    return html;
  }

  return {
    history: history, recordSBASession: recordSBASession, recordSATSession: recordSATSession,
    recordORSession: recordORSession, detectVerb: detectVerb,
    analytics: analytics, weakSet: weakSet, prioritize: prioritize,
    coachSAT: coachSAT, renderCoachPanel: renderCoachPanel, renderProgress: renderProgress,
    renderVerbCoach: renderVerbCoach, structureCoach: structureCoach, chainCoach: chainCoach,
    coachOpenResponse: coachOpenResponse, recommendNext: recommendNext,
  };
})();
