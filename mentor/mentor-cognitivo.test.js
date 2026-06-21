/* Pruebas deterministas del Mentor Cognitivo. Ejecutar: node mentor/mentor-cognitivo.test.js
 * Sin dependencias externas. */
'use strict';
const assert = require('assert');
const M = require('./mentor-cognitivo.js');

let pass = 0;
function t(name, fn) { fn(); console.log('  ✓ ' + name); pass++; }

function metric(value, n) { return { value: value, evidence_count: n, status: n > 0 && value !== null ? 'derived' : 'insufficient_evidence', source_event_types: [] }; }
function dec(comp, outcome) { return { event_type: 'decision_made', payload: { decision_axis: comp, selected_value: 'x' }, evidence: { outcome: outcome, domain_tags: [comp] }, event_id: comp + Math.random(), occurred_at: new Date().toISOString() }; }
function conf(c, outcome) { return { event_type: 'confidence_selected', payload: { confidence: c }, evidence: { outcome: outcome }, event_id: 'c' + Math.random(), occurred_at: new Date().toISOString() }; }
function mis(id, status, title) { return { event_type: 'misconception_' + status, payload: { misconception_id: id }, evidence: { title: title }, event_id: id + status, occurred_at: new Date().toISOString() }; }

function titles(r) { return r.messages.map(m => m.title); }
function bySev(r, sev) { return r.messages.filter(m => m.severity === sev); }

console.log('Mentor Cognitivo — pruebas');

t('determinista: mismo input → mismo output', () => {
  const input = { metrics: { domain: metric(0.66, 18), calibration: metric(0.47, 12), transfer: metric(0.42, 6), readiness: metric(0.62, 4) },
    events: [dec('Nariz', 'incorrect'), conf(80, 'incorrect'), mis('x', 'detected', 'X')] };
  const a = JSON.stringify(M.interpret(input));
  const b = JSON.stringify(M.interpret(input));
  assert.strictEqual(a, b);
});

t('arranque en frío: sin evidencia no inventa lecturas', () => {
  const r = M.interpret({ metrics: {}, events: [] });
  assert.ok(titles(r).some(x => /Aún no tengo lecturas/i.test(x)), 'debe avisar evidencia insuficiente');
  // no debe afirmar readiness/calibración
  assert.ok(!titles(r).some(x => /Preparación:/.test(x)));
  assert.ok(bySev(r, 'action').length >= 1, 'debe dar un primer paso');
});

t('sobreconfianza: calibración baja + fallos con alta confianza', () => {
  const r = M.interpret({ metrics: { calibration: metric(0.45, 10) }, events: [conf(85, 'incorrect'), conf(80, 'incorrect'), conf(70, 'incorrect')] });
  const w = bySev(r, 'warn');
  assert.ok(w.some(m => /confianza no predice/i.test(m.title)), 'debe marcar calibración');
  assert.ok(w.some(m => /sobreconfianza/i.test(m.body)), 'debe identificar dirección sobreconfianza');
});

t('competencia más débil identificada desde eventos', () => {
  const r = M.interpret({ metrics: { domain: metric(0.6, 12) },
    events: [dec('Nariz', 'incorrect'), dec('Nariz', 'incorrect'), dec('Nariz', 'incorrect'), dec('Nariz', 'correct'),
             dec('Paladar', 'correct'), dec('Paladar', 'correct'), dec('Paladar', 'correct')] });
  assert.ok(titles(r).some(x => /eje más débil es Nariz/i.test(x)), 'Nariz como eje débil');
});

t('transferencia baja → riesgo de memorización (crítico)', () => {
  const r = M.interpret({ metrics: { transfer: metric(0.4, 8) }, events: [] });
  const c = bySev(r, 'crit');
  assert.ok(c.some(m => /memorización/i.test(m.title)), 'debe alertar memorización');
});

t('misconception activa vs resuelta', () => {
  const r = M.interpret({ metrics: { domain: metric(0.6, 5) },
    events: [mis('a', 'detected', 'Idea A'), mis('b', 'detected', 'Idea B'), mis('b', 'resolved', 'Idea B')] });
  assert.ok(bySev(r, 'crit').some(m => /Idea A/.test(m.body)), 'A activa = crítico');
  assert.ok(bySev(r, 'ok').some(m => /Idea B/.test(m.body)), 'B resuelta = observación');
});

t('readiness produce síntesis con banda y puerta del simulacro', () => {
  const r = M.interpret({ metrics: { readiness: metric(0.62, 4) }, events: [] });
  const s = bySev(r, 'synthesis');
  assert.ok(s.length === 1, 'una síntesis');
  assert.ok(/En camino/.test(s[0].title) && /62%/.test(s[0].title));
  assert.ok(/70%/.test(s[0].body), 'menciona la puerta del simulacro');
});

t('cada mensaje cita su base (evidencia)', () => {
  const r = M.interpret({ metrics: { domain: metric(0.66, 18), calibration: metric(0.9, 12), transfer: metric(0.8, 6), readiness: metric(0.8, 4) }, events: [] });
  assert.ok(r.messages.length > 0);
  assert.ok(r.messages.every(m => typeof m.basis === 'string' && m.basis.length > 0), 'todos con basis no vacío');
});

t('prioridad determinista: crítico antes que síntesis antes que recomendación', () => {
  const r = M.interpret({ metrics: { transfer: metric(0.3, 8), readiness: metric(0.62, 4) }, events: [mis('z', 'detected', 'Z')] });
  const order = r.messages.map(m => m.severity);
  assert.ok(order.indexOf('crit') < order.indexOf('synthesis'), 'crit antes de synthesis');
  assert.ok(order.indexOf('synthesis') < order.indexOf('action'), 'synthesis antes de action');
});

t('readiness ≥ 75% → banda Listo', () => {
  const r = M.interpret({ metrics: { readiness: metric(0.8, 6) }, events: [] });
  assert.ok(bySev(r, 'synthesis')[0].title.includes('Listo'));
});

console.log('\nTODAS LAS PRUEBAS OK (' + pass + ')');
