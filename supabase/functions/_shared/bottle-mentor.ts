type BottleMentorSpec = {
  mentor_feedback?: Array<{ category?: string; error_type?: string | null; text?: string }>;
  misconception_feedback?: Record<string, string>;
};

function hash(value: string) {
  let result = 5381;
  for (const char of String(value)) result = ((result << 5) + result + char.charCodeAt(0)) >>> 0;
  return result;
}

// Real bug found via Priority 4 (cannot_determine real verification, Product Implementation
// Marathon): this selector filtered ONLY by category, completely ignoring error_type -- so
// for ANY item with more than one message tagged under the same category (every Bottle item's
// shared generic pool has 3: overconfidence/underconfidence/uncertainty_ignored, all filed
// under category:'calibration'), the runtime picked essentially at random among them by hash,
// regardless of which specific calibration error actually occurred. A genuinely overconfident
// student could be shown the underconfidence message, or vice versa -- observed live for the
// correct_prudence case specifically (a correctly-prudent "cannot_determine" got told it was
// underconfident, actively undermining the exact skill this item rewards).
//
// content-bank/bottle-lab-pro/mentor/select-message.js already implements the fix (used by the
// content-bank's own validation/build tooling, but never wired into this runtime module): prefer
// an exact category+error_type match; fall back to the category's untagged (error_type: null)
// general messages; only fall back to the full category pool if neither exists. Ported here
// verbatim so the deployed runtime and the content-bank tooling select the same way.
export function selectBottleMentor(
  spec: BottleMentorSpec,
  context: { category?: string; error_type?: string | null; misconception_code?: string | null },
  seed: string,
) {
  if (context.category === 'misconception' && context.misconception_code) {
    const text = spec.misconception_feedback?.[context.misconception_code];
    if (text) return { category: 'misconception', text };
  }
  const categoryPool = (spec.mentor_feedback || []).filter((message) => message.category === context.category);
  if (!categoryPool.length) return null;

  const exactPool = context.error_type ? categoryPool.filter((message) => message.error_type === context.error_type) : [];
  const generalPool = categoryPool.filter((message) => message.error_type == null);
  const pool = exactPool.length > 0 ? exactPool : (generalPool.length > 0 ? generalPool : categoryPool);

  const selected = pool[hash(`${seed}:${context.category}:${context.error_type || ''}`) % pool.length];
  return { category: selected.category || null, text: selected.text || null };
}
