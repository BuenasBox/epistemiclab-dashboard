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
  source_experience?: string;
  source_mode?: string;
  occurred_at: string;
  payload: Record<string, unknown>;
  evidence: Record<string, unknown>;
};

type MetricValue = {
  value: number | null;
  evidence_count: number;
  status: string;
  source_event_types: string[];
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

function newestTimestamp(events: EpistemicEvent[]): string | null {
  if (!events.length) return null;
  return events[events.length - 1].occurred_at;
}

function lowestDerivedMetric(metrics: Record<string, MetricValue>): string | null {
  return Object.entries(metrics)
    .filter(([, metricValue]) => metricValue.status === 'derived' && metricValue.value !== null)
    .sort((a, b) => {
      const valueDiff = Number(a[1].value) - Number(b[1].value);
      if (valueDiff !== 0) return valueDiff;
      return a[0].localeCompare(b[0]);
    })[0]?.[0] || null;
}

function highestDerivedMetric(metrics: Record<string, MetricValue>): string | null {
  return Object.entries(metrics)
    .filter(([, metricValue]) => metricValue.status === 'derived' && metricValue.value !== null)
    .sort((a, b) => {
      const valueDiff = Number(b[1].value) - Number(a[1].value);
      if (valueDiff !== 0) return valueDiff;
      return a[0].localeCompare(b[0]);
    })[0]?.[0] || null;
}

function deriveSummary(profile: Record<string, unknown> | null, events: EpistemicEvent[], derived: ReturnType<typeof deriveEpistemicMetrics>) {
  return {
    profile_version: String(profile?.profile_version || SCHEMA_VERSION),
    status: String(profile?.status || 'active'),
    event_count: events.length,
    evidence_count: events.length,
    last_activity_at: newestTimestamp(events),
    weakest_metric: lowestDerivedMetric(derived.metrics),
    strongest_metric: highestDerivedMetric(derived.metrics),
    metrics: derived.metrics,
  };
}

function sessionIdFor(event: EpistemicEvent): string {
  return String(
    event.payload.session_id
      || event.payload.attempt_id
      || `${event.event_type}:${event.event_id}`,
  );
}

function sessionTypeFor(event: EpistemicEvent): string {
  return String(
    event.payload.session_type
      || event.payload.practice_type
      || event.payload.simulation_type
      || event.source_experience
      || event.event_type,
  );
}

function sessionStatusFor(event: EpistemicEvent): string {
  if (event.event_type === 'time_expired') return 'time_expired';
  if (event.evidence.completed === false) return 'incomplete';
  if (event.evidence.completed === true) return 'completed';
  return 'observed';
}

function deriveRecentSessions(events: EpistemicEvent[], limit = 5) {
  const sessionEvents = events.filter((event) => (
    ['session_completed', 'simulation_completed', 'practice_completed', 'time_expired'].includes(event.event_type)
  ));
  const sessions = new Map<string, {
    session_id: string;
    session_type: string;
    status: string;
    started_at: string;
    completed_at: string;
    event_count: number;
    source_event_types: string[];
  }>();

  sessionEvents.forEach((event) => {
    const session_id = sessionIdFor(event);
    const existing = sessions.get(session_id);
    const next = {
      session_id,
      session_type: sessionTypeFor(event),
      status: sessionStatusFor(event),
      started_at: existing?.started_at || event.occurred_at,
      completed_at: event.occurred_at,
      event_count: (existing?.event_count || 0) + 1,
      source_event_types: [...new Set([...(existing?.source_event_types || []), event.event_type])],
    };
    sessions.set(session_id, next);
  });

  return [...sessions.values()]
    .sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at) || a.session_id.localeCompare(b.session_id))
    .slice(0, Math.max(0, limit));
}

function sortedTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return [...new Set(tags.filter((tag) => typeof tag === 'string' && tag.trim() !== '').map((tag) => tag.trim()))].sort();
}

function deriveOpenMisconceptions(events: EpistemicEvent[]) {
  const states = new Map<string, {
    misconception_id: string;
    label: string;
    detected_at: string | null;
    last_seen_at: string | null;
    evidence_count: number;
    domain_tags: string[];
    open: boolean;
  }>();

  events
    .filter((event) => ['misconception_detected', 'misconception_resolved'].includes(event.event_type))
    .forEach((event) => {
      const misconceptionId = event.payload.misconception_id;
      if (typeof misconceptionId !== 'string' || misconceptionId.trim() === '') return;

      const current = states.get(misconceptionId) || {
        misconception_id: misconceptionId,
        label: misconceptionId,
        detected_at: null,
        last_seen_at: null,
        evidence_count: 0,
        domain_tags: [],
        open: false,
      };

      if (event.event_type === 'misconception_detected') {
        current.label = typeof event.payload.label === 'string' ? event.payload.label : current.label;
        current.detected_at ||= event.occurred_at;
        current.last_seen_at = event.occurred_at;
        current.evidence_count += 1;
        current.domain_tags = sortedTags([...current.domain_tags, ...sortedTags(event.payload.domain_tags)]);
        current.open = true;
      } else {
        current.open = false;
      }

      states.set(misconceptionId, current);
    });

  return [...states.values()]
    .filter((state) => state.open)
    .map(({ open: _open, ...state }) => state)
    .sort((a, b) => Date.parse(String(b.last_seen_at)) - Date.parse(String(a.last_seen_at)) || a.misconception_id.localeCompare(b.misconception_id));
}

function recommendation(id: string, priority: number, reason: string, action: string) {
  return {
    recommendation_id: id,
    priority,
    reason,
    action,
    deterministic: true,
    source: 'epistemic_events',
  };
}

