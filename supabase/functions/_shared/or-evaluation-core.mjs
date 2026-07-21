/**
 * Pure deterministic evaluator for authored Open Response evaluation specs.
 * No network access, model calls, randomness, or time-dependent behavior.
 */

const STOPWORDS = new Set([
  'a','al','and','de','del','el','en','for','la','las','los','of','the','to','un','una','y'
]);

export const NEGATIONS = new Set(['no', 'sin', 'nunca', 'tampoco', 'ni', 'jamas']);

export function normalizeText(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/₂/g, '2')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9ñü\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function applyCommonMisspellings(value, corrections = {}) {
  let normalized = normalizeText(value);
  for (const [wrong, right] of Object.entries(corrections || {})) {
    const from = normalizeText(wrong);
    const to = normalizeText(right);
    if (!from || !to) continue;
    normalized = normalized.replace(new RegExp(`(^|\\s)${escapeRegExp(from)}(?=\\s|$)`, 'g'), `$1${to}`);
  }
  return normalized.replace(/\s+/g, ' ').trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wordsWithPositions(text) {
  const words = [];
  const re = /\b[a-z0-9ñü-]+\b/gi;
  let match;
  while ((match = re.exec(text))) words.push({ token: match[0], index: match.index, end: re.lastIndex });
  return words;
}

export function meaningfulTokens(value) {
  return wordsWithPositions(normalizeText(value)).map(x => x.token)
    .filter(token => token.length > 1 && !STOPWORDS.has(token));
}

function phrasePosition(answer, phrase) {
  const normalized = normalizeText(phrase);
  if (!normalized) return null;
  const re = new RegExp(`(^|\\s)${escapeRegExp(normalized)}(?=\\s|$)`, 'g');
  const match = re.exec(answer);
  if (!match) return null;
  const index = match.index + match[1].length;
  return { index, end: index + normalized.length, phrase: normalized };
}

function hasNegationBefore(answer, match, windowSize = 4) {
  const words = wordsWithPositions(answer);
  const matchWordIndex = words.findIndex(word => word.end > match.index);
  if (matchWordIndex < 0) return false;
  return words.slice(Math.max(0, matchWordIndex - windowSize), matchWordIndex)
    .some(word => NEGATIONS.has(word.token));
}

function forbiddenMatch(answer, contexts) {
  for (const context of contexts || []) {
    const found = phrasePosition(answer, context);
    if (found) return found;
  }
  return null;
}

function tokenEvidence(answer, phrases) {
  const answerWords = wordsWithPositions(answer);
  const meaningfulAnswer = answerWords.filter(word => word.token.length > 1 && !STOPWORDS.has(word.token));
  let best = null;
  for (const phrase of phrases) {
    const expected = meaningfulTokens(phrase);
    if (!expected.length) continue;
    const expectedSet = new Set(expected);
    const hits = meaningfulAnswer.filter(word => expectedSet.has(word.token));
    const hitNames = new Set(hits.map(word => word.token));
    const ratio = hitNames.size / new Set(expected).size;
    const candidate = {
      ratio,
      hits: hitNames.size,
      expected: new Set(expected).size,
      index: hits.length ? hits[0].index : -1,
      end: hits.length ? hits[hits.length - 1].end : -1,
      phrase: normalizeText(phrase),
    };
    if (!best || candidate.ratio > best.ratio || (candidate.ratio === best.ratio && candidate.hits > best.hits)) best = candidate;
  }
  return best;
}

export function evaluateConcept(concept, rawAnswer, commonMisspellings = {}) {
  const answer = applyCommonMisspellings(rawAnswer, commonMisspellings);
  const canonical = typeof concept === 'string' ? concept : concept?.canonical;
  const synonyms = typeof concept === 'object' && Array.isArray(concept?.synonyms) ? concept.synonyms : [];
  const forbidden = typeof concept === 'object' && Array.isArray(concept?.forbidden_contexts) ? concept.forbidden_contexts : [];
  const phrases = [canonical, ...synonyms].filter(Boolean);

  const forbiddenFound = forbiddenMatch(answer, forbidden);
  if (forbiddenFound) return { state: 'negated', canonical, evidence: forbiddenFound };

  for (const phrase of phrases) {
    const exact = phrasePosition(answer, phrase);
    if (!exact) continue;
    if (hasNegationBefore(answer, exact)) return { state: 'negated', canonical, evidence: exact };
    return { state: 'affirmed', canonical, evidence: exact };
  }

  const evidence = tokenEvidence(answer, phrases);
  if (!evidence || evidence.hits === 0) return { state: 'missing', canonical, evidence: null };
  if (hasNegationBefore(answer, evidence)) return { state: 'negated', canonical, evidence };
  if (evidence.hits >= 2 && evidence.ratio >= 0.6) return { state: 'partial', canonical, evidence };
  return { state: 'mentioned', canonical, evidence };
}

function strongestResult(results) {
  const rank = { affirmed: 5, partial: 4, negated: 3, mentioned: 2, missing: 1 };
  return results.reduce((best, current) => !best || rank[current.state] > rank[best.state] ? current : best, null);
}

function evaluateStage(stage, answer, misspellings) {
  const patterns = [...(stage?.patterns || []), ...(stage?.synonyms || [])];
  if (!patterns.length) return { state: 'missing', evidence: null };
  return strongestResult(patterns.map(pattern => evaluateConcept({ canonical: pattern }, answer, misspellings)));
}

function hasConnectorBetween(answer, from, to, connectors) {
  if (!from?.evidence || !to?.evidence) return false;
  const normalized = applyCommonMisspellings(answer, {});
  const start = Math.max(0, from.evidence.end);
  const end = Math.max(start, to.evidence.index);
  const bridge = normalized.slice(start, end);
  return (connectors || []).some(connector => phrasePosition(bridge, connector));
}

export function evaluateCausalChain(chain, rawAnswer, commonMisspellings = {}) {
  if (!chain || typeof chain !== 'object') return null;
  const answer = applyCommonMisspellings(rawAnswer, commonMisspellings);
  const results = {
    causa: evaluateStage(chain.causa, answer, commonMisspellings),
    mecanismo: evaluateStage(chain.mecanismo, answer, commonMisspellings),
    efecto: evaluateStage(chain.efecto, answer, commonMisspellings),
  };
  const transitions = Array.isArray(chain.transitions) ? chain.transitions : ['causa->mecanismo', 'mecanismo->efecto'];
  const weak = [];
  for (const transition of transitions) {
    const [fromName, toName] = transition.split('->');
    const from = results[fromName];
    const to = results[toName];
    const positive = from && to && from.state === 'affirmed' && to.state === 'affirmed';
    const ordered = positive && from.evidence && to.evidence && from.evidence.index < to.evidence.index;
    const connected = ordered && hasConnectorBetween(answer, from, to, chain.connectors_expected || []);
    if (!connected) weak.push(transition);
  }
  return {
    causa: results.causa.state,
    mecanismo: results.mecanismo.state,
    efecto: results.efecto.state,
    transiciones_debiles: weak,
    required: chain.required !== false,
  };
}

export function evaluateSpec(spec, rawAnswer) {
  const concepts = Array.isArray(spec?.concepts) ? spec.concepts : [];
  const misspellings = spec?.common_misspellings || {};
  const buckets = { affirmed: [], negated: [], mentioned: [], partial: [], missing: [] };
  for (const concept of concepts) {
    const result = evaluateConcept(concept, rawAnswer, misspellings);
    buckets[result.state].push(result.canonical);
  }
  const causal = evaluateCausalChain(spec?.causal_chain, rawAnswer, misspellings);
  const tokenCount = meaningfulTokens(applyCommonMisspellings(rawAnswer, misspellings)).length;
  const minimum = Number(spec?.answer_length_guidance?.min_meaningful_tokens || 0);
  const answerLengthFlag = minimum > 0 && tokenCount < minimum ? 'too_short' : null;
  const positive = buckets.affirmed.length + buckets.partial.length;
  const evidenceQuality = answerLengthFlag ? 'insufficient'
    : (positive >= Math.max(1, Math.ceil(concepts.length * 0.75)) ? 'specific' : 'developing');
  return {
    conceptual_coverage: buckets,
    causal_chain: causal,
    command_verb: spec?.command_verb || null,
    evidence_quality: evidenceQuality,
    answer_length_flag: answerLengthFlag,
    meaningful_token_count: tokenCount,
  };
}
