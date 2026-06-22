function roleFor(user) {
  return user?.app_metadata?.role || user?.user_metadata?.role || 'authenticated';
}

function notificationSummary(notifications) {
  const pending = Array.isArray(notifications?.pending) ? notifications.pending : [];
  const priorities = pending
    .map((item) => Number(item.priority))
    .filter((priority) => Number.isFinite(priority));

  return {
    pending_count: pending.length,
    highest_priority: priorities.length ? Math.min(...priorities) : null,
    pending,
  };
}

function projectBootstrapSession(readModel, user) {
  const dashboard = readModel.dashboard || {};
  return {
    schema_version: 'EP-05-bootstrap-session-v1',
    generated_from: readModel.generated_from || [],
    user: {
      id: user?.id || readModel.watermark?.user_id || null,
      email: user?.email || null,
      role: roleFor(user),
    },
    dashboard_summary: dashboard.summary || null,
    readiness: dashboard.readiness || null,
    recommendations: dashboard.recommendations || [],
    learning_loop_decision: dashboard.learning_loop?.next_step || null,
    mentor_summary: dashboard.mentor_summary || null,
    achievements: dashboard.achievements || { unlocked: [], pending: [] },
    notification_summary: notificationSummary(dashboard.notifications),
    security: readModel.security || {
      ownership_scope: 'authenticated_user_only',
      cross_user_reads_allowed: false,
      cache_policy: 'private, no-store',
    },
    watermark: readModel.watermark || null,
  };
}

module.exports = {
  projectBootstrapSession,
};
