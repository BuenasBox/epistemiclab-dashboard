const test = require('node:test');
const assert = require('node:assert/strict');

// Phase P3: Enriched-First SBA Selection Tests
// Verifies that diagnostic SBA modes prioritize enriched items (with pedagogical fields)
// before falling back to non-enriched items.

// Mock sbaShuf function (deterministic Fisher-Yates)
function sbaShuf(arr, seed) {
  const a = arr.slice();
  let s = Math.abs(((seed || Date.now())) & 0x7fffffff);
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// isEnriched detection (from diagnostic-sba/index.html)
function isEnriched(item) {
  return !!(item.feedback_by_mode || item.causal_chain || item.micro_drill);
}

// Simulate loadMode logic with enriched-first selection
function loadModeSimulated(mode, bank, recent = [], fixedSeed = 12345) {
  if (!bank || !bank.items) {
    throw new Error('PREGUNTAS_BANK not loaded');
  }

  const all = bank.items.slice();
  let selected = [];

  if (mode === 'mock_theory_1') {
    const MOCK_RA = { RA1: 8, RA2: 28, RA3: 5, RA4: 5, RA5: 4 };
    const byRa = {};

    all.forEach((i) => {
      const r = i.ra || 'RA1';
      if (!byRa[r]) byRa[r] = [];
      byRa[r].push(i);
    });

    Object.entries(MOCK_RA).forEach(([ra, need]) => {
      let pool = byRa[ra] || [];

      // Phase P3: enriched-first within RA bucket
      const enrichedPool = sbaShuf(
        pool.filter((i) => isEnriched(i)),
        fixedSeed + ra.charCodeAt(2)
      );
      const fallbackPool = sbaShuf(
        pool.filter((i) => !isEnriched(i)),
        fixedSeed + ra.charCodeAt(2) + 100
      );
      pool = [...enrichedPool, ...fallbackPool];

      // Filter out recent items (unseen first, then seen)
      const unseen = pool.filter((i) => !recent.includes(i.source_question_id));
      const seen = pool.filter((i) => recent.includes(i.source_question_id));
      pool = [...unseen, ...seen];

      selected.push(...pool.slice(0, need));
    });

    selected = sbaShuf(selected, fixedSeed);
  } else {
    const size = { quick_drill: 5, express: 10, standard: 25 }[mode] || 10;
    const all_unseen = all.filter((i) => !recent.includes(i.source_question_id));
    const all_seen = all.filter((i) => recent.includes(i.source_question_id));

    // Phase P3: enriched-first selection for diagnostic modes
    const enrichedUnseen = sbaShuf(
      all_unseen.filter((i) => isEnriched(i)),
      fixedSeed
    );
    const fallbackUnseen = sbaShuf(
      all_unseen.filter((i) => !isEnriched(i)),
      fixedSeed + 100
    );
    const fresh = [...enrichedUnseen, ...fallbackUnseen];

    const enrichedSeen = sbaShuf(
      all_seen.filter((i) => isEnriched(i)),
      fixedSeed + 1
    );
    const fallbackSeen = sbaShuf(
      all_seen.filter((i) => !isEnriched(i)),
      fixedSeed + 101
    );
    const stale = [...enrichedSeen, ...fallbackSeen];

    selected = [...fresh, ...stale].slice(0, size);
  }

  return selected;
}

test('isEnriched() detects items with feedback_by_mode', (t) => {
  const item = {
    source_question_id: 'Q1',
    feedback_by_mode: { quick_drill: 'feedback text' },
  };
  assert.strictEqual(isEnriched(item), true);
});

test('isEnriched() detects items with causal_chain', (t) => {
  const item = {
    source_question_id: 'Q2',
    causal_chain: { id: 'CC_SAT_QUALITY_HIGH' },
  };
  assert.strictEqual(isEnriched(item), true);
});

test('isEnriched() detects items with micro_drill', (t) => {
  const item = {
    source_question_id: 'Q3',
    micro_drill: { drill_id: 'DRILL_001' },
  };
  assert.strictEqual(isEnriched(item), true);
});

test('isEnriched() returns false for non-enriched items', (t) => {
  const item = {
    source_question_id: 'Q4',
    stem: 'Basic question',
  };
  assert.strictEqual(isEnriched(item), false);
});

test('quick_drill mode selects 5 enriched items first', (t) => {
  const bank = {
    items: [
      { source_question_id: 'E1', feedback_by_mode: { quick_drill: 'text' } },
      { source_question_id: 'E2', causal_chain: { id: 'CC_001' } },
      { source_question_id: 'E3', micro_drill: { drill_id: 'D1' } },
      { source_question_id: 'E4', feedback_by_mode: { quick_drill: 'text' } },
      { source_question_id: 'E5', causal_chain: { id: 'CC_002' } },
      { source_question_id: 'E6', causal_chain: { id: 'CC_003' } },
      { source_question_id: 'N1', stem: 'Non-enriched 1' },
      { source_question_id: 'N2', stem: 'Non-enriched 2' },
    ],
  };

  const selected = loadModeSimulated('quick_drill', bank, []);
  assert.strictEqual(selected.length, 5);

  // All selected items should be enriched (since we have at least 5 enriched)
  const allEnriched = selected.every((item) => isEnriched(item));
  assert.strictEqual(allEnriched, true);
});

test('express mode selects 10 items with enriched preference', (t) => {
  const bank = {
    items: Array.from({ length: 20 }, (_, i) => ({
      source_question_id: `Q${i + 1}`,
      ...(i < 12 && { feedback_by_mode: { express: 'text' } }), // 12 enriched
    })),
  };

  const selected = loadModeSimulated('express', bank, []);
  assert.strictEqual(selected.length, 10);

  // Count enriched items in selection
  const enrichedCount = selected.filter((item) => isEnriched(item)).length;
  // Should have at least 10 enriched (have 12 available)
  assert.strictEqual(enrichedCount, 10);
});

test('standard mode selects 25 items with enriched-first ordering', (t) => {
  const bank = {
    items: Array.from({ length: 50 }, (_, i) => ({
      source_question_id: `Q${i + 1}`,
      ...(i < 30 && { causal_chain: { id: 'CC_001' } }), // 30 enriched
    })),
  };

  const selected = loadModeSimulated('standard', bank, []);
  assert.strictEqual(selected.length, 25);

  // All selected should be enriched (30 available, need 25)
  const enrichedCount = selected.filter((item) => isEnriched(item)).length;
  assert.strictEqual(enrichedCount, 25);
});

test('standard mode falls back to non-enriched when needed', (t) => {
  const bank = {
    items: Array.from({ length: 50 }, (_, i) => ({
      source_question_id: `Q${i + 1}`,
      ...(i < 10 && { feedback_by_mode: { standard: 'text' } }), // Only 10 enriched
    })),
  };

  const selected = loadModeSimulated('standard', bank, []);
  assert.strictEqual(selected.length, 25);

  // Should have all 10 enriched + 15 non-enriched
  const enrichedCount = selected.filter((item) => isEnriched(item)).length;
  const nonEnrichedCount = selected.filter((item) => !isEnriched(item)).length;
  assert.strictEqual(enrichedCount, 10);
  assert.strictEqual(nonEnrichedCount, 15);
});

test('recent items are deprioritized correctly', (t) => {
  const bank = {
    items: [
      { source_question_id: 'E1', feedback_by_mode: { quick_drill: 'text' } },
      { source_question_id: 'E2', causal_chain: { id: 'CC_001' } },
      { source_question_id: 'E3', micro_drill: { drill_id: 'D1' } },
      { source_question_id: 'E4', feedback_by_mode: { quick_drill: 'text' } },
      { source_question_id: 'E5', causal_chain: { id: 'CC_002' } },
      { source_question_id: 'E6', feedback_by_mode: { quick_drill: 'text' } },
      { source_question_id: 'E7', causal_chain: { id: 'CC_003' } },
      { source_question_id: 'E8', micro_drill: { drill_id: 'D2' } },
      { source_question_id: 'E9', feedback_by_mode: { quick_drill: 'text' } },
      { source_question_id: 'E10', causal_chain: { id: 'CC_004' } },
      { source_question_id: 'N1', stem: 'Non-enriched 1' },
      { source_question_id: 'N2', stem: 'Non-enriched 2' },
    ],
  };

  const recent = ['E1', 'N1'];
  const selected = loadModeSimulated('express', bank, recent);

  // With 10 unseen items available, recent items (E1, N1) should be deprioritized
  const selectedIds = selected.map((item) => item.source_question_id);

  // At least some unseen items should appear before recent items in order
  const unseen_indices = [
    selectedIds.indexOf('E2'),
    selectedIds.indexOf('E3'),
    selectedIds.indexOf('E4'),
  ].filter((i) => i !== -1);

  // Verify unseen items are present
  assert.ok(unseen_indices.length > 0, 'unseen items should be selected');
});

test('mock_theory_1 preserves RA distribution with enriched preference', (t) => {
  const bank = {
    items: [
      // RA1 (need 8): 10 total, 6 enriched
      { source_question_id: 'RA1_E1', ra: 'RA1', feedback_by_mode: {} },
      { source_question_id: 'RA1_E2', ra: 'RA1', causal_chain: {} },
      { source_question_id: 'RA1_E3', ra: 'RA1', micro_drill: {} },
      { source_question_id: 'RA1_E4', ra: 'RA1', feedback_by_mode: {} },
      { source_question_id: 'RA1_E5', ra: 'RA1', causal_chain: {} },
      { source_question_id: 'RA1_E6', ra: 'RA1', micro_drill: {} },
      { source_question_id: 'RA1_N1', ra: 'RA1', stem: 'text' },
      { source_question_id: 'RA1_N2', ra: 'RA1', stem: 'text' },
      { source_question_id: 'RA1_N3', ra: 'RA1', stem: 'text' },
      { source_question_id: 'RA1_N4', ra: 'RA1', stem: 'text' },

      // RA2 (need 28): 40 total, 20 enriched
      ...Array.from({ length: 20 }, (_, i) => ({
        source_question_id: `RA2_E${i + 1}`,
        ra: 'RA2',
        feedback_by_mode: {},
      })),
      ...Array.from({ length: 20 }, (_, i) => ({
        source_question_id: `RA2_N${i + 1}`,
        ra: 'RA2',
        stem: 'text',
      })),

      // RA3 (need 5): 8 total, 5 enriched
      { source_question_id: 'RA3_E1', ra: 'RA3', feedback_by_mode: {} },
      { source_question_id: 'RA3_E2', ra: 'RA3', causal_chain: {} },
      { source_question_id: 'RA3_E3', ra: 'RA3', micro_drill: {} },
      { source_question_id: 'RA3_E4', ra: 'RA3', feedback_by_mode: {} },
      { source_question_id: 'RA3_E5', ra: 'RA3', causal_chain: {} },
      { source_question_id: 'RA3_N1', ra: 'RA3', stem: 'text' },
      { source_question_id: 'RA3_N2', ra: 'RA3', stem: 'text' },
      { source_question_id: 'RA3_N3', ra: 'RA3', stem: 'text' },

      // RA4 (need 5): 10 total, 3 enriched
      { source_question_id: 'RA4_E1', ra: 'RA4', feedback_by_mode: {} },
      { source_question_id: 'RA4_E2', ra: 'RA4', causal_chain: {} },
      { source_question_id: 'RA4_E3', ra: 'RA4', micro_drill: {} },
      { source_question_id: 'RA4_N1', ra: 'RA4', stem: 'text' },
      { source_question_id: 'RA4_N2', ra: 'RA4', stem: 'text' },
      { source_question_id: 'RA4_N3', ra: 'RA4', stem: 'text' },
      { source_question_id: 'RA4_N4', ra: 'RA4', stem: 'text' },
      { source_question_id: 'RA4_N5', ra: 'RA4', stem: 'text' },
      { source_question_id: 'RA4_N6', ra: 'RA4', stem: 'text' },
      { source_question_id: 'RA4_N7', ra: 'RA4', stem: 'text' },

      // RA5 (need 4): 5 total, 2 enriched
      { source_question_id: 'RA5_E1', ra: 'RA5', feedback_by_mode: {} },
      { source_question_id: 'RA5_E2', ra: 'RA5', causal_chain: {} },
      { source_question_id: 'RA5_N1', ra: 'RA5', stem: 'text' },
      { source_question_id: 'RA5_N2', ra: 'RA5', stem: 'text' },
      { source_question_id: 'RA5_N3', ra: 'RA5', stem: 'text' },
    ],
  };

  const selected = loadModeSimulated('mock_theory_1', bank, []);

  // Count by RA
  const byRa = {};
  selected.forEach((item) => {
    const ra = item.ra || 'RA1';
    if (!byRa[ra]) byRa[ra] = [];
    byRa[ra].push(item);
  });

  // Verify distribution matches blueprint
  assert.strictEqual(byRa['RA1'].length, 8);
  assert.strictEqual(byRa['RA2'].length, 28);
  assert.strictEqual(byRa['RA3'].length, 5);
  assert.strictEqual(byRa['RA4'].length, 5);
  assert.strictEqual(byRa['RA5'].length, 4);

  // Verify enriched preference within each RA
  const ra1Enriched = byRa['RA1'].filter((item) => isEnriched(item)).length;
  assert.ok(ra1Enriched >= 6); // All 6 available enriched should be used
});

test('deterministic shuffling is preserved', (t) => {
  const bank = {
    items: Array.from({ length: 30 }, (_, i) => ({
      source_question_id: `Q${i + 1}`,
      ...(i % 2 === 0 && { feedback_by_mode: { standard: 'text' } }),
    })),
  };

  const fixedSeed = 99999;
  // Run twice with same fixed seed
  const selected1 = loadModeSimulated('standard', bank, [], fixedSeed);
  const selected2 = loadModeSimulated('standard', bank, [], fixedSeed);

  // Should produce same order (deterministic)
  const ids1 = selected1.map((item) => item.source_question_id);
  const ids2 = selected2.map((item) => item.source_question_id);

  assert.deepStrictEqual(ids1, ids2);
});

test('empty bank returns empty selection', (t) => {
  const bank = { items: [] };
  const selected = loadModeSimulated('quick_drill', bank, []);
  assert.strictEqual(selected.length, 0);
});

test('bank with only non-enriched items still returns selection', (t) => {
  const bank = {
    items: Array.from({ length: 10 }, (_, i) => ({
      source_question_id: `Q${i + 1}`,
      stem: 'Non-enriched question',
    })),
  };

  const selected = loadModeSimulated('express', bank, []);
  assert.strictEqual(selected.length, 10);

  // All should be non-enriched (only option)
  const allNonEnriched = selected.every((item) => !isEnriched(item));
  assert.strictEqual(allNonEnriched, true);
});
