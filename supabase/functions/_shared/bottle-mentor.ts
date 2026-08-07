type BottleMentorSpec = {
  mentor_feedback?: Array<{ category?: string; text?: string }>;
  misconception_feedback?: Record<string, string>;
};

function hash(value: string) {
  let result = 5381;
  for (const char of String(value)) result = ((result << 5) + result + char.charCodeAt(0)) >>> 0;
  return result;
}

export function selectBottleMentor(spec: BottleMentorSpec, context: { category?: string; misconception_code?: string | null }, seed: string) {
  if (context.category === 'misconception' && context.misconception_code) {
    const text = spec.misconception_feedback?.[context.misconception_code];
    if (text) return { category: 'misconception', text };
  }
  const pool = (spec.mentor_feedback || []).filter((message) => message.category === context.category);
  if (!pool.length) return null;
  const selected = pool[hash(seed) % pool.length];
  return { category: selected.category || null, text: selected.text || null };
}
