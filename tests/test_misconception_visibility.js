const assert = require('node:assert/strict');

const engine = require('../shared/misconception-engine.js');
const profile = require('../profile/profile.js');

function backendInsight(overrides) {
  return Object.assign({
    misconception_id: 'MC_MLF_01',
    active: true,
    confidence_label: 'high',
    evidence_count: 3,
    session_count: 2,
    student_statement: 'Your recorded answers contain this misunderstanding: MLF always makes a wine taste buttery.',
    coaching: {
      why_it_matters: 'MLF outcome depends on strain, temperature, and wine style.',
      what_is_confused: 'MLF always makes a wine taste buttery.',
      evidence_triggered: [
        { source_type: 'sba', session_id: 's1', item_id: 'q1' },
        { source_type: 'open_response', session_id: 's2', item_id: 'or1' }
      ],
      practice_next: { topics: ['T_RA1_WINEMAKING_WHITE'] },
      improvement_signal: 'Explain that buttery character is possible, not inevitable.'
    },
    recommendation: { type: 'misconception_review' }
  }, overrides || {});
}

const adapted = engine.adaptMisconceptionInsights([backendInsight()]);
assert.equal(adapted.length, 1);
assert.equal(adapted[0].confidence_label, 'high');
assert.equal(adapted[0].evidence_count, 3);
assert.equal(adapted[0].governance.safe_for_examiner, false);

const sessionOnly = engine.adaptMisconceptionInsights(
  [backendInsight()],
  's2'
);
assert.equal(sessionOnly.length, 1);
assert.equal(engine.adaptMisconceptionInsights([backendInsight()], 'missing').length, 0);

const html = profile.renderMisconceptionInsights(adapted);
assert.match(html, /Frecuencia de evidencia: alta/);
assert.match(html, /3 respuesta/);
assert.match(html, /buttery character is possible/);
assert.doesNotMatch(html, /MC_MLF_01/);
assert.doesNotMatch(html, /%/);
assert.doesNotMatch(html, /pass|fail|merit|distinction|readiness/i);

const legacy = engine.adaptMisconceptionInsights({
  recurrent_misconceptions: {
    MC_OAK_01: {
      hit_count: 2,
      coaching_content: {
        confusion_statement: 'Your answers treat any oak character as low quality.',
        improvement_signal: 'Explain integration and balance.'
      }
    }
  }
});
assert.equal(legacy.length, 1);
assert.equal(legacy[0].confidence_label, 'medium');

const emptyHtml = profile.renderMisconceptionInsights([]);
assert.match(emptyHtml, /no hay evidencia suficiente/i);

console.log('Misconception Profile visibility tests passed');
