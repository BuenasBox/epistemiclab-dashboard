/* Pruebas deterministas de EP-06 Adaptive Review. Ejecutar: node adaptive-review/adaptive-review.test.js */
'use strict';
const assert = require('assert');
const AR = require('./adaptive-review.js');
let pass = 0;
function t(name, fn) { fn(); console.log('  ✓ ' + name); pass++; }
function metric(v, n) { return { value: v, evidence_count: n, status: (n > 0 && v !== null) ? 'derived' : 'insufficient_evidence', source_event_types: [] }; }
function bundle(over) {
  over = over || {};
  return {
    summary: { ok: true, view: 'summary', data: { weakest_metric: over.weakest || 'calibration', event_count: 70,
      metrics: over.metrics || { domain: metric(0.61, 28), calibration: metric(0.52, 14), transfer: metric(0.66, 6), readiness: metric(0.58, 5), adherence: metric(0.9, 6) } } },
    recent_sessions: { ok: true, view: 'recent_sessions', data: over.sessions || [{ session_type: 'full-simulation', status: 'completed', completed_at: '2026-06-20T00:00:00.000Z' }, { session_type: 'bottle-guided' }, { session_type: 'bottle-guided' }, { session_type: 'label-guided' }, { session_type: 'label-guided' }] },
    open_misconceptions: { ok: true, view: 'open_misconceptions', data: over.misconceptions !== undefined ? over.misconceptions : [{ misconception_id: 'praedikat-equals-sweetness', label: 'Prädikat no es dulzor', detected_at: '2026-06-16T00:00:00.000Z', last_seen_at: '2026-06-20T00:00:00.000Z', domain_tags: ['Teoria'] }] },
    recommendations: { ok: true, view: 'recommendations', data: [] }
  };
}
console.log('Adaptive Review — pruebas');
t('responde las 7 preguntas (campos del plan)', () => { const p = AR.buildRecoveryPlan(bundle()); ['whatFailed','whyItMatters','misconceptionFirst','blockingSkill','practiceNow','evidenceToImprove','returnToSimWhen'].forEach(k => assert.ok(p[k] !== undefined, 'falta ' + k)); });
t('misconception abierta => HALT y se corrige primero', () => { const p = AR.buildRecoveryPlan(bundle()); assert.strictEqual(p.halt, true); assert.ok(/Prädikat/.test(p.misconceptionFirst)); assert.ok(p.whatFailed.some(x => /Prädikat/.test(x))); });
t('practiceNow viene del Learning Loop', () => { const p = AR.buildRecoveryPlan(bundle()); assert.ok(p.practiceNow.label && typeof p.practiceNow.label === 'string'); assert.ok(p.practiceNow.reason && p.practiceNow.reason.length); });
t('evidenceToImprove lista metricas bajo umbral con objetivo', () => { const p = AR.buildRecoveryPlan(bundle()); const keys = p.evidenceToImprove.map(e => e.key); assert.ok(keys.indexOf('calibration') >= 0); assert.ok(keys.indexOf('readiness') >= 0); const cal = p.evidenceToImprove.filter(e => e.key === 'calibration')[0]; assert.strictEqual(cal.now, 52); assert.strictEqual(cal.target, 70); });
t('mentor headline presente (por que importa)', () => { const p = AR.buildRecoveryPlan(bundle()); assert.ok(p.mentor && p.mentor.title); assert.ok(typeof p.whyItMatters === 'string' && p.whyItMatters.length); });
t('sin misconceptions y todo en rango => sin HALT, evidencia vacia', () => { const p = AR.buildRecoveryPlan(bundle({ misconceptions: [], metrics: { domain: metric(0.8, 28), calibration: metric(0.82, 14), transfer: metric(0.8, 6), readiness: metric(0.78, 5), adherence: metric(0.9, 6) } })); assert.strictEqual(p.halt, false); assert.strictEqual(p.evidenceToImprove.length, 0); });
t('determinista: mismo bundle => mismo plan', () => { assert.strictEqual(JSON.stringify(AR.buildRecoveryPlan(bundle())), JSON.stringify(AR.buildRecoveryPlan(bundle()))); });
console.log('\nTODAS LAS PRUEBAS OK (' + pass + ')');
