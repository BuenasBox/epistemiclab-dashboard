import { deriveEpistemicProfileReadModel, normalizeEvents } from './epistemic-profile-metrics.ts';

export const EP04_SCHEMA_VERSION = 'EP-04-backend-v1';
export const TIMELINE_ACTIONS = ['started', 'paused', 'resumed', 'abandoned', 'completed'];

type AnyRecord = Record<string, any>;

function isObject(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function validateTimelineEvent(event: unknown): string[] {
  const errors: string[] = [];
  if (!isObject(event)) return ['event must be an object'];
  if (typeof event.event_id !== 'string' || event.event_id.trim() === '') errors.push('event_id is required');
  if (typeof event.session_id !== 'string' || event.session_id.trim() === '') errors.push('session_id is required');
  if (!TIMELINE_ACTIONS.includes(String(event.action))) errors.push('unsupported action');
  if (!Number.isFinite(Date.parse(String(event.occurred_at)))) errors.push('occurred_at must be an ISO timestamp');
  if (!isObject(event.payload)) errors.push('payload must be an object');
  if (!isObject(event.evidence)) errors.push('evidence must be an object');
  if (!isObject(event.metadata)) errors.push('metadata must be an object');
  return errors;
}

export function normalizeTimelineEvents(events: AnyRecord[]) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((event) => validateTimelineEvent({
      ...event,
      payload: event.payload || {},
      evidence: event.evidence || {},
      metadata: event.metadata || {},
    }).length === 0)
    .map((event) => ({
      event_id: event.event_id,
      session_id: event.session_id,
      session_type: event.session_type || 'unknown',
      action: event.action,
      occurred_at: new Date(event.occurred_at).toISOString(),
      duration_seconds: Math.max(0, Number(event.duration_seconds) || 0),
      source_experience: event.source_experience || 'unknown',
      payload: event.payload || {},
      evidence: event.evidence || {},
    }))
    .sort((a, b) => {
      const timeDiff = Date.parse(a.occurred_at) - Date.parse(b.occurred_at);
      if (timeDiff !== 0) return timeDiff;
      return a.event_id.localeCompare(b.event_id);
    });
}

function terminalStatus(action: string) {
  if (action === 'completed') return 'completed';
  if (action === 'abandoned') return 'abandoned';
  if (action === 'paused') return 'paused';
  if (action === 'resumed' || action === 'started') return 'active';
  return 'observed';
}

function sessionTypeFromEpistemicEvent(event: AnyRecord) {
  return event.payload.session_type
    || event.payload.practice_type
    || event.payload.simulation_type
    || event.source_experience
    || event.event_type;
}

function sessionIdFromEpistemicEvent(event: AnyRecord) {
  return event.payload.session_id
    || event.payload.attempt_id
    || `${event.event_type}:${event.event_id}`;
}

function deriveSessions(epistemicEvents: AnyRecord[], timelineEvents: AnyRecord[], limit: number) {
  const sessions = new Map<string, AnyRecord>();

  timelineEvents.forEach((event) => {
    const existing = sessions.get(event.session_id) || {
      session_id: event.session_id,
      session_type: event.session_type,
      status: 'observed',
      started_at: event.occurred_at,
      last_activity_at: event.occurred_at,
      duration_seconds: 0,
      event_count: 0,
      source_event_types: [],
      timeline: [],
    };
    existing.session_type = event.session_type || existing.session_type;
    existing.status = terminalStatus(event.action);
    existing.started_at = existing.started_at < event.occurred_at ? existing.started_at : event.occurred_at;
    existing.last_activity_at = event.occurred_at;
    existing.duration_seconds = event.duration_seconds > 0 ? event.duration_seconds : existing.duration_seconds;
    existing.event_count += 1;
    existing.source_event_types = [...new Set([...existing.source_event_types, `timeline:${event.action}`])];
    existing.timeline.push(event);
    sessions.set(event.session_id, existing);
  });

  epistemicEvents
    .filter((event) => ['session_completed', 'practice_completed', 'simulation_completed', 'time_expired'].includes(event.event_type))
    .forEach((event) => {
      const sessionId = sessionIdFromEpistemicEvent(event);
      const existing = sessions.get(sessionId) || {
        session_id: sessionId,
        session_type: sessionTypeFromEpistemicEvent(event),
        status: event.event_type === 'time_expired' ? 'abandoned' : 'completed',
        started_at: event.occurred_at,
        last_activity_at: event.occurred_at,
        duration_seconds: 0,
        event_count: 0,
        source_event_types: [],
        timeline: [],
      };
      existing.last_activity_at = event.occurred_at > existing.last_activity_at ? event.occurred_at : existing.last_activity_at;
      existing.duration_seconds = existing.duration_seconds || Math.max(0, Number(event.evidence.duration_seconds) || 0);
      existing.event_count += 1;
      existing.source_event_types = [...new Set([...existing.source_event_types, event.event_type])];
      sessions.set(sessionId, existing);
    });

  return [...sessions.values()]
    .sort((a, b) => Date.parse(b.last_activity_at) - Date.parse(a.last_activity_at) || a.session_id.localeCompare(b.session_id))
    .slice(0, limit);
}