function deriveRecommendations(summary: ReturnType<typeof deriveSummary>, openMisconceptions: unknown[]) {
  const metrics = summary.metrics;
  const recommendations = [];

  if (metrics.calibration.value !== null && metrics.calibration.value < 0.7) {
    recommendations.push(recommendation(
      'stabilize_calibration',
      1,
      'Calibration evidence is weaker than target.',
      'Ask for confidence before reveal and compare it with observed outcomes.',
    ));
  }
  if (openMisconceptions.length > 0) {
    recommendations.push(recommendation(
      'close_open_misconceptions',
      2,
      'Open misconceptions still have no later resolving evidence.',
      'Select practice that directly contradicts the oldest open misconception.',
    ));
  }
  if (metrics.adherence.value !== null && metrics.adherence.value < 0.8) {
    recommendations.push(recommendation(
      'restore_adherence',
      3,
      'Completion evidence is lower than planned practice evidence.',
      'Use shorter sessions until completion evidence recovers.',
    ));
  }
  if (metrics.readiness.status === 'insufficient_evidence') {
    recommendations.push(recommendation(
      'collect_readiness_evidence',
      4,
      'No integrated readiness evidence is available yet.',
      'Complete one session or simulation before making readiness decisions.',
    ));
  }

  return recommendations.sort((a, b) => a.priority - b.priority || a.recommendation_id.localeCompare(b.recommendation_id));
}

function componentEvidenceFromEvent(event: EpistemicEvent) {
  const componentOutcomes = event.evidence.component_outcomes;
  if (isPlainObject(componentOutcomes)) {
    return Object.entries(componentOutcomes).map(([component, evidence]) => ({
      component,
      value: toCorrectness(isPlainObject(evidence) ? evidence : {}),
      event_type: event.event_type,
    }));
  }

  const component = event.payload.component || event.payload.readiness_component;
  if (typeof component === 'string' && component.trim() !== '') {
    return [{
      component: component.trim(),
      value: toCorrectness(event.evidence),
      event_type: event.event_type,
    }];
  }

  return [];
}

function deriveReadinessBreakdown(events: EpistemicEvent[], derived: ReturnType<typeof deriveEpistemicMetrics>) {
  const componentValues = new Map<string, {
    component: string;
    values: number[];
    source_event_types: string[];
    priority: number;
  }>();

  events
    .filter((event) => ['simulation_completed', 'session_completed'].includes(event.event_type))
    .flatMap(componentEvidenceFromEvent)
    .forEach((entry) => {
      if (entry.value === null) return;
      const current = componentValues.get(entry.component) || {
        component: entry.component,
        values: [],
        source_event_types: [],
        priority: entry.event_type === 'simulation_completed' ? 0 : 1,
      };
      current.values.push(entry.value);
      current.source_event_types = [...new Set([...current.source_event_types, entry.event_type])];
      current.priority = Math.min(current.priority, entry.event_type === 'simulation_completed' ? 0 : 1);
      componentValues.set(entry.component, current);
    });

  const components = [{
    component: 'overall',
    value: derived.metrics.readiness.value,
    evidence_count: derived.metrics.readiness.evidence_count,
    status: derived.metrics.readiness.status,
    source_event_types: derived.metrics.readiness.source_event_types,
  }];

  [...componentValues.values()]
    .sort((a, b) => a.priority - b.priority || a.component.localeCompare(b.component))
    .forEach((entry) => {
      components.push({
        component: entry.component,
        value: round(average(entry.values) ?? 0),
        evidence_count: entry.values.length,
        status: 'derived',
        source_event_types: entry.source_event_types,
      });
    });

  return {
    generated_from: 'epistemic_events',
    components,
  };
}

function defaultProfile(profile: Record<string, unknown> | null) {
  return {
    user_id: profile?.user_id || null,
    profile_version: profile?.profile_version || SCHEMA_VERSION,
    status: profile?.status || 'active',
    evidence_cursor: profile?.evidence_cursor || {},
    created_at: profile?.created_at || null,
    updated_at: profile?.updated_at || null,
  };
}

export function deriveEpistemicProfileReadModel(
  profile: Record<string, unknown> | null,
  events: EpistemicEvent[],
  options: { now?: string; recentSessionLimit?: number } = {},
) {
  const normalized = normalizeEvents(events);
  const derived = deriveEpistemicMetrics(normalized);
  const summary = deriveSummary(profile, normalized, derived);
  const recentSessions = deriveRecentSessions(normalized, options.recentSessionLimit ?? 5);
  const openMisconceptions = deriveOpenMisconceptions(normalized);
  const recommendations = deriveRecommendations(summary, openMisconceptions);
  const readinessBreakdown = deriveReadinessBreakdown(normalized, derived);

  return {
    schema_version: SCHEMA_VERSION,
    generated_from: 'epistemic_events',
    profile: defaultProfile(profile),
    summary,
    recent_sessions: recentSessions,
    open_misconceptions: openMisconceptions,
    recommendations,
    readiness_breakdown: readinessBreakdown,
    endpoints: {
      summary,
      recent_sessions: recentSessions,
      open_misconceptions: openMisconceptions,
      recommendations,
      readiness_breakdown: readinessBreakdown,
    },
    governance: {
      events_are_source_of_truth: true,
      derived_metrics_persisted: false,
      safe_for_examiner: false,
      official_scoring: false,
    },
    watermark: {
      user_id: profile?.user_id || null,
      issued_at: options.now || new Date().toISOString(),
    },
  };
}
