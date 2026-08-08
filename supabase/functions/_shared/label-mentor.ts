type MentorSpec = {
  mentor_feedback?: Array<{ category?: string; error_type?: string | null; text?: string }>;
  misconception_feedback?: Record<string, Record<string, string>>;
};

function hash(value: string) {
  let result = 5381;
  for (const char of String(value)) result = ((result << 5) + result + char.charCodeAt(0)) >>> 0;
  return result;
}

// Mirrors the fix in _shared/bottle-mentor.ts (Priority 4, Product Implementation Marathon):
// prefer an exact category+error_type match before falling back to the category's untagged
// (error_type: null/absent) general pool. Today every Label mentor_feedback entry is
// hand-authored per item with error_type left null, so this is a safe no-op for existing
// content (generalPool ends up equal to the full categoryPool, exactly like before) --
// forward-compatible if Label content ever adopts the same error_type-tagged generic messages
// Bottle already uses, without needing another runtime change then.
export function selectLabelMentor(
  spec: MentorSpec,
  context: { category?: string; error_type?: string | null; misconception_code?: string | null },
  seed: string,
) {
  if (context.category === 'misconception' && context.misconception_code) {
    const message = spec.misconception_feedback?.[context.misconception_code];
    if (message) return { category: 'misconception', text: message.integrative || message.introductory || message.critical || null };
  }
  const categoryPool = (spec.mentor_feedback || []).filter((message) => message.category === context.category);
  if (!categoryPool.length) return null;

  const exactPool = context.error_type ? categoryPool.filter((message) => message.error_type === context.error_type) : [];
  const generalPool = categoryPool.filter((message) => message.error_type == null);
  const pool = exactPool.length > 0 ? exactPool : (generalPool.length > 0 ? generalPool : categoryPool);

  const selected = pool[hash(`${seed}:${context.category}:${context.error_type || ''}`) % pool.length];
  return { category: selected.category, text: selected.text || null };
}