function achievement(key: string, achievedAt: string | null, evidenceCount: number) {
  return { key, achieved_at: achievedAt, evidence_count: evidenceCount, source: 'derived_from_events' };
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function deriveEP04BackendView(profile: AnyRecord | null, epistemicEvents: AnyRecord[], timelineEvents: AnyRecord[], options: AnyRecord = {}) {
  const normalizedEpistemic = normalizeEvents(epistemicEvents || []);
  const normalizedTimeline = normalizeTimelineEvents(timelineEvents || []);
  const epReadModel = deriveEpistemicProfileReadModel(profile, normalizedEpistemic, {
    now: options.now,
    recentSessionLimit: options.sessionLimit || 10,
  });
  const sessions = deriveSessions(normalizedEpistemic, normalizedTimeline, options.sessionLimit || 25);
  const practiceEvents = normalizedEpistemic.filter((event: AnyRecord) => event.event_type === 'practice_completed');
  const simulationEvents = normalizedEpistemic.filter((event: AnyRecord) => event.event_type === 'simulation_completed');
  const misconceptionEvents = normalizedEpistemic.filter((event: AnyRecord) => ['misconception_detected', 'misconception_resolved'].includes(event.event_type));
  const resolvedEvents = normalizedEpistemic.filter((event: AnyRecord) => event.event_type === 'misconception_resolved');
  const terminalTimelineSessions = sessions.filter((session) => ['completed', 'abandoned'].includes(session.status) && session.duration_seconds > 0 && session.timeline.length > 0);
  const abandoned = terminalTimelineSessions.filter((session) => session.status === 'abandoned').length;
  const readiness = epReadModel.summary.metrics.readiness.value;

  const practiceHistory = {
    items: practiceEvents.map((event: AnyRecord) => ({
      practice_id: sessionIdFromEpistemicEvent(event),
      practice_type: event.payload.practice_type || event.source_experience || 'practice',
      occurred_at: event.occurred_at,
      completed: event.evidence.completed !== false,
      outcome: event.evidence.outcome || null,
      transfer_applied: event.evidence.transfer_applied === true,
    })),
    abandoned: sessions.filter((session) => session.session_type === 'practice' && session.status === 'abandoned').length,
  };
  const simulationHistory = {
    items: simulationEvents.map((event: AnyRecord) => ({
      simulation_id: sessionIdFromEpistemicEvent(event),
      simulation_type: event.payload.simulation_type || 'simulation',
      occurred_at: event.occurred_at,
      completed: event.evidence.completed !== false,
      outcome: event.evidence.outcome || null,
      duration_seconds: Math.max(0, Number(event.evidence.duration_seconds) || 0),
    })),
  };
  const mentorSummary = {
    focus_queue: [
      ...(epReadModel.open_misconceptions.length || misconceptionEvents.length ? [{ kind: 'misconception_closure', priority: 1, evidence_count: misconceptionEvents.length }] : []),
      ...(epReadModel.summary.weakest_metric ? [{ kind: 'weakest_metric', metric: epReadModel.summary.weakest_metric, priority: 2 }] : []),
    ],
    evidence_groups: {
      misconceptions: misconceptionEvents.length,
      calibration: epReadModel.summary.metrics.calibration.evidence_count,
      readiness: epReadModel.summary.metrics.readiness.evidence_count,
    },
  };
  const unlocked = [
    ...(practiceEvents.length ? [achievement('first_practice', practiceEvents[0].occurred_at, practiceEvents.length)] : []),
    ...(simulationEvents.length ? [achievement('first_simulation', simulationEvents[0].occurred_at, simulationEvents.length)] : []),
    ...(readiness !== null && readiness >= 0.7 ? [achievement('readiness_70', epReadModel.summary.last_activity_at, epReadModel.summary.metrics.readiness.evidence_count)] : []),
    ...(readiness !== null && readiness >= 0.75 ? [achievement('readiness_75', epReadModel.summary.last_activity_at, epReadModel.summary.metrics.readiness.evidence_count)] : []),
    ...(resolvedEvents.length ? [achievement('misconception_closed', resolvedEvents[0].occurred_at, resolvedEvents.length)] : []),
  ];
  const notifications = {
    pending: [
      ...(sessions.some((session) => session.status === 'abandoned') ? [{ key: 'session_abandoned', priority: 1, reason: 'A session was abandoned before completion.', source: 'ep04_learning_session_events' }] : []),
      ...(epReadModel.open_misconceptions.length ? [{ key: 'recommendation_pending', priority: 2, reason: 'Open misconception evidence needs a resolving activity.', source: 'epistemic_events' }] : []),
      ...(readiness !== null && readiness >= 0.7 ? [{ key: 'readiness_reached', priority: 3, reason: 'Readiness crossed a configured threshold.', source: 'epistemic_events' }] : []),
      ...(epReadModel.summary.event_count > 0 ? [{ key: 'new_experience_available', priority: 4, reason: 'Evidence is available for the next deterministic recommendation.', source: 'epistemic_events' }] : []),
    ],
  };
  const average = terminalTimelineSessions.length
    ? terminalTimelineSessions.reduce((sum, session) => sum + session.duration_seconds, 0) / terminalTimelineSessions.length
    : null;
  const analytics = {
    average_session_duration_seconds: average === null ? null : round(average),
    abandonment_rate: terminalTimelineSessions.length ? round(abandoned / terminalTimelineSessions.length) : null,
    funnel_counts: {
      epistemic_events: normalizedEpistemic.length,
      sessions_started: sessions.filter((session) => session.timeline.some((event: AnyRecord) => event.action === 'started')).length,
      sessions_completed: terminalTimelineSessions.length - abandoned,
      sessions_abandoned: abandoned,
    },
  };
  const learningLoop = {
    next_step: sessions.some((session) => session.status === 'abandoned')
      ? { kind: 'adaptive_review', reason: 'Recover an abandoned session before adding new load.' }
      : epReadModel.open_misconceptions.length
        ? { kind: 'mentor', reason: 'Resolve the highest priority misconception.' }
        : { kind: 'practice', reason: 'Continue with the deterministic recommendation queue.' },
  };

  const learningHistory = {
    totals: {
      epistemic_event_count: normalizedEpistemic.length,
      timeline_event_count: normalizedTimeline.length,
      session_count: sessions.length,
    },
    sessions,
  };

  const dashboard = {
    summary: epReadModel.summary,
    readiness: epReadModel.readiness_breakdown,
    misconceptions: epReadModel.open_misconceptions,
    recommendations: epReadModel.recommendations,
    sessions: sessions.slice(0, 10),
    learning_loop: learningLoop,
    mentor_summary: mentorSummary,
    achievements: { unlocked, pending: [] },
    notifications,
  };

  return {
    schema_version: EP04_SCHEMA_VERSION,
    generated_from: ['epistemic_events', 'ep04_learning_session_events'],
    profile: epReadModel.profile,
    learning_history: learningHistory,
    practice_history: practiceHistory,
    simulation_history: simulationHistory,
    dashboard,
    mentor_summary: mentorSummary,
    achievements: { unlocked, pending: [] },
    notifications,
    analytics,
    session_detail: (sessionId: string) => sessions.find((session) => session.session_id === sessionId) || null,
    security: {
      ownership_scope: 'authenticated_user_only',
      cross_user_reads_allowed: false,
      cache_policy: 'private, no-store',
    },
    watermark: {
      user_id: profile?.user_id || null,
      issued_at: options.now || new Date().toISOString(),
    },
  };
}
