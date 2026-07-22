/* EP-06 · Adaptive Review — plan de recuperación inmediato tras una sesión/examen.
 * NO calcula nada nuevo: delega en EP-03 (datos), Learning Loop (decisión) y Mentor (interpretación).
 * Determinista, sin LLM. No crea backend/contratos; no modifica EP, SAT, Bottle/Label/Mentor/Learning Loop/Dashboard.
 * Responde: qué falló · por qué importa · qué misconception primero · qué habilidad frena · qué práctica ahora · qué evidencia mejorar · cuándo volver a Full Simulation. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../learning-loop/learning-loop-engine.js'),
      require('../mentor/mentor-cognitivo.js'),
      require('../mentor/mentor-cognitivo-ui.js')
    );
  } else {
    root.AdaptiveReview = factory(root.LearningLoop, root.MentorCognitivo, root.MentorCognitivoUI);
  }
})(typeof self !== 'undefined' ? self : this, function (LearningLoop, MentorCognitivo, MentorCognitivoUI) {
  'use strict';
  var TH = (LearningLoop && LearningLoop.THRESHOLDS) || { pass: 0.55, sim: 0.70, target: 0.75, calMin: 0.70, transferMin: 0.50 };
  function unwrap(x) { return (x && x.data !== undefined) ? x.data : (x || null); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function has(m) { return m && m.status === 'derived' && isNum(m.value); }
  function pct(v) { return isNum(v) ? Math.round(v * 100) : null; }
  function metricOf(ms, k) { return (ms && ms[k]) || { value: null, evidence_count: 0, status: 'insufficient_evidence' }; }
  function misconceptionEvents(list) {
    return (list || []).map(function (m) {
      return { event_id: 'ep03-' + m.misconception_id, event_type: 'misconception_detected',
        occurred_at: m.last_seen_at || m.detected_at || new Date(0).toISOString(),
        payload: { misconception_id: m.misconception_id, domain_tags: m.domain_tags || [] },
        evidence: { title: m.label || m.misconception_id }, schema_version: 'EP-01' };
    });
  }
  function evidenceToImprove(metrics) {
    var out = [];
    var rd = metricOf(metrics, 'readiness'), cal = metricOf(metrics, 'calibration'), tr = metricOf(metrics, 'transfer');
    if (has(cal) && cal.value < TH.calMin) out.push({ key: 'calibration', label: 'Calibración', now: pct(cal.value), target: pct(TH.calMin), gap: pct(TH.calMin) - pct(cal.value) });
    if (has(tr) && tr.value < TH.transferMin) out.push({ key: 'transfer', label: 'Transferencia', now: pct(tr.value), target: pct(TH.transferMin), gap: pct(TH.transferMin) - pct(tr.value) });
    if (has(rd) && rd.value < TH.sim) out.push({ key: 'readiness', label: 'Readiness', now: pct(rd.value), target: pct(TH.sim), gap: pct(TH.sim) - pct(rd.value) });
    return out;
  }
  function buildRecoveryPlan(bundle) {
    bundle = bundle || {};
    var summary = unwrap(bundle.summary) || {};
    var sessions = unwrap(bundle.recent_sessions || bundle.sessions) || [];
    var misconceptions = unwrap(bundle.open_misconceptions || bundle.misconceptions) || [];
    var recommendations = unwrap(bundle.recommendations) || [];
    var readinessBreakdown = unwrap(bundle.readiness_breakdown || bundle.readiness) || null;
    var metrics = summary.metrics || {};
    var loop = LearningLoop.orchestrate({ summary: summary, sessions: sessions, misconceptions: misconceptions, recommendations: recommendations, readiness_breakdown: readinessBreakdown });
    var mentor = MentorCognitivo.interpret({ metrics: metrics, events: misconceptionEvents(misconceptions) });
    var mentorHeadline = mentor.messages[0] || null;
    var whatFailed = [];
    misconceptions.forEach(function (m) { whatFailed.push('Idea sin cerrar: «' + (m.label || m.misconception_id) + '»'); });
    if (loop.blocker) whatFailed.push('Frena: ' + loop.blocker.label + ' (' + loop.blocker.kind + ')');
    var rd = metricOf(metrics, 'readiness');
    if (has(rd) && rd.value < TH.pass) whatFailed.push('Tu juicio integrado aún no alcanza el aprobado (' + pct(rd.value) + '% < ' + pct(TH.pass) + '%)');
    if (!whatFailed.length) whatFailed.push('Sin fallos críticos: consolida y sube de nivel.');
    var topMis = (loop.topMis) || (misconceptions[0] || null);
    return {
      schema: 'adaptive-review.v1',
      halt: loop.halt,
      whatFailed: whatFailed,
      whyItMatters: mentorHeadline ? mentorHeadline.body : (loop.next.reason || ''),
      misconceptionFirst: loop.answers ? loop.answers.whichMisconceptionFirst : (topMis ? (topMis.label || topMis.misconception_id) : 'Ninguna'),
      blockingSkill: loop.blocker ? (loop.blocker.label + ' · ' + loop.blocker.kind) : (summary.weakest_metric || 'Sin bloqueador claro'),
      practiceNow: { practice: loop.next.practice, label: loop.next.label, reason: loop.next.reason },
      evidenceToImprove: evidenceToImprove(metrics),
      returnToSimWhen: loop.answers ? loop.answers.recommendFullSimWhen : '',
      simulationGate: loop.simulation_gate,
      mentor: mentorHeadline,
      rationale: loop.rationale
    };
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function practiceHref(p) {
    return ({ 'bottle-guided': '../bottle-lab/', 'label-guided': '../label-lab/', 'full-simulation': '../full-simulation-v2/',
      'sat-blind': '../sat-lab/', 'calibration-drill': '../label-lab/', 'novel-practice': '../bottle-lab/', 'targeted-remediation': '../label-lab/' }[p]) || '../dashboard/';
  }
  function render(rootEl, plan) {
    if (!rootEl) return;
    var failedHtml = plan.whatFailed.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
    var evHtml = plan.evidenceToImprove.length
      ? plan.evidenceToImprove.map(function (e) { return '<div class="ar-ev ar-in"><span class="ar-ev-l">' + esc(e.label) + '</span><span class="ar-ev-v">' + (e.now == null ? '—' : e.now + '%') + ' → ' + e.target + '%</span></div>'; }).join('')
      : '<div class="muted small">Tus métricas están en rango. Mantén el ritmo.</div>';
    var gate = plan.simulationGate || {};
    rootEl.innerHTML =
      '<section class="ar-card ar-in ar-headline' + (plan.halt ? ' halt' : '') + '">' +
        '<div class="eyebrow">Qué hacer ahora</div>' +
        '<div class="ar-practice">' + esc(plan.practiceNow.label) + '</div>' +
        '<p class="ar-reason">' + esc(plan.practiceNow.reason) + '</p>' +
        '<a class="btn btn--shine btn--glow ar-cta" href="' + esc(practiceHref(plan.practiceNow.practice)) + '">Empezar ahora →</a>' +
      '</section>' +
      '<section class="ar-card ar-in mentor-mount" id="arMentor"></section>' +
      '<div class="ar-grid">' +
        '<section class="ar-card ar-in"><div class="eyebrow">Qué falló</div><ul class="ar-list">' + failedHtml + '</ul></section>' +
        '<section class="ar-card ar-in"><div class="eyebrow">Corrige primero</div><div class="ar-mis">' + esc(plan.misconceptionFirst) + '</div>' +
          '<div class="card-sub">Habilidad que frena</div><div class="ar-skill">' + esc(plan.blockingSkill) + '</div></section>' +
      '</div>' +
      '<section class="ar-card ar-in"><div class="eyebrow">Qué evidencia debes mejorar para avanzar</div>' + evHtml + '</section>' +
      '<section class="ar-card ar-in ar-return"><div class="eyebrow">¿Cuándo volver a Full Simulation?</div>' +
        '<p class="ar-reason">' + esc(plan.returnToSimWhen) + '</p>' +
        (gate.open ? '<a class="btn btn--shine btn--glow ar-cta" href="../full-simulation-v2/">Ir al simulacro →</a>' : '<span class="ar-locked">Aún no — primero cierra lo de arriba.</span>') +
      '</section>' +
      '<div class="ar-actions"><a class="btn btn--ghost ar-ghost" href="../dashboard/">Volver a Mi progreso</a></div>' +
      '<div class="ar-gov">Práctica formativa · Desarrollo de razonamiento profesional en vino · Plan determinista (sin LLM)</div>';
    if (MentorCognitivoUI && plan.mentor) {
      var mount = document.getElementById('arMentor');
      mount.innerHTML = '<div class="eyebrow">Por qué importa · tu Mentor</div>';
      var holder = document.createElement('div');
      MentorCognitivoUI.render(holder, { messages: [plan.mentor] });
      mount.appendChild(holder);
    }
  }
  return { buildRecoveryPlan: buildRecoveryPlan, render: render };
});
