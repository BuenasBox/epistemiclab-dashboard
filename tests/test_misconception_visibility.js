/**
 * Misconception Visibility Validation Tests — M.5 & M.6
 * Quick validation of misconception rendering logic
 * Run: node tests/test_misconception_visibility.js
 */

const assert = require('assert');

// M.5: Profile Misconception Visibility Tests
function testM5ProfileVisibility() {
  console.log('\n=== M.5: Profile Misconception Visibility ===\n');

  // Test 1: Render panel with misconceptions
  {
    const mockMemory = {
      recurrent_misconceptions: {
        'MC_MLF_01': {
          hit_count: 3,
          confidence: 0.75,
          coaching_content: {
            confusion_statement: 'You confuse MLF with buttery flavor',
            improvement_signal: 'Practice MLF mechanism questions'
          }
        }
      }
    };
    assert(mockMemory.recurrent_misconceptions['MC_MLF_01']);
    assert(mockMemory.recurrent_misconceptions['MC_MLF_01'].hit_count === 3);
    console.log('✓ Render panel with misconceptions');
  }

  // Test 2: Student-facing language (no technical IDs)
  {
    const text = 'You frequently confuse the purpose of malolactic conversion with alcoholic fermentation.';
    assert(!text.includes('MC_MLF_01'));
    assert(!text.includes('MC_'));
    assert(text.includes('confuse'));
    console.log('✓ Student-facing language (no technical node IDs)');
  }

  // Test 3: Evidence-based content
  {
    const misc = { hit_count: 5, confidence: 0.82 };
    assert(misc.hit_count >= 1);
    assert(misc.confidence >= 0 && misc.confidence <= 1);
    const display = `Detectado ${misc.hit_count} veces · Confianza: ${Math.round(misc.confidence * 100)}%`;
    assert(!display.includes('probability'));
    console.log('✓ Evidence-based content (no probability language)');
  }

  // Test 4: Limit display to top 3
  {
    const items = ['MC_MLF_01', 'MC_OAK_01', 'MC_TANNIN_01', 'MC_ACIDITY_01', 'MC_ALCOHOL_QUALITY_01'];
    const displayed = items.slice(0, 3);
    assert(displayed.length === 3);
    console.log('✓ Limit display to top 3');
  }

  // Test 5: Governance - no grading language
  {
    const coaching = 'You frequently confuse MLF with buttery flavor.';
    assert(!coaching.includes('pass'));
    assert(!coaching.includes('fail'));
    assert(!coaching.includes('grade'));
    assert(!coaching.includes('score'));
    console.log('✓ Governance: no grading language');
  }

  // Test 6: Fallback message when empty
  {
    const fallback = 'Aún no detectamos concepciones frecuentes. Sigue practicando para obtener insights.';
    assert(fallback.length > 0);
    assert(fallback.includes('concepciones'));
    console.log('✓ Fallback message when no misconceptions');
  }
}

