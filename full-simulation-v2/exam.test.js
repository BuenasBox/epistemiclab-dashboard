/* Pruebas deterministas del motor de evaluación de Full Simulation v2.
 * Ejecutar: node full-simulation-v2/exam.test.js */
'use strict';
const assert = require('assert');
const X = require('./exam.js');
let pass = 0;
function t(name, fn) { fn(); console.log('  ✓ ' + name); pass++; }
console.log('Full Simulation v2 — pruebas');
t('exporta el núcleo determinista', () => { ['ordinalTone','aromaTone','exactTone','toneToOutcome','SCALES'].forEach(k => assert.ok(X[k] !== undefined, 'falta ' + k)); });
t('ordinalTone: distancia 0 = coincide', () => { assert.strictEqual(X.ordinalTone('acidity','high','high'),'coincide'); assert.strictEqual(X.ordinalTone('quality','very-good','very-good'),'coincide'); });
t('ordinalTone: distancia 1 = cerca', () => { assert.strictEqual(X.ordinalTone('acidity','medium-plus','high'),'cerca'); assert.strictEqual(X.ordinalTone('sweetness','dry','off-dry'),'cerca'); });
t('ordinalTone: distancia >=2 = revisar', () => { assert.strictEqual(X.ordinalTone('acidity','low','high'),'revisar'); assert.strictEqual(X.ordinalTone('quality','acceptable','outstanding'),'revisar'); });
t('ordinalTone: valor invalido = revisar', () => { assert.strictEqual(X.ordinalTone('acidity',undefined,'high'),'revisar'); });
t('aromaTone: solapamiento >=66% = coincide', () => { assert.strictEqual(X.aromaTone(['citrico','mineral','fruta_blanca'],['citrico','mineral','fruta_blanca']),'coincide'); });
t('aromaTone: solapamiento moderado (50%) = cerca', () => { assert.strictEqual(X.aromaTone(['citrico','mineral'],['citrico','mineral','floral','herbaceo']),'cerca'); });
t('aromaTone: solapamiento bajo (33%) = revisar', () => { assert.strictEqual(X.aromaTone(['citrico'],['citrico','mineral','floral']),'revisar'); });
t('aromaTone: sin solapamiento = revisar', () => { assert.strictEqual(X.aromaTone(['roble'],['citrico','mineral','floral']),'revisar'); });
t('exactTone', () => { assert.strictEqual(X.exactTone('Chardonnay','chardonnay'),'coincide'); assert.strictEqual(X.exactTone('Riesling','Chardonnay'),'revisar'); assert.strictEqual(X.exactTone('','Chardonnay'),'revisar'); });
t('toneToOutcome', () => { assert.strictEqual(X.toneToOutcome('coincide'),'correct'); assert.strictEqual(X.toneToOutcome('cerca'),'correct'); assert.strictEqual(X.toneToOutcome('revisar'),'incorrect'); });
t('escenario de evaluacion determinista', () => { const tones={ acidity:X.ordinalTone('acidity','medium-plus','high'), sweetness:X.ordinalTone('sweetness','dry','dry'), quality:X.ordinalTone('quality','good','very-good') }; assert.deepStrictEqual(tones,{acidity:'cerca',sweetness:'coincide',quality:'cerca'}); const correct=Object.keys(tones).filter(k=>X.toneToOutcome(tones[k])==='correct').length; assert.strictEqual(correct,3); });
console.log('\nTODAS LAS PRUEBAS OK (' + pass + ')');
