/**
 * EVALUATE-OR Edge Function
 * Formative feedback analysis for Open Response Lab
 *
 * PURPOSE:
 * Analyzes student responses to open-ended questions and provides formative feedback
 * about conceptual coverage and causal reasoning completeness. This is NOT official
 * grading or WSET-equivalent evaluation. It's a pedagogical coaching tool.
 *
 * As of this version, it also returns `distinction_feedback`: a per-question,
 * WSET3-grounded explanation (authored in or_bank.feedback_profile) of *why*
 * the response landed at its depth band, not just which concepts were found.
 * `depth` can no longer reach "strong" purely from concept coverage — explicit
 * causal reasoning is required too, matching how distinction-level answers
 * are actually judged.
 *
 * GOVERNANCE:
 * - safe_for_examiner: false
 * - formative_only: true
 * - official_scoring: false
 * - examiner_scoring_allowed: false
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';
import { privateJsonHeaders } from '../_shared/sat-access.ts';
import { verifyLearningAccess } from '../_shared/learning-access.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: privateJsonHeaders(corsHeaders),
  });
}

async function sha256(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Linguistic preprocessing
const STOPWORDS = new Set([
  'a','al','and','de','del','el','en','for','la','las','los','of','the','to','un','una','y'
]);

const CONNECTORS = new Set([
  'porque','debido','causa','causar','provoca','produce','resulta','resultado',
  'conduce','influye','afecta','impacta','therefore','because','leads','results'
]);

// Maps the internal depth bucket to the feedback_profile key authored in
// or_bank. feedback_profile holds a per-question, WSET3-grounded explanation
// of what separates a foundational / developing / distinction-level (strong)
// response — this is the actual "why" the student needs, not just a list of
// which concepts were found or missing.
const DEPTH_TO_FEEDBACK_KEY = {
  strong: 'STRONG_RESPONSE',
  developing: 'DEVELOPING_RESPONSE',
  emerging: 'FOUNDATIONAL_RESPONSE',
};

/**
 * Normalize text for comparison:
 * - lowercase
 * - remove diacritics
 * - collapse whitespace
 */
function normalizeText(text) {
  return String(text || '').toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/₂/g, '2')
    .trim().replace(/\s+/g, ' ');
}

/**
 * Extract meaningful tokens (words >1 char, excluding stopwords)
 */
