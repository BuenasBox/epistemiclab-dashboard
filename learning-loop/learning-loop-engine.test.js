/* Pruebas deterministas del Learning Loop. Ejecutar: node learning-loop/learning-loop-engine.test.js */
'use strict';
const assert = require('assert');
const LL = require('./learning-loop-engine.js');

let pass = 0;
function t(name, fn) { fn(); console.log('  ✓ ' + name); pass++; }
function metric(v, n) { return { value: v, evidence_count: n, status: (n > 0 && v !== null) ? 'derived' : 'insufficient_evidence', source_event_types: [] }; }
function summary(metrics, weakest) { return { metrics: metrics, weakest_metric: weakest || null, event_count: 50 }; }
function sess(type, n) { var a = []; for (var i = 0; i < n; i++) a.push({ session_id: type + i, session_type: type, status: 'completed', completed_at: '2026-06-1' + (i % 9) + 'T00:00:00.000Z' }); return a; }
function mis(id, label, detected) { return { misconception_id: id, label: label, detected_at: detected, last_seen_at: detected, evidence_count: 1, domain_tags: [] }; }

console.log('Learning Loop — pruebas');

t('determinista: mismo input → mismo output', () => {
  const input = { summary: summary({ readiness: metric(0.62, 4), calibration: metric(0.8, 10), transfer: metric(0.7, 6) }),
    sessions: sess('bottle-guided', 2).concat(sess('label-guided', 2)), misconceptions: [], recommendations: [] };
  assert.strictEqual(JSON.stringify(LL.orchestrate(input)), JSON.stringify(LL.orchestrate(input)));
});

t('arranque en frío → Bottle', () => {
  const r = LL.orchestrate({ summary: summary({}), sessions: [], misconceptions: [], recommendations: [] });
  assert.strictEqual(r.state, 'cold_start');
  assert.strictEqual(r.next.practice, 'bottle-guided');
  assert.strictEqual(r.halt, false);
});

t('misconception abierta → HALT y se corrige primero', () => {
  const r = LL.orchestrate({ summary: summary({ readiness: metric(0.8, 6), calibration: metric(0.9, 10), transfer: metric(0.9, 6) }),
    sessions: sess('bottle-guided', 3).concat(sess('label-guided', 3)),
    misconceptions: [mis('m2', 'Idea nueva', '2026-06-10T00:00:00.000Z'), mis('m1', 'Idea vieja', '2026-06-01T00:00:00.000Z')], recommendations: [] });
  assert.strictEqual(r.halt, true);
  assert.strictEqual(r.state, 'reinforce');
  assert.strictEqual(r.answers.whichMisconceptionFirst, 'Idea vieja', 'la más antigua primero');
});

t('calibración < 70% → HALT calibración', () => {
  const r = LL.orchestrate({ summary: summary({ readiness: metric(0.8, 6), calibration: metric(0.5, 10), transfer: metric(0.9, 6) }),
    sessions: sess('bottle-guided', 3).concat(sess('label-guided', 3)), misconceptions: [], recommendations: [] });
  assert.strictEqual(r.halt, true);
  assert.strictEqual(r.next.practice, 'calibration-drill');
});

t('transferencia < 50% → HALT material nuevo', () => {
  const r = LL.orchestrate({ summary: summary({ readiness: metric(0.8, 6), calibration: metric(0.9, 10), transfer: metric(0.3, 6) }),
    sessions: sess('bottle-guided', 3).concat(sess('label-guided', 3)), misconceptions: [], recommendations: [] });
  assert.strictEqual(r.halt, true);
  assert.strictEqual(r.next.practice, 'novel-practice');
});

t('prioridad: misconception antes que calibración', () => {
  const r = LL.orchestrate({ summary: summary({ calibration: metric(0.4, 10) }),
    sessions: sess('bottle-guided', 3), misconceptions: [mis('m1', 'X', '2026-06-01T00:00:00.000Z')], recommendations: [] });
  assert.ok(r.next.practice !== 'calibration-drill', 'misconception gana');
  assert.strictEqual(r.state, 'reinforce');
});

t('progresión: Bottle suficiente, falta Label → Label', () => {
  const r = LL.orchestrate({ summary: summary({ readiness: metric(0.4, 3), calibration: metric(0.9, 10), transfer: metric(0.9, 6) }),
    sessions: sess('bottle-guided', 2), misconceptions: [], recommendations: [] });
  assert.strictEqual(r.next.practice, 'label-guided');
  assert.strictEqual(r.halt, false);
});

t('progresión: Bottle+Label ok, readiness baja → ciego', () => {
  const r = LL.orchestrate({ summary: summary({ readiness: metric(0.5, 3), calibration: metric(0.9, 10), transfer: metric(0.9, 6) }),
    sessions: sess('bottle-guided', 2).concat(sess('label-guided', 2)), misconceptions: [], recommendations: [] });
  assert.strictEqual(r.next.practice, 'sat-blind');
});

t('puerta del simulacro: readiness 72% → simulation_ready + gate open', () => {
  const r = LL.orchestrate({ summary: summary({ readiness: metric(0.72, 6), calibration: metric(0.9, 10), transfer: metric(0.9, 6) }),
    sessions: sess('bottle-guided', 2).concat(sess('label-guided', 2)), misconceptions: [], recommendations: [] });
  assert.strictEqual(r.state, 'simulation_ready');
  assert.strictEqual(r.next.practice, 'full-simulation');
  assert.strictEqual(r.simulation_gate.open, true);
});

t('listo para examen: readiness 80% + todo en rango', () => {
  const r = LL.orchestrate({ summary: summary({ readiness: metric(0.8, 8), calibration: metric(0.85, 10), transfer: metric(0.8, 6) }),
    sessions: sess('bottle-guided', 3).concat(sess('label-guided', 3)), misconceptions: [], recommendations: [] });
  assert.strictEqual(r.state, 'exam_ready');
});

t('responde las 8 preguntas', () => {
  const r = LL.orchestrate({ summary: summary({ readiness: metric(0.62, 4) }), sessions: sess('bottle-guided', 1), misconceptions: [], recommendations: [] });
  ['whatNext', 'why', 'whichMisconceptionFirst', 'whichCompetencyBlocking', 'repeatBottleWhen', 'moveToLabelWhen', 'recommendFullSimWhen', 'haltWhen']
    .forEach(k => assert.ok(typeof r.answers[k] === 'string' && r.answers[k].length, 'falta ' + k));
});

t('fromEndpoints desempaqueta {ok,view,data}', () => {
  const r = LL.fromEndpoints({
    summary: { ok: true, view: 'summary', data: summary({ readiness: metric(0.4, 3), calibration: metric(0.9, 10), transfer: metric(0.9, 6) }) },
    recent_sessions: { ok: true, view: 'recent_sessions', data: sess('bottle-guided', 2) },
    open_misconceptions: { ok: true, view: 'open_misconceptions', data: [] },
    recommendations: { ok: true, view: 'recommendations', data: [] }
  });
  assert.strictEqual(r.next.practice, 'label-guided');
});

console.log('\nTODAS LAS PRUEBAS OK (' + pass + ')');
