const {
  deriveEpistemicProfileReadModel,
  normalizeEvents,
} = require('./epistemic-profile-metrics.js');

const SCHEMA_VERSION = 'EP-04-backend-v1';
const TIMELINE_ACTIONS = ['started', 'paused', 'resumed', 'abandoned', 'completed'];

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeTimelineEvents(events) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((event) => (
      isObject(event)
      && typeof event.event_id === 'string'
      && typeof event.session_id === 'string'
      && TIMELINE_ACTIONS.includes(event.action)
      && Number.isFinite(Date.parse(event.occurred_at))
    ))
    .map((event) => ({
      event_id: event.event_id,
      session_id: event.session_id,
      session_type: event.session_type || 'unknown',
      action: event.action,
      occurred_at: new Date(event.occurred_at).toISOString(),
      duration_seconds: Math.max(0, Number(event.duration_seconds) || 0),
      source_experience: event.source_experience || 'unknown',
      payload: isObject(event.payload) ? event.payload : {},
      evidence: isObject(event.evidence) ? event.evidence : {},
    }))
    .sort((a, b) => {
      const timeDiff = Date.parse(a.occurred_at) - Date.parse(b.occurred_at);
      if (timeDiff !== 0) return timeDiff;
      return a.event_id.localeCompare(b.event_id);
    });
}

function terminalStatus(action) {
  if (action === 'completed') return 'completed';
  if (action === 'abandoned') return 'abandoned';
  if (action === 'paused') return 'paused';
  if (action === 'resumed' || action === 'started') return 'active';
  return 'observed';
}

function sessionTypeFromEpistemicEvent(event) {
  return event.payload.session_type
    || event.payload.practice_type
    || event.payload.simulation_type
    || event.source_experience
    || event.event_type;
}

function sessionIdFromEpistemicEvent(event) {
  return event.payload.session_id
    || event.payload.attempt_id
    || `${event.event_type}:${event.event_id}`;
}

