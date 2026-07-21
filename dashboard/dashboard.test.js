/* Pruebas del Dashboard. Verifica que NO calcula: solo pasa-trávez de EP-03 + Loop + Mentor.
 * Ejecutar: node dashboard/dashboard.test.js */
'use strict';
const assert = require('assert');
const Dashboard = require('./dashboard.js');
let pass = 0;
function t(name, fn) { fn(); console.log('  ✓ ' + name); pass++; }
function metric(v, n) { return { value: v, evidence_count: n, status: (n > 0 && v !== null) ? 'derived' : 'insufficient_evidence', source_event_types: [] }; }
function bundle(over) {
  over = over || {};
  return {
    summary: { ok: true, view: 'summary', data: {
      profile_version: 'EP-01', status: 'active', event_count: 64, weakest_metric: over.weakest || 'readiness',
      metrics: over.metrics || { domain: metric(0.69, 22), calibration: metric(0.74, 12), transfer: metric(0.71, 6), readiness: metric(0.66, 4), adherence: metric(0.86, 5) }
    } },
    recent_sessions: { ok: true, view: 'recent_sessions', data: over.sessions || [
      { session_id: 'l2', session_type: 'label-guided', status: 'completed', completed_at: '2026-06-18T00:00:00.000Z' },
      { session_id: 'b1', session_type: 'bottle-guided', status: 'completed', completed_at: '2026-06-15T00:00:00.000Z' }
    ] },
    open_misconceptions: { ok: true, view: 'open_misconceptions', data: over.misconceptions !== undefined ? over.misconceptions : [
      { misconception_id: 'praedikat-equals-sweetness', label: 'Prädikat no es dulzor', detected_at: '2026-06-15T00:00:00.000Z', last_seen_at: '2026-06-17T00:00:00.000Z', domain_tags: ['Teoria'] }
    ] },
    recommendations: { ok: true, view: 'recommendations', data: [] }
  };
}
console.log('Dashboard — pruebas');
t('readiness es pasa-trávez exacto de EP-03 (no calcula)', () => { assert.strictEqual(Dashboard.buildViewModel(bundle()).readiness.pct, 66); });
t('confianza y transferencia pasa-trávez', () => { var vm=Dashboard.buildViewModel(bundle()); assert.strictEqual(vm.confidence.pct,74); assert.strictEqual(vm.transfer.pct,71); });
t('misconceptions vienen tal cual de EP-03', () => { var vm=Dashboard.buildViewModel(bundle()); assert.strictEqual(vm.misconceptions.length,1); assert.strictEqual(vm.misconceptions[0].label,'Prädikat no es dulzor'); });
t('next practice viene del Learning Loop', () => { var vm=Dashboard.buildViewModel(bundle()); assert.ok(vm.next.label); assert.strictEqual(vm.next.halt,true); });
t('mentor headline viene del Mentor Cognitivo', () => { var vm=Dashboard.buildViewModel(bundle()); assert.ok(vm.mentor && vm.mentor.severity && vm.mentor.title); });
t('responde las 8 preguntas (answers del Loop)', () => { var vm=Dashboard.buildViewModel(bundle()); ['whatNext','why','whichMisconceptionFirst','whichCompetencyBlocking','repeatBottleWhen','moveToLabelWhen','recommendFullSimWhen','haltWhen'].forEach(k=>assert.ok(typeof vm.answers[k]==='string' && vm.answers[k].length,'falta '+k)); });
t('determinista: mismo bundle → mismo view model', () => { assert.strictEqual(JSON.stringify(Dashboard.buildViewModel(bundle())),JSON.stringify(Dashboard.buildViewModel(bundle()))); });
t('readiness sin evidencia → pct null', () => { var vm=Dashboard.buildViewModel(bundle({ metrics:{ readiness:metric(null,0), calibration:metric(null,0), transfer:metric(null,0), domain:metric(null,0), adherence:metric(null,0) }, misconceptions:[] })); assert.strictEqual(vm.readiness.pct,null); assert.strictEqual(vm.confidence.pct,null); });
t('último avance = sesión más reciente', () => { assert.strictEqual(Dashboard.buildViewModel(bundle()).lastProgress.type,'label-guided'); });
t('routeFor: cada práctica del Learning Loop tiene una ruta real distinta de bottle-lab por defecto', () => {
  assert.strictEqual(Dashboard.routeFor('diagnostic'), '/diagnostic-sba/');
  assert.strictEqual(Dashboard.routeFor('bottle-guided'), '/bottle-lab/');
  assert.strictEqual(Dashboard.routeFor('label-guided'), '/label-lab/');
  assert.strictEqual(Dashboard.routeFor('sat-blind'), '/sat-lab/');
  assert.strictEqual(Dashboard.routeFor('calibration-drill'), '/adaptive-session/?mode=sat_sprint');
  assert.strictEqual(Dashboard.routeFor('novel-practice'), '/adaptive-session/');
  assert.strictEqual(Dashboard.routeFor('targeted-remediation'), '/adaptive-session/');
  assert.strictEqual(Dashboard.routeFor('full-simulation'), '/full-simulation-v2/');
  assert.strictEqual(Dashboard.routeFor('practica-desconocida'), '/adaptive-session/');
});
console.log('\nTODAS LAS PRUEBAS OK (' + pass + ')');
