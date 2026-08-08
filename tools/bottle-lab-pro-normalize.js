'use strict';

const { MISCONCEPTIONS_BY_CODE } = require('../content-bank/bottle-lab-pro/taxonomy/misconceptions.js');
const { MESSAGES } = require('../content-bank/bottle-lab-pro/mentor/messages.js');

const STRENGTH = { determinative: 1, strong: .85, moderate: .6, weak: .3, non_diagnostic: 0 };

function publicEvidence(entries) {
  return (entries || []).map(({ id, label, value, signal_type, technical_function, traditional_association, marketing_reading }) => ({
    id, label, value, signal_type, technical_function, traditional_association, marketing_reading,
  }));
}

function stepKind(phase) {
  if (phase === 'observe') return 'observation';
  if (phase === 'classify_evidence' || phase === 'hierarchize') return 'classification';
  return 'hypothesis';
}

function promptFor(phase) {
  const prompts = {
    observe: '¿Qué señal física está explícitamente presente?',
    classify_evidence: 'Clasifica la fuerza y función de la señal visible.',
    hierarchize: 'Distingue función técnica, tradición y lectura de marketing.',
    interpret: 'Interpreta la señal sin exceder lo que permite concluir.',
    hypothesize: 'Formula una hipótesis prudente.',
    declare_confidence: 'Declara tu nivel de confianza.',
    justify: 'Justifica con evidencia realmente relevante.',
    search_contradictions: 'Busca señales que contradigan o limiten tu hipótesis.',
    revise: 'Revisa tu hipótesis solo si la evidencia lo exige.',
  };
  return prompts[phase] || 'Continúa tu razonamiento.';
}

function hypothesisOptions(item) {
  return [
    ...(item.acceptable_hypotheses || []),
    ...(item.partial_hypotheses || []),
    ...(item.unsupported_hypotheses || []),
    ...(item.overprecise_hypotheses || []),
  ].map(({ id, text }) => ({ id, text }));
}

// Real bug found via Reasoning Replay verification (Priority 8, Product Implementation
// Marathon): every step's evidence array was built once from ONLY item.visible_evidence and
// reused unchanged across the whole sequence -- item.hidden_evidence was authored (9 of 12
// Bottle items have it, several explicitly required by acceptable_hypotheses.
// supporting_evidence_ids) but never merged into public_content anywhere, for any item, ever.
// Two compounding real-product consequences: (1) required_evidence_ids could reference
// evidence ids the client never rendered as selectable, making the fully-'supported' evidence
// band mathematically unreachable for those items; (2) the entire Contradiction Moment /
// hypothesis-revision UI mechanic (bottle-lab/index.html's pendingContradiction(), which
// triggers on evidence not previously seen in state.evidenceCatalog) could never fire, because
// no step ever introduced evidence the student hadn't already seen in step 1. The item bank
// explicitly authors a 'search_contradictions' phase ("Busca señales que contradigan o limiten
// tu hipótesis") for exactly this reveal -- hidden_evidence now appears starting there (and
// persists through 'revise'). Items without that phase but with hidden_evidence still reveal
// it, from the final step onward, so authored content is never silently dropped.
function publicContent(item) {
  const visible = publicEvidence(item.visible_evidence);
  const hidden = publicEvidence(item.hidden_evidence);
  const options = hypothesisOptions(item);
  const phases = item.prompt_sequence || [];
  const revealIndex = phases.includes('search_contradictions') ? phases.indexOf('search_contradictions') : phases.length - 1;
  return {
    steps: phases.map((phase, order) => ({
      id: phase, kind: stepKind(phase), prompt: promptFor(phase),
      evidence: hidden.length && order >= revealIndex ? [...visible, ...hidden] : visible,
      options: stepKind(phase) === 'hypothesis' ? options : [], order,
    })),
    learning_objectives: item.learning_objectives,
    difficulty: item.difficulty,
  };
}

function isUncertaintyHypothesis(hypothesis) {
  return /uncertainty|cannot_determine/i.test(hypothesis.band || '') || /no puede determinarse/i.test(hypothesis.text || '');
}

function buildRuntimeRecord(item) {
  const acceptable = item.acceptable_hypotheses || [];
  const partial = item.partial_hypotheses || [];
  const unsupported = item.unsupported_hypotheses || [];
  const overprecise = item.overprecise_hypotheses || [];
  // Priority 8 fix (see publicContent() above): required_evidence_ids can legitimately point at
  // hidden_evidence ids now that they're actually revealed client-side at 'search_contradictions'.
  // evidence_strengths/editorial_evidence_strength must know about those ids too, or a correctly
  // cited hidden-evidence answer would still score as strength 0 (unset id) even after the UI fix.
  const evidence = [...(item.visible_evidence || []), ...(item.hidden_evidence || [])];
  const misconceptionByResponse = Object.fromEntries(unsupported.filter((h) => h.misconception_code).map((h) => [h.id, h.misconception_code]));
  const misconceptionFeedback = Object.fromEntries((item.misconceptions || []).flatMap((code) => {
    const entry = MISCONCEPTIONS_BY_CODE[code];
    return entry ? [[code, entry.mentor_feedback_by_tier?.integrative || entry.mentor_feedback_by_tier?.introductory || '']] : [];
  }));
  const required = [...new Set(acceptable.flatMap((h) => h.supporting_evidence_ids || []))];
  return {
    item_id: item.item_id,
    lab_type: 'bottle',
    canonical_id: null,
    content_version: item.version,
    evaluation_version: `bottle-${item.version}`,
    public_content: publicContent(item),
    evaluation_spec: {
      version: `bottle-${item.version}`,
      supported_responses: acceptable.map((h) => h.id),
      partially_supported_responses: partial.map((h) => h.id),
      plausible_responses: partial.filter((h) => /plausible/i.test(h.band || '')).map((h) => h.id),
      unsupported_responses: unsupported.map((h) => h.id),
      contradictory_responses: unsupported.filter((h) => h.band === 'incompatible').map((h) => h.id),
      overprecise_responses: overprecise.map((h) => h.id),
      uncertainty_correct_responses: acceptable.filter(isUncertaintyHypothesis).map((h) => h.id),
      evasive_uncertainty_responses: [],
      uncertainty_allowed: acceptable.some(isUncertaintyHypothesis),
      required_evidence_ids: required,
      evidence_strengths: evidence.map(({ id, strength }) => ({ id, strength })),
      editorial_evidence_strength: Math.max(...evidence.map((entry) => STRENGTH[entry.strength] || 0), 0),
      misconception_by_response: misconceptionByResponse,
      mentor_feedback: [...(item.mentor_feedback || []), ...MESSAGES.filter((message) => ['confirmation', 'precision', 'caution', 'contradiction', 'calibration'].includes(message.category))],
      misconception_feedback: misconceptionFeedback,
      transfer_task: item.transfer_task,
      contradictions: item.contradictions || [],
      confidence_expectation: item.confidence_expectation,
    },
    reveal_content: item.reveal,
  };
}

module.exports = { publicEvidence, stepKind, promptFor, publicContent, buildRuntimeRecord };