function deriveSessions(epistemicEvents, timelineEvents, limit) {
  const sessions = new Map();

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

function derivePracticeHistory(epistemicEvents, sessions) {
  const practiceEvents = epistemicEvents.filter((event) => event.event_type === 'practice_completed');
  return {
    items: practiceEvents.map((event) => ({
      practice_id: sessionIdFromEpistemicEvent(event),
      practice_type: event.payload.practice_type || event.source_experience || 'practice',
      occurred_at: event.occurred_at,
      completed: event.evidence.completed !== false,
      outcome: event.evidence.outcome || null,
      transfer_applied: event.evidence.transfer_applied === true,
    })),
    abandoned: sessions.filter((session) => session.session_type === 'practice' && session.status === 'abandoned').length,
  };
}

function deriveSimulationHistory(epistemicEvents) {
  return {
    items: epistemicEvents
      .filter((event) => event.event_type === 'simulation_completed')
      .map((event) => ({
        simulation_id: sessionIdFromEpistemicEvent(event),
        simulation_type: event.payload.simulation_type || 'simulation',
        occurred_at: event.occurred_at,
        completed: event.evidence.completed !== false,
        outcome: event.evidence.outcome || null,
        duration_seconds: Math.max(0, Number(event.evidence.duration_seconds) || 0),
      })),
  };
}

function deriveMentorSummary(epistemicEvents, epReadModel) {
  const misconceptionEvents = epistemicEvents.filter((event) => (
    event.event_type === 'misconception_detected' || event.event_type === 'misconception_resolved'
  ));
  const focusQueue = [];

  if (epReadModel.open_misconceptions.length || misconceptionEvents.length) {
    focusQueue.push({
      kind: 'misconception_closure',
      priority: 1,
      evidence_count: misconceptionEvents.length,
    });
  }
  if (epReadModel.summary.weakest_metric) {
    focusQueue.push({
      kind: 'weakest_metric',
      metric: epReadModel.summary.weakest_metric,
      priority: 2,
    });
  }

  return {
    focus_queue: focusQueue.sort((a, b) => a.priority - b.priority),
    evidence_groups: {
      misconceptions: misconceptionEvents.length,
      calibration: epReadModel.summary.metrics.calibration.evidence_count,
      readiness: epReadModel.summary.metrics.readiness.evidence_count,
    },
  };
}

function achievement(key, achievedAt, evidenceCount) {
  return { key, achieved_at: achievedAt, evidence_count: evidenceCount, source: 'derived_from_events' };
}

function deriveAchievements(epistemicEvents, sessions, epReadModel) {
  const unlocked = [];
  const practiceEvents = epistemicEvents.filter((event) => event.event_type === 'practice_completed');
  const simulationEvents = epistemicEvents.filter((event) => event.event_type === 'simulation_completed');
  const resolvedEvents = epistemicEvents.filter((event) => event.event_type === 'misconception_resolved');
  const completedSessions = sessions.filter((session) => session.status === 'completed');
  const readiness = epReadModel.summary.metrics.readiness.value;

  if (practiceEvents.length) unlocked.push(achievement('first_practice', practiceEvents[0].occurred_at, practiceEvents.length));
  if (simulationEvents.length) unlocked.push(achievement('first_simulation', simulationEvents[0].occurred_at, simulationEvents.length));
  if (completedSessions.length >= 5) unlocked.push(achievement('five_sessions', completedSessions[4].last_activity_at, completedSessions.length));
  if (completedSessions.length >= 10) unlocked.push(achievement('ten_sessions', completedSessions[9].last_activity_at, completedSessions.length));
  if (readiness !== null && readiness >= 0.7) unlocked.push(achievement('readiness_70', epReadModel.summary.last_activity_at, epReadModel.summary.metrics.readiness.evidence_count));
  if (readiness !== null && readiness >= 0.75) unlocked.push(achievement('readiness_75', epReadModel.summary.last_activity_at, epReadModel.summary.metrics.readiness.evidence_count));
  if (resolvedEvents.length) unlocked.push(achievement('misconception_closed', resolvedEvents[0].occurred_at, resolvedEvents.length));
  if (epReadModel.summary.metrics.calibration.value !== null && epReadModel.summary.metrics.calibration.value >= 0.75) {
    unlocked.push(achievement('calibration_improved', epReadModel.summary.last_activity_at, epReadModel.summary.metrics.calibration.evidence_count));
  }

  return {
    unlocked,
    pending: ['five_sessions', 'ten_sessions', 'readiness_70', 'readiness_75', 'calibration_improved']
      .filter((key) => !unlocked.some((item) => item.key === key))
      .map((key) => ({ key, source: 'derived_from_events' })),
  };
}

function deriveNotifications(sessions, epReadModel) {
  const pending = [];
  if (sessions.some((session) => session.status === 'abandoned')) {
    pending.push({
      key: 'session_abandoned',
      priority: 1,
      reason: 'A session was abandoned before completion.',
      source: 'ep04_learning_session_events',
    });
  }
  if (epReadModel.open_misconceptions.length) {
    pending.push({
      key: 'recommendation_pending',
      priority: 2,
      reason: 'Open misconception evidence needs a resolving activity.',
      source: 'epistemic_events',
    });
  }
  if (epReadModel.summary.metrics.readiness.value !== null && epReadModel.summary.metrics.readiness.value >= 0.7) {
    pending.push({
      key: 'readiness_reached',
      priority: 3,
      reason: 'Readiness crossed a configured threshold.',
      source: 'epistemic_events',
    });
  }
  if (epReadModel.summary.event_count > 0) {
    pending.push({
      key: 'new_experience_available',
      priority: 4,
      reason: 'Evidence is available for the next deterministic recommendation.',
      source: 'epistemic_events',
    });
  }
  return { pending: pending.sort((a, b) => a.priority - b.priority) };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function deriveAnalytics(sessions, epistemicEvents) {
  const terminalSessions = sessions.filter((session) => (
    ['completed', 'abandoned'].includes(session.status) && session.duration_seconds > 0
    && session.timeline.length > 0
  ));
  const average = terminalSessions.length
    ? terminalSessions.reduce((sum, session) => sum + session.duration_seconds, 0) / terminalSessions.length
    : null;
  const abandoned = terminalSessions.filter((session) => session.status === 'abandoned').length;

  return {
    average_session_duration_seconds: average === null ? null : round(average),
    abandonment_rate: terminalSessions.length ? round(abandoned / terminalSessions.length) : null,
    funnel_counts: {
      epistemic_events: epistemicEvents.length,
      sessions_started: sessions.filter((session) => session.timeline.some((event) => event.action === 'started')).length,
      sessions_completed: terminalSessions.length - abandoned,
      sessions_abandoned: abandoned,
    },
  };
}

function deriveLearningLoop(epReadModel, sessions) {
  const abandoned = sessions.find((session) => session.status === 'abandoned');
  if (abandoned) {
    return {
      next_step: {
        kind: 'adaptive_review',
        reason: 'Recover an abandoned session before adding new load.',
        session_id: abandoned.session_id,
      },
    };
  }
  if (epReadModel.open_misconceptions.length) {
    return {
      next_step: {
        kind: 'mentor',
        reason: 'Resolve the highest priority misconception.',
        misconception_id: epReadModel.open_misconceptions[0].misconception_id,
      },
    };
  }
  return {
    next_step: {
      kind: 'practice',
      reason: 'Continue with the deterministic recommendation queue.',
    },
  };
}

function deriveEP04BackendView(profile, epistemicEvents, timelineEvents, options = {}) {
  const normalizedEpistemic = normalizeEvents(epistemicEvents || []);
  const normalizedTimeline = normalizeTimelineEvents(timelineEvents || []);
  const epReadModel = deriveEpistemicProfileReadModel(profile, normalizedEpistemic, {
    now: options.now,
    recentSessionLimit: options.sessionLimit || 10,
  });
  const sessions = deriveSessions(normalizedEpistemic, normalizedTimeline, options.sessionLimit || 25);
  const practiceHistory = derivePracticeHistory(normalizedEpistemic, sessions);
  const simulationHistory = deriveSimulationHistory(normalizedEpistemic);
  const mentorSummary = deriveMentorSummary(normalizedEpistemic, epReadModel);
  const achievements = deriveAchievements(normalizedEpistemic, sessions, epReadModel);
  const notifications = deriveNotifications(sessions, epReadModel);
  const analytics = deriveAnalytics(sessions, normalizedEpistemic);
  const learningLoop = deriveLearningLoop(epReadModel, sessions);

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
    achievements,
    notifications,
  };

  return {
    schema_version: SCHEMA_VERSION,
    generated_from: ['epistemic_events', 'ep04_learning_session_events'],
    profile: epReadModel.profile,
    learning_history: learningHistory,
    practice_history: practiceHistory,
    simulation_history: simulationHistory,
    dashboard,
    mentor_summary: mentorSummary,
    achievements,
    notifications,
    analytics,
    session_detail: (sessionId) => sessions.find((session) => session.session_id === sessionId) || null,
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

module.exports = {
  SCHEMA_VERSION,
  TIMELINE_ACTIONS,
  deriveEP04BackendView,
  normalizeTimelineEvents,
};
