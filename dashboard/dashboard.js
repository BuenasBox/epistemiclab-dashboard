(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../learning-loop/learning-loop-engine.js'),
      require('../mentor/mentor-cognitivo.js'),
      require('../mentor/mentor-cognitivo-ui.js')
    );
  } else {
    root.Dashboard = factory(root.LearningLoop, root.MentorCognitivo, root.MentorCognitivoUI);
  }
})(typeof self !== 'undefined' ? self : this, function (LearningLoop, MentorCognitivo, MentorCognitivoUI) {
  'use strict';
  // EP-04 Intelligent Dashboard: representación visual del Epistemic Profile.
  // NO calcula nada: delega en EP-03 (datos), Learning Loop (decisión) y Mentor (interpretación).
  function unwrap(x) { return (x && x.data !== undefined) ? x.data : (x || null); }
  function pct(v) { return (typeof v === 'number' && isFinite(v)) ? Math.round(v * 100) : null; }
  var STATE_LABEL = { cold_start:'Comenzando', reinforce:'Reforzando una habilidad', progress:'En progreso', simulation_ready:'Listo para simulacro', exam_ready:'Listo para examen' };
  var PHASES = ['Diagnóstico','Fundamentos','Contextual','Ciego','Integración','Examen'];
  function phaseIndex(loop) {
    if (loop.state === 'cold_start') return 0;
    if (loop.state === 'exam_ready') return 5;
    if (loop.state === 'simulation_ready') return 4;
    var p = loop.next && loop.next.practice;
    if (p === 'sat-blind') return 3;
    if (p === 'label-guided') return 2;
    if (p === 'bottle-guided') return 1;
    if (p === 'full-simulation') return 4;
    return 2;
  }
  function misconceptionEvents(list) {
    return (list || []).map(function (m) {
      return { event_id:'ep03-'+m.misconception_id, event_type:'misconception_detected',
        occurred_at: m.last_seen_at || m.detected_at || new Date(0).toISOString(),
        payload:{ misconception_id:m.misconception_id, domain_tags:m.domain_tags||[] },
        evidence:{ title:m.label||m.misconception_id }, schema_version:'EP-01' };
    });
  }
  function buildViewModel(bundle) {
    bundle = bundle || {};
    var summary = unwrap(bundle.summary) || {};
    var sessions = unwrap(bundle.recent_sessions || bundle.sessions) || [];
    var misconceptions = unwrap(bundle.open_misconceptions || bundle.misconceptions) || [];
    var recommendations = unwrap(bundle.recommendations) || [];
    var readinessBreakdown = unwrap(bundle.readiness_breakdown || bundle.readiness) || null;
    var metrics = summary.metrics || {};
    var loop = LearningLoop.orchestrate({ summary:summary, sessions:sessions, misconceptions:misconceptions, recommendations:recommendations, readiness_breakdown:readinessBreakdown });
    var mentor = MentorCognitivo.interpret({ metrics:metrics, events:misconceptionEvents(misconceptions) });
    var mentorHeadline = mentor.messages[0] || null;
    var last = sessions[0] || null;
    return {
      schema:'dashboard-vm.v1',
      where:{ stateLabel:STATE_LABEL[loop.state]||loop.state, phaseIndex:phaseIndex(loop), phases:PHASES },
      readiness:{ pct:pct(metrics.readiness && metrics.readiness.value), gateOpen:!!(loop.simulation_gate && loop.simulation_gate.open), threshold:loop.simulation_gate && loop.simulation_gate.threshold },
      weakness: loop.blocker ? (loop.blocker.label+' · '+loop.blocker.kind) : (summary.weakest_metric||null),
      lastProgress: last ? { type:last.session_type, status:last.status, at:last.completed_at } : null,
      next:{ practice:loop.next.practice, label:loop.next.label, reason:loop.next.reason, halt:loop.halt },
      mentor: mentorHeadline, mentorAll: mentor.messages,
      misconceptions: misconceptions,
      confidence:{ pct:pct(metrics.calibration && metrics.calibration.value), status:(metrics.calibration && metrics.calibration.status)||'insufficient_evidence' },
      transfer:{ pct:pct(metrics.transfer && metrics.transfer.value), status:(metrics.transfer && metrics.transfer.status)||'insufficient_evidence' },
      sessions: sessions.slice(0,5), answers: loop.answers, rationale: loop.rationale
    };
  }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function sessionIcon(type){ var t=String(type||'').toLowerCase(); if(t.indexOf('bottle')>=0)return '🍾'; if(t.indexOf('label')>=0)return '📖'; if(t.indexOf('sim')>=0)return '⏱'; return '🍷'; }
  function sessionName(type){ var t=String(type||'').toLowerCase(); if(t.indexOf('bottle')>=0)return 'Botellas'; if(t.indexOf('label')>=0)return 'Etiquetas'; if(t.indexOf('sim')>=0)return 'Simulacro completo'; if(t.indexOf('blind')>=0||t.indexOf('sat')>=0)return 'Laboratorio SAT'; return esc(type||'Sesión'); }
  function meter(label,p){ var shown=(p==null)?'sin evidencia':p+'%'; var w=(p==null)?0:p; return '<div class="ind"><div class="ind-top"><span>'+esc(label)+'</span><b>'+esc(shown)+'</b></div><div class="ind-bar"><span style="width:'+w+'%"></span></div></div>'; }
  function render(rootEl, vm) {
    if (!rootEl) return;
    var r = vm.readiness; var ringPct = r.pct==null?0:r.pct;
    var timeline = vm.where.phases.map(function(ph,i){ var cls=i<vm.where.phaseIndex?'done':(i===vm.where.phaseIndex?'active':''); var mk=i<vm.where.phaseIndex?'✓':(i===vm.where.phaseIndex?'▶':'○'); return '<div class="tl-step '+cls+'"><span class="tl-dot">'+mk+'</span><span class="tl-lbl">'+esc(ph)+'</span></div>'; }).join('');
    var misHtml = vm.misconceptions.length ? vm.misconceptions.map(function(m){return '<span class="chip chip-crit">'+esc(m.label||m.misconception_id)+'</span>';}).join(' ') : '<span class="muted small">Ninguna idea abierta. Buen trabajo.</span>';
    var sessHtml = vm.sessions.length ? vm.sessions.map(function(s){ return '<div class="sess"><span class="sess-ic">'+sessionIcon(s.session_type)+'</span><span class="sess-name">'+sessionName(s.session_type)+'</span><span class="sess-status">'+esc(s.status||'')+'</span></div>'; }).join('') : '<div class="muted small">Sin sesiones todavía.</div>';
    var haltBadge = vm.next.halt ? '<span class="pill pill-halt">Reforzar antes de avanzar</span>' : '<span class="pill pill-go">Avanzar</span>';
    rootEl.innerHTML =
      '<div class="grid-2"><section class="card hero-card"><div class="ring" style="--p:'+ringPct+'"><i>'+(r.pct==null?'—':r.pct+'%')+'</i></div><div><div class="eyebrow">Tu preparación</div><div class="hero-state">'+esc(vm.where.stateLabel)+'</div><div class="muted small">'+(r.gateOpen?'Listo para el simulacro completo.':('Puerta del simulacro en '+(r.threshold||70)+'%.'))+'</div></div></section>'+
      '<section class="card next-card'+(vm.next.halt?' halt':'')+'"><div class="eyebrow">Tu siguiente paso '+haltBadge+'</div><div class="next-practice">'+esc(vm.next.label)+'</div><p class="next-reason">'+esc(vm.next.reason)+'</p></section></div>'+
      '<section class="card mentor-mount" id="mentorMount"></section>'+
      '<div class="grid-2"><section class="card"><div class="eyebrow">Tu mayor foco ahora</div><div class="weakness">'+esc(vm.weakness||'Sin un foco único con la evidencia actual')+'</div><div class="card-sub">Ideas a corregir</div>'+misHtml+'</section>'+
      '<section class="card"><div class="eyebrow">Confianza y transferencia</div>'+meter('Confianza (calibración)',vm.confidence.pct)+meter('Transferencia (vinos nuevos)',vm.transfer.pct)+'</section></div>'+
      '<section class="card"><div class="eyebrow">Tu recorrido</div><div class="timeline">'+timeline+'</div></section>'+
      '<section class="card"><div class="eyebrow">Tu último avance</div>'+(vm.lastProgress?'<div class="last">'+sessionIcon(vm.lastProgress.type)+' '+sessionName(vm.lastProgress.type)+' · <span class="muted">'+esc(vm.lastProgress.status||'')+'</span></div>':'<div class="muted small">Aún no registras sesiones.</div>')+'<div class="card-sub">Sesiones recientes</div>'+sessHtml+'</section>';
    if (MentorCognitivoUI && vm.mentor) {
      var mount = document.getElementById('mentorMount');
      mount.innerHTML = '<div class="eyebrow">Qué espera el Mentor de ti</div>';
      var holder = document.createElement('div');
      MentorCognitivoUI.render(holder, { messages:[vm.mentor] });
      mount.appendChild(holder);
    }
  }
  return { buildViewModel: buildViewModel, render: render };
});
