/* ============================================================================
 * Learning Loop — motor de orquestación DETERMINISTA (el cerebro de EpistemicLab)
 *
 * Une los módulos decidiendo el recorrido del estudiante. Consume ÚNICAMENTE el
 * read layer EP-03 ya existente (vistas del Epistemic Profile):
 *   - summary            → metrics {domain,calibration,transfer,readiness,adherence}, weakest_metric
 *   - recent_sessions    → [{session_id, session_type, status, completed_at, ...}]
 *   - open_misconceptions→ [{misconception_id, label, detected_at, last_seen_at, domain_tags, ...}]
 *   - recommendations    → [{recommendation_id, priority, reason, action}]
 *   - readiness_breakdown→ {components:[{component, value, ...}]}
 *
 * NO backend, NO Edge Functions, NO contratos, NO LLM, NO aleatoriedad.
 * NO inventa reglas: usa los umbrales ya aprobados del Learning Journey
 * (aprobado 55% · puerta de simulacro 70% · objetivo 75% · calibración 70% ·
 * transferencia 50% · adherencia 80%) y la progresión de andamiaje
 * Bottle → Label → Ciego → Simulacro. Mismo input → mismo output.
 *
 * Responde, sólo con evidencia EP-03:
 *   ¿Qué práctica sigue? · ¿Por qué? · ¿Qué misconception corregir primero? ·
 *   ¿Qué competencia frena el progreso? · ¿Cuándo repetir Bottle? · ¿Cuándo pasar
 *   a Label? · ¿Cuándo recomendar Full Simulation? · ¿Cuándo detener y reforzar?
 * ==========================================================================*/
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LearningLoop = root.LearningLoop || api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Umbrales del Learning Journey aprobado (no son nuevos).
  var TH = { pass: 0.55, sim: 0.70, target: 0.75, calMin: 0.70, transferMin: 0.50, adherenceMin: 0.80, minBottle: 2, minLabel: 2 };

  var PRACTICE = {
    DIAGNOSTIC: 'diagnostic', BOTTLE: 'bottle-guided', LABEL: 'label-guided',
    BLIND: 'sat-blind', CAL: 'calibration-drill', TRANSFER: 'novel-practice',
    REMEDIATION: 'targeted-remediation', SIMULATION: 'full-simulation'
  };
  var PRACTICE_LABEL = {
    'diagnostic': 'Diagnóstico inicial', 'bottle-guided': 'Botellas guiadas', 'label-guided': 'Etiquetas guiadas',
    'sat-blind': 'SAT Ciego', 'calibration-drill': 'Ejercicio de calibración',
    'novel-practice': 'Práctica con material nuevo', 'targeted-remediation': 'Mini-ejercicio dirigido',
    'full-simulation': 'Simulacro completo'
  };

  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function has(m) { return m && m.status === 'derived' && isNum(m.value); }
  function val(m) { return has(m) ? m.value : null; }
  function pct(v) { return isNum(v) ? Math.round(v * 100) : null; }
  function metricOf(metrics, k) { return (metrics && metrics[k]) || { value: null, evidence_count: 0, status: 'insufficient_evidence' }; }

  // --- normaliza la entrada: acepta el read model EP-03 desglosado ---
  function normalize(input) {
    input = input || {};
    var summary = input.summary || {};
    return {
      metrics: summary.metrics || {},
      weakestMetric: summary.weakest_metric || null,
      eventCount: summary.event_count || 0,
      sessions: Array.isArray(input.sessions) ? input.sessions : [],
      misconceptions: Array.isArray(input.misconceptions) ? input.misconceptions : [],
      recommendations: Array.isArray(input.recommendations) ? input.recommendations : [],
      readinessBreakdown: input.readiness_breakdown || input.readinessBreakdown || null
    };
  }

  function countSessions(sessions) {
    var c = { bottle: 0, label: 0, blind: 0, sim: 0, total: sessions.length };
    sessions.forEach(function (s) {
      var t = String(s.session_type || '').toLowerCase();
      if (t.indexOf('bottle') >= 0) c.bottle++;
      else if (t.indexOf('label') >= 0) c.label++;
      else if (t.indexOf('sim') >= 0) c.sim++;
      else if (t.indexOf('blind') >= 0 || t.indexOf('cieg') >= 0 || t.indexOf('sat') >= 0) c.blind++;
    });
    return c;
  }

  // misconception prioritaria = la más antigua sin cerrar (por detected_at; fallback last_seen)
  function priorityMisconception(list) {
    if (!list.length) return null;
    return list.slice().sort(function (a, b) {
      var da = Date.parse(a.detected_at || a.last_seen_at || 0) || 0;
      var db = Date.parse(b.detected_at || b.last_seen_at || 0) || 0;
      if (da !== db) return da - db; // más antigua primero
      return String(a.misconception_id).localeCompare(String(b.misconception_id));
    })[0];
  }

  function blockingDimension(n, mis) {
    // 1) si hay misconception con domain_tags, ése es el eje que frena
    if (mis && Array.isArray(mis.domain_tags) && mis.domain_tags.length) return { kind: 'competency', label: mis.domain_tags.join(', ') };
    // 2) métrica más débil reportada por EP-03
    if (n.weakestMetric) return { kind: 'metric', label: n.weakestMetric };
    // 3) componente más débil del readiness_breakdown (excluyendo 'overall')
    var comps = (n.readinessBreakdown && n.readinessBreakdown.components) || [];
    var weak = comps.filter(function (c) { return c.component !== 'overall' && isNum(c.value); })
      .sort(function (a, b) { return a.value - b.value || a.component.localeCompare(b.component); })[0];
    if (weak) return { kind: 'component', label: weak.component };
    return null;
  }

  function remediationModule(mis, counts) {
    var tags = (mis && Array.isArray(mis.domain_tags) ? mis.domain_tags.join(' ') : '').toLowerCase();
    if (tags.indexOf('teor') >= 0 || tags.indexOf('clasif') >= 0 || tags.indexOf('denomin') >= 0) return PRACTICE.LABEL;
    if (tags.indexOf('aspect') >= 0 || tags.indexOf('visual') >= 0 || tags.indexOf('botell') >= 0) return PRACTICE.BOTTLE;
    return PRACTICE.REMEDIATION;
  }

  function decide(n) {
    var m = n.metrics;
    var readiness = metricOf(m, 'readiness'), calibration = metricOf(m, 'calibration'),
        transfer = metricOf(m, 'transfer'), domain = metricOf(m, 'domain'), adherence = metricOf(m, 'adherence');
    var counts = countSessions(n.sessions);
    var topMis = priorityMisconception(n.misconceptions);

    var anySignal = has(readiness) || has(calibration) || has(transfer) || has(domain) || n.misconceptions.length || counts.total;

    // 0) Arranque en frío
    if (!anySignal || (!has(readiness) && counts.total < 2 && !n.misconceptions.length)) {
      return { state: 'cold_start', halt: false,
        next: { practice: PRACTICE.BOTTLE, focus: null,
          reason: 'Aún no hay evidencia integrada. La primera práctica genera la base del perfil.' },
        blocker: null, counts: counts, topMis: null,
        gate: { open: false, current: null, threshold: TH.sim } };
    }

    // 1) HALT — misconception abierta (concepto sin cerrar): se corrige antes de avanzar
    if (n.misconceptions.length) {
      return { state: 'reinforce', halt: true,
        next: { practice: remediationModule(topMis, counts), focus: topMis,
          reason: 'Hay una idea recurrente sin cerrar («' + (topMis.label || topMis.misconception_id) + '»). En cata ciega un error de base se arrastra a la conclusión: se corrige antes de progresar.' },
        blocker: blockingDimension(n, topMis), counts: counts, topMis: topMis,
        gate: { open: false, current: pct(val(readiness)), threshold: TH.sim } };
    }

    // 2) HALT — calibración por debajo del objetivo (sobreconfianza)
    if (has(calibration) && calibration.value < TH.calMin) {
      return { state: 'reinforce', halt: true,
        next: { practice: PRACTICE.CAL, focus: null,
          reason: 'Tu confianza todavía no predice tu acierto (calibración ' + pct(calibration.value) + '%). Saber cuándo aciertas es prerequisito para el simulacro.' },
        blocker: { kind: 'metric', label: 'calibración' }, counts: counts, topMis: null,
        gate: { open: false, current: pct(val(readiness)), threshold: TH.sim } };
    }

    // 3) HALT — transferencia baja (memorización)
    if (has(transfer) && transfer.value < TH.transferMin) {
      return { state: 'reinforce', halt: true,
        next: { practice: PRACTICE.TRANSFER, focus: null,
          reason: 'Rindes mejor en material visto que en nuevo (transferencia ' + pct(transfer.value) + '%). Hay que convertir memoria en razonamiento antes de avanzar.' },
        blocker: { kind: 'metric', label: 'transferencia' }, counts: counts, topMis: null,
        gate: { open: false, current: pct(val(readiness)), threshold: TH.sim } };
    }

    // 4) PROGRESIÓN por andamiaje (sin bloqueadores)
    if (counts.bottle < TH.minBottle) {
      return progress('progress', PRACTICE.BOTTLE,
        'Construye la inferencia visual: aún tienes ' + counts.bottle + ' de ' + TH.minBottle + ' sesiones de Botellas recomendadas.', n, counts, readiness);
    }
    if (counts.label < TH.minLabel) {
      return progress('progress', PRACTICE.LABEL,
        'La práctica con botellas está consolidada (' + counts.bottle + ' sesiones). Pasa a la inferencia documental: ' + counts.label + ' de ' + TH.minLabel + ' sesiones de Etiquetas.', n, counts, readiness);
    }
    if (!has(readiness) || readiness.value < TH.sim) {
      return progress('progress', PRACTICE.BLIND,
        'Inferencia contextual cubierta. Retira el apoyo con práctica ciega para subir tu preparación (' + (pct(val(readiness)) == null ? 'sin evidencia aún' : pct(val(readiness)) + '%') + ' < ' + pct(TH.sim) + '%).', n, counts, readiness);
    }

    // 5) Puerta del simulacro abierta
    if (readiness.value < TH.target) {
      return progress('simulation_ready', PRACTICE.SIMULATION,
        'La preparación de ' + pct(readiness.value) + '% supera la puerta del simulacro (' + pct(TH.sim) + '%). Es el momento de integrar bajo condiciones de examen.', n, counts, readiness);
    }

    // 6) Listo para examen
    return progress('exam_ready', PRACTICE.SIMULATION,
      'La preparación de ' + pct(readiness.value) + '% alcanza el objetivo (' + pct(TH.target) + '%), sin ideas abiertas y con calibración y transferencia en rango. Mantén con simulacros de repaso.', n, counts, readiness);
  }

  function progress(state, practice, reason, n, counts, readiness) {
    return { state: state, halt: false, next: { practice: practice, focus: null, reason: reason },
      blocker: blockingDimension(n, null), counts: counts, topMis: null,
      gate: { open: has(readiness) && readiness.value >= TH.sim, current: pct(val(readiness)), threshold: TH.sim } };
  }

  // --- respuestas explícitas a las 8 preguntas, con evidencia ---
  function answers(n, d) {
    var m = n.metrics;
    var readiness = metricOf(m, 'readiness'), calibration = metricOf(m, 'calibration'), transfer = metricOf(m, 'transfer');
    function rb(x) { return x == null ? 'sin evidencia' : x + '%'; }
    return {
      whatNext: PRACTICE_LABEL[d.next.practice] || d.next.practice,
      why: d.next.reason,
      whichMisconceptionFirst: d.topMis ? ((d.topMis.label || d.topMis.misconception_id)) : 'Ninguna idea abierta.',
      whichCompetencyBlocking: d.blocker ? (d.blocker.label + ' (' + d.blocker.kind + ')') : 'Sin bloqueador claro con la evidencia actual.',
      repeatBottleWhen: 'Mientras la inferencia visual no esté consolidada (< ' + TH.minBottle + ' sesiones de Botellas). Ahora: ' + d.counts.bottle + (d.counts.bottle === 1 ? ' sesión.' : ' sesiones.'),
      moveToLabelWhen: 'Cuando la práctica con botellas esté consolidada (≥ ' + TH.minBottle + ' sesiones) y sin bloqueadores. Ahora: ' + (d.counts.bottle >= TH.minBottle ? 'cumplido' : 'aún no') + '.',
      recommendFullSimWhen: 'Cuando la preparación alcance ' + pct(TH.sim) + '% y no haya ideas erróneas, calibración o transferencia frenando. Ahora: preparación ' + rb(pct(val(readiness))) + ' → ' + (d.gate.open && !d.halt ? 'disponible' : 'aún no'),
      haltWhen: 'Detener y reforzar si hay idea abierta, calibración < ' + pct(TH.calMin) + '% o transferencia < ' + pct(TH.transferMin) + '%. Ahora: ' + (d.halt ? ('activo (' + d.state + ')') : 'sin bloqueadores')
    };
  }

  function rationale(n, d) {
    var lines = [];
    var m = n.metrics;
    var readiness = metricOf(m, 'readiness'), calibration = metricOf(m, 'calibration'), transfer = metricOf(m, 'transfer');
    if (has(readiness)) lines.push('preparación ' + pct(readiness.value) + '% (' + readiness.evidence_count + ' sesiones)');
    if (has(calibration)) lines.push('calibración ' + pct(calibration.value) + '% (' + calibration.evidence_count + ')');
    if (has(transfer)) lines.push('transferencia ' + pct(transfer.value) + '% (' + transfer.evidence_count + ')');
    lines.push('sesiones: ' + d.counts.bottle + ' Botellas · ' + d.counts.label + ' Etiquetas · ' + d.counts.blind + ' ciego · ' + d.counts.sim + ' simulacro');
    lines.push('ideas erróneas abiertas: ' + n.misconceptions.length);
    if (n.recommendations.length) lines.push('recomendaciones disponibles: ' + n.recommendations.length);
    return lines;
  }

  function orchestrate(input) {
    var n = normalize(input);
    var d = decide(n);
    return {
      schema: 'learning-loop.v1',
      state: d.state,
      halt: d.halt,
      next: { practice: d.next.practice, label: PRACTICE_LABEL[d.next.practice] || d.next.practice, focus: d.next.focus || null, reason: d.next.reason },
      blocker: d.blocker,
      simulation_gate: d.gate,
      answers: answers(n, d),
      rationale: rationale(n, d),
      basis: 'EP-03 read layer (events are source of truth; deterministic)'
    };
  }

  return {
    THRESHOLDS: TH,
    PRACTICE: PRACTICE,
    orchestrate: orchestrate,
    // conveniencia: desempaqueta las respuestas de los 5 endpoints EP-03 ({ok,view,data})
    fromEndpoints: function (resp) {
      resp = resp || {};
      function data(x) { return x && x.data !== undefined ? x.data : x; }
      return orchestrate({
        summary: data(resp.summary),
        sessions: data(resp.recent_sessions || resp.sessions),
        misconceptions: data(resp.open_misconceptions || resp.misconceptions),
        recommendations: data(resp.recommendations),
        readiness_breakdown: data(resp.readiness_breakdown || resp.readiness)
      });
    }
  };
});