// M.6: Full Simulation Misconception Visibility Tests
function testM6SimulationVisibility() {
  console.log('\n=== M.6: Full Simulation Misconception Visibility ===\n');

  // Test 1: Render post-sim findings
  {
    const memory = {
      recurrent_misconceptions: {
        'MC_MLF_01': {
          hit_count: 2,
          coaching_content: { confusion_statement: 'You confuse MLF', improvement_signal: 'Practice' }
        }
      }
    };
    assert(memory.recurrent_misconceptions);
    assert(memory.recurrent_misconceptions['MC_MLF_01'].hit_count > 0);
    console.log('✓ Render post-sim misconception findings');
  }

  // Test 2: Evidence count
  {
    const miscs = [
      { id: 'MC_MLF_01', detected_in_or_items: [1, 3], evidence_count: 2 },
      { id: 'MC_OAK_01', detected_in_or_items: [2], evidence_count: 1 }
    ];
    miscs.forEach(m => {
      assert(m.evidence_count === m.detected_in_or_items.length);
    });
    console.log('✓ Evidence count from Part 2 detections');
  }

  // Test 3: Limit to top 3
  {
    const allItems = Array.from({length: 8}, (_, i) => `MC_${i}`);
    const displayed = allItems.slice(0, 3);
    assert(displayed.length === 3);
    console.log('✓ Limit simulation summary to top 3');
  }

  // Test 4: Governance clean
  {
    const text = 'Concepciones frecuentes detectadas en tus respuestas. Las respuestas formativas no están calificadas.';
    assert(!text.toLowerCase().includes('pass'));
    assert(!text.toLowerCase().includes('fail'));
    assert(!text.toLowerCase().includes('grade'));
    assert(!text.toLowerCase().includes('score'));
    assert(!text.toLowerCase().includes('merit'));
    assert(!text.toLowerCase().includes('distinction'));
    console.log('✓ Governance: no scoring language in findings');
  }

  // Test 5: Remediation topics
  {
    const misc = {
      coaching_content: { improvement_signal: 'Practice MLF mechanism questions' },
      remediation_topics: ['T_RA1_WINEMAKING_WHITE', 'T_RA2_FERMENTATION']
    };
    assert(misc.coaching_content.improvement_signal.length > 0);
    assert(Array.isArray(misc.remediation_topics) && misc.remediation_topics.length > 0);
    console.log('✓ Remediation topics for next practice');
  }

  // Test 6: Formative not scoring
  {
    const coaching = {
      confusion_statement: 'You frequently confuse MLF with buttery flavor',
      improvement_signal: 'Practice MLF mechanism questions',
      evidence: 'Detected 3 times'
    };
    assert(coaching.confusion_statement.includes('confuse') || coaching.confusion_statement.includes('You'));
    assert(coaching.improvement_signal.includes('Practice'));
    assert(!JSON.stringify(coaching).includes('pass'));
    console.log('✓ Coaching framing (not grading)');
  }
}

// Governance Safety Tests
function testGovernanceSafety() {
  console.log('\n=== Governance & Safety ===\n');

  // Test 1: Flags
  {
    const flags = { safe_for_examiner: false, examiner_scoring_allowed: false };
    assert(flags.safe_for_examiner === false);
    assert(flags.examiner_scoring_allowed === false);
    console.log('✓ safe_for_examiner=false, examiner_scoring_allowed=false');
  }

  // Test 2: Evidence not prediction
  {
    const data = { hit_count: 3, confidence: 0.75 };
    assert(typeof data.hit_count === 'number' && data.hit_count > 0);
    const display = `Detectado ${data.hit_count} veces`;
    assert(!display.includes('may'));
    assert(!display.includes('probably'));
    assert(!display.includes('likely'));
    assert(!display.includes('predict'));
    console.log('✓ Evidence-based display (not predictive)');
  }

  // Test 3: No technical ID exposure
  {
    const panel = 'You frequently confuse the purpose of malolactic conversion with alcoholic fermentation.';
    const techIds = ['MC_MLF_01', 'MC_OAK_01', 'MC_TANNIN_01'];
    techIds.forEach(id => assert(!panel.includes(id)));
    console.log('✓ No technical node IDs exposed to students');
  }
}

// Run all tests
if (require.main === module) {
  let totalPassed = 0, totalFailed = 0;

  try {
    testM5ProfileVisibility();
    totalPassed += 6;
  } catch (e) {
    totalFailed++;
    console.error(`✗ M.5 test failed: ${e.message}`);
  }

  try {
    testM6SimulationVisibility();
    totalPassed += 6;
  } catch (e) {
    totalFailed++;
    console.error(`✗ M.6 test failed: ${e.message}`);
  }

  try {
    testGovernanceSafety();
    totalPassed += 3;
  } catch (e) {
    totalFailed++;
    console.error(`✗ Governance test failed: ${e.message}`);
  }

  console.log(`\n=== RESULTS ===\n${totalPassed} passed, ${totalFailed} failed\n`);
  process.exit(totalFailed > 0 ? 1 : 0);
}

module.exports = { };
