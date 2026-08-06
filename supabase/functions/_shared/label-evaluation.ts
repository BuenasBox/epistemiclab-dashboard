export type LabelEvaluation = {
  result: { band: string; correct: boolean };
  justification: { band: string };
  evidence: { band: string };
  confidence: { band: string };
  calibration: { band: string };
};

function band(value: unknown, expected: unknown): string {
  if (typeof expected === 'string' && value === expected) return 'coincide';
  if (Array.isArray(expected) && expected.includes(value)) return 'cerca';
  return 'revisar';
}

export function evaluateLabelResponse(
  spec: Record<string, unknown>,
  answer: Record<string, unknown>,
): LabelEvaluation {
  const resultBand = band(answer.response, spec.expected_response);
  const evidenceBand = band(answer.evidence, spec.expected_evidence);
  const justificationBand = band(answer.justification, spec.expected_justification);
  const confidence = typeof answer.confidence === 'string' ? answer.confidence : null;
  const confidenceBand = confidence ? 'declared' : 'missing';
  const calibrated = resultBand === 'coincide' && confidence === 'Seguro'
    ? 'aligned'
    : resultBand !== 'coincide' && confidence === 'Seguro' ? 'overconfident' : 'undetermined';
  return {
    result: { band: resultBand, correct: resultBand === 'coincide' },
    justification: { band: justificationBand },
    evidence: { band: evidenceBand },
    confidence: { band: confidenceBand },
    calibration: { band: calibrated },
  };
}