function meaningfulTokens(text) {
  return (normalizeText(text).match(/\b[^\W\d_](?:[^\W_]|['-])*\b/gu) || [])
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/**
 * Concept Detection Algorithm
 *
 * STRATEGY: Hybrid approach (exact match + token-based)
 * 1. Exact substring match (most reliable)
 * 2. Token overlap (catches paraphrases and partial statements)
 * 3. Classification: 'present' (detected), 'partial' (partial match), 'missing' (absent)
 *
 * RATIONALE:
 * - Exact match catches well-articulated responses
 * - Token overlap catches paraphrases (e.g., "cool climate" vs. "cool temps")
 * - Partial classification allows feedback nuance without false positives
 *
 * LIMITATIONS:
 * - Does not understand semantic equivalence (e.g., "cold" ≠ "cool" detected as different)
 * - Cannot detect implicit reasoning (student knows but didn't write it)
 * - Cannot distinguish between presence and centrality (concept mentioned in passing vs. core)
 */
function conceptState(concept, answer) {
  const conceptNorm = normalizeText(concept);
  const answerNorm = normalizeText(answer);

  // Exact substring match (highest confidence)
  if (conceptNorm && answerNorm.includes(conceptNorm)) return 'present';

  // Token-based match (paraphrase detection)
  const conceptTokens = meaningfulTokens(concept);
  const answerTokens = new Set(meaningfulTokens(answer));

  if (!conceptTokens.length) return 'missing';

  const hits = conceptTokens.filter((t) => answerTokens.has(t));

  if (hits.length === conceptTokens.length) return 'present';      // all tokens present
  if (hits.length) return 'partial';                               // some tokens present
  return 'missing';                                                // no tokens match
}

/**
 * Generate targeted revision suggestion
 *
 * STRATEGY:
 * 1. If missing critical concepts: suggest incorporating them
 * 2. If partial concepts: suggest deepening
 * 3. If no causal connector: suggest explicit causal language
 * 4. If complete: validate approach
 */
function revisionSuggestion(missing, partial, hasConnector, depthTarget) {
  // Recommend incorporating missing/partial concepts
  const targets = missing.slice(0, 3).concat(partial.slice(0, 2));
  if (targets.length) {
    return `Revisa incorporando explícitamente: ${targets.join(', ')}.`;
  }

  // For developing/strong responses, emphasize causal clarity
  if (!hasConnector && (depthTarget === 'strong' || depthTarget === 'developing')) {
    return 'Conecta causa y efecto con lenguaje causal explícito (porque, provoca, conduce a).';
  }

  // For foundational or complete responses, affirm approach
  return 'Conserva la estructura y mantén la explicación fundada.';
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. AUTHENTICATION
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // Initialize Supabase with service role (secure server-side context)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Validate JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // 2. INPUT VALIDATION
    const body = await req.json();
    const item_id = body.item_id;
    const answer = (body.response_text || '').toString();
    const sessionMode = typeof body.session_mode === 'string' ? body.session_mode.trim() : '';

    if (!item_id || typeof item_id !== 'string' || item_id.length > 160 || !sessionMode) {
      return json({ error: 'Invalid request' }, 400);
    }
    if (!answer.trim() || answer.length > 20000) return json({ error: 'Invalid response_text' }, 400);

    const access = await verifyLearningAccess(supabase, user.id, sessionMode);
    if (!access.allowed) return json({ error: 'Access denied', reason: access.reason }, 403);

    // 3. FETCH QUESTION DEFINITION
    const { data: item, error: itemError } = await supabase
      .from('or_bank')
      .select('expected_concepts, response_depth_target, feedback_profile')
      .eq('item_id', item_id)
      .single();

    if (itemError || !item) {
      return json({ error: 'Item not found' }, 404);
    }

    // 4. CONCEPT ANALYSIS
    const expected = Array.isArray(item.expected_concepts) ? item.expected_concepts : [];
    const depthTarget = (item.response_depth_target || '').toString();
    const feedbackProfile = (item.feedback_profile && typeof item.feedback_profile === 'object')
      ? item.feedback_profile
      : {};

    const present = [];   // concepts_detected
    const partial = [];   // also counts as detected for feedback purposes
    const missing = [];   // concepts_absent

    for (const concept of expected) {
      const state = conceptState(concept, answer);
      if (state === 'present') present.push(concept);
      else if (state === 'partial') partial.push(concept);
      else missing.push(concept);
    }

    // 5. CAUSAL REASONING DETECTION
    const hasConnector = meaningfulTokens(answer).some((t) => CONNECTORS.has(t));
    const missing_causal_reasoning = [];

    if (!hasConnector && answer.trim() && (depthTarget === 'strong' || depthTarget === 'developing')) {
      missing_causal_reasoning.push('Haz explícita la relación causa-efecto.');
    }

    // 6. DEPTH CLASSIFICATION (informational, not scoring)
    const covered = present.length + partial.length;
    const total = expected.length || 1;
    const ratio = covered / total;
    let depth = ratio >= 0.75 ? 'strong' : ratio >= 0.4 ? 'developing' : 'emerging';

    // A response cannot be "strong" (distinction-adjacent) on concept
    // coverage alone if it never makes the causal reasoning explicit — WSET
    // Level 3 distinction-level answers are judged on explaining *why*, not
    // just naming the right concepts. Cap the band one step down when
    // explicit causal language is absent, so "strong" actually means both
    // complete AND well-reasoned.
    if (depth === 'strong' && missing_causal_reasoning.length > 0) {
      depth = 'developing';
    }

    // 6b. DISTINCTION-LEVEL EXPLANATION
    // The actual "why is my response at this level" text, authored per
    // question in or_bank.feedback_profile (STRONG_RESPONSE /
    // DEVELOPING_RESPONSE / FOUNDATIONAL_RESPONSE). Falls back to null
    // (never a fabricated generic message) when this specific item hasn't
    // been authored yet, so the frontend can degrade gracefully instead of
    // showing something misleading or invented.
    const feedbackKey = DEPTH_TO_FEEDBACK_KEY[depth];
    const distinction_feedback = (feedbackKey && feedbackProfile[feedbackKey])
      ? feedbackProfile[feedbackKey]
      : null;

    // Claim the assigned item atomically before protected feedback is returned.
    // An identical network retry is allowed; changing the answer is not.
    const { data: progress, error: progressError } = await supabase.rpc('claim_or_question_assignment', {
      p_user_id: user.id,
      p_item_id: item_id,
      p_mode: sessionMode,
      p_response_hash: await sha256(answer),
    });
    if (progressError) throw progressError;
    if (!Array.isArray(progress) || progress.length !== 1) {
      return json({ error: 'Question is not available for evaluation' }, 409);
    }

    // 7. RESPONSE
    return json({
        // Primary feedback outputs
        concepts_detected: present.concat(partial),      // what student got right/partially right
        concepts_absent: missing,                         // what's missing
        missing_causal_reasoning,                         // reasoning gaps
        improvement_suggestions: [revisionSuggestion(missing, partial, hasConnector, depthTarget)],

        // Informational (depth classification, not official score)
        depth,                                            // 'emerging', 'developing', 'strong'

        // WHY the response landed at this depth, in WSET3-grounded language,
        // specific to this question. null when not yet authored for this item.
        distinction_feedback,
        progress: progress[0],

        // Governance watermark (user_id:24h = not persistent beyond 24h, not official)
        watermark: `${user.id}:24h`,
      });
  } catch (error) {
    console.error('evaluate-or error:', error instanceof Error ? error.message : 'unexpected failure');
    return json({
        error: 'Internal server error',
        // Fallback response maintains governance compliance
        concepts_detected: [],
        concepts_absent: [],
        missing_causal_reasoning: [],
        improvement_suggestions: ['Sin retroalimentación disponible para este elemento.'],
        distinction_feedback: null,
      }, 500);
  }
});
