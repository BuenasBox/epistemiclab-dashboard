export const SCHEMA_VERSION = 'EP-01';

export const EVENT_TYPES = [
  'decision_made',
  'confidence_selected',
  'simulation_completed',
  'misconception_detected',
  'misconception_resolved',
  'novel_item_presented',
  'practice_completed',
  'session_completed',
  'time_expired',
];

export const METRIC_KEYS = [
  'domain',
  'calibration',
  'transfer',
  'readiness',
  'adherence',
];

type EpistemicEvent = {
  event_id: string;
  event_type: string;
  occurred_at: string;
  payload: Record<string, unknown>;
  evidence: Record<string, unknown>;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

export function validateEpistemicEvent(event: unknown): string[] {
  const errors: string[] = [];

  if (!isPlainObject(event)) {
    return ['event must be an object'];
  }
  if (typeof event.event_id !== 'string' || event.event_id.trim() === '') {
    errors.push('event_id is required');
  }
  if (!EVENT_TYPES.includes(String(event.event_type))) {
    errors.push('unsupported event_type');
  }
  if (!isIsoTimestamp(event.occurred_at)) {
    errors.push('occurred_at must be an ISO timestamp');
  }
  if (!isPlainObject(event.payload)) {
    errors.push('payload must be an object');
  }
  if (!isPlainObject(event.evidence)) {
    errors.push('evidence must be an object');
  }

  return errors;
}

export function normalizeEvents(events: EpistemicEvent[]): EpistemicEvent[] {
  return [...events]
    .filter((event) => validateEpistemicEvent(event).length === 0)
    .sort((a, b) => {
      const timeDiff = Date.parse(a.occurred_at) - Date.parse(b.occurred_at);
      if (timeDiff !== 0) return timeDiff;
      return a.event_id.localeCompare(b.event_id);
    });
}

function toCorrectness(evidence: Record<string, unknown>): number | null {
  if (evidence.outcome === 'correct') return 1;
  if (evidence.outcome === 'incorrect') return 0;
  if (evidence.completed === true && evidence.outcome !== 'incorrect') return 1;
  if (evidence.completed === false) return 0;
  return null;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function metric(value: number, evidenceCount: number, sourceEventTypes: string[]) {
  return {
    value: evidenceCount > 0 ? round(value) : null,
    evidence_count: evidenceCount,
    status: evidenceCount > 0 ? 'derived' : 'insufficient_evidence',
    source_event_types: sourceEventTypes,
  };
}

function deriveDomain(events: EpistemicEvent[]) {
  const decisions = events
    .filter((event) => event.event_type === 'decision_made')
    .map((event) => toCorrectness(event.evidence))
    .filter((value): value is number => value !== null);

  return metric(average(decisions) ?? 0, decisions.length, ['decision_made']);
}

function deriveCalibration(events: EpistemicEvent[]) {
  const calibrationValues = events
    .filter((event) => event.event_type === 'confidence_selected')
    .map((event) => {
      const confidence = Number(event.payload.confidence);
      const correctness = toCorrectness(event.evidence);
      if (!Number.isFinite(confidence) || correctness === null) return null;
      const normalizedConfidence = Math.max(0, Math.min(100, confidence)) / 100;
      return 1 - Math.abs(normalizedConfidence - correctness);
    })
    .filter((value): value is number => value !== null);

  return metric(average(calibrationValues) ?? 0, calibrationValues.length, ['confidence_selected']);
}

function deriveTransfer(events: EpistemicEvent[]) {
  const novelCount = events.filter((event) => event.event_type === 'novel_item_presented').length;
  const transferEvidence = events.filter(
    (event) => event.event_type === 'practice_completed' && event.evidence.transfer_applied === true,
  ).length;
  const evidenceCount = novelCount + transferEvidence;
  const value = evidenceCount > 0 ? transferEvidence / evidenceCount : 0;

  return metric(value, evidenceCount, ['novel_item_presented', 'practice_completed']);
}

function deriveReadiness(events: EpistemicEvent[]) {
  const readinessValues = events
    .filter((event) => ['simulation_completed', 'session_completed'].includes(event.event_type))
    .map((event) => toCorrectness(event.evidence))
    .filter((value): value is number => value !== null);

  return metric(average(readinessValues) ?? 0, readinessValues.length, [
    'simulation_completed',
    'session_completed',
  ]);
}

function deriveAdherence(events: EpistemicEvent[]) {
  const completeCount = events.filter((event) =>
    ['practice_completed', 'session_completed'].includes(event.event_type)
    && event.evidence.completed !== false
  ).length;
  const expiredCount = events.filter((event) => event.event_type === 'time_expired').length;
  const evidenceCount = completeCount + expiredCount;
  const value = evidenceCount > 0 ? completeCount / evidenceCount : 0;

  return metric(value, evidenceCount, ['practice_completed', 'session_completed', 'time_expired']);
}

export function deriveEpistemicMetrics(events: EpistemicEvent[]) {
  const normalized = normalizeEvents(events);
  return {
    schema_version: SCHEMA_VERSION,
    event_count: normalized.length,
    generated_from: 'epistemic_events',
    metrics: {
      domain: deriveDomain(normalized),
      calibration: deriveCalibration(normalized),
      transfer: deriveTransfer(normalized),
      readiness: deriveReadiness(normalized),
      adherence: deriveAdherence(normalized),
    },
  };
}
