// Y.1.1–Y.1.6: Remediation and learning loop engine
// Deterministic, no LLM, no APIs. Safe_for_examiner = False always.

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.RemediationEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  // Y.1.2: Build targeted practice session from remediation plan
  function buildPracticeSession(actionType, actionData) {
    // Returns: { mode, pool, reason, start_recommendation }
    if (!actionType || !actionData) return null;

    switch (actionType) {
      case 'practice_weak_ra':
        return {
          mode: 'sba_standard',
          filter: { ra: actionData.ra },
          reason: 'Refuerza ' + actionData.ra,
          session_type: 'targeted_ra_practice',
          preferEnriched: true
        };
      case 'practice_weak_topic':
        return {
          mode: 'sba_standard',
          filter: { topic: actionData.topic },
          reason: 'Tema a practicar: ' + actionData.topic,
          session_type: 'targeted_topic_practice',
          preferEnriched: true
        };
      case 'practice_weak_verb':
        return {
          mode: 'open_response_standard',
          filter: { verb: actionData.verb },
          reason: 'Mejora en verbos: ' + (actionData.verb || 'explain'),
          session_type: 'targeted_verb_practice',
          preferEnriched: false
        };
      case 'practice_sat_issue':
        return {
          mode: 'sat_sprint',
          filter: { issue: actionData.issue },
          reason: 'Calibración SAT: ' + actionData.issue,
          session_type: 'targeted_sat_practice',
          preferEnriched: false
        };
      case 'continue_practice':
        return {
          mode: 'sba_standard',
          filter: {},
          reason: 'Continúa tu entrenamiento',
          session_type: 'general_practice',
          preferEnriched: true
        };
      default:
        return null;
    }
  }

  // Y.1.3: Detect improvement in topic over time
  function detectImprovement(topic, window_ms) {
    // Returns: { topic, old_accuracy, new_accuracy, improved, trend }
    if (!root.LI || !root.LI.history) return null;
    var history = root.LI.history();
    if (!history || !Array.isArray(history)) return null;

    var now = new Date().getTime();
    var old_records = [];
    var new_records = [];

    history.forEach(function (s) {
      if (s.type !== 'sba') return;
      var attempts = s.attempts || [];
      var t_hist = attempts.filter(function (a) { return a.topic === topic; });
      if (!t_hist.length) return;

      var age = now - new Date(s.completed_at).getTime();
      if (age < window_ms) {
        new_records = new_records.concat(t_hist);
      } else {
        old_records = old_records.concat(t_hist);
      }
    });

    if (!old_records.length || !new_records.length) return null;

    var old_acc = old_records.filter(function (x) { return x.correct; }).length / old_records.length;
    var new_acc = new_records.filter(function (x) { return x.correct; }).length / new_records.length;
    var improved = new_acc >= old_acc;
    var delta = Math.round((new_acc - old_acc) * 100);

    return {
      topic: topic,
      old_accuracy: Math.round(old_acc * 100) + '%',
      new_accuracy: Math.round(new_acc * 100) + '%',
      improved: improved,
      delta: delta,
      trend: improved ? (delta > 10 ? 'strong_improvement' : 'slight_improvement') : 'declining'
    };
  }

  // Y.1.3: Render progress message for session-end
  function sessionEndMessage(sessionType) {
    if (!root.LI) return '';
    var ws = root.LI.weakSet();
    if (!ws) return '';

    var html = '<div style="background:#1a2332;border:1px solid #4a7c8c;border-radius:8px;padding:16px;margin:16px 0;color:#aab4bd">';
    html += '<div style="color:#65b7c7;font-weight:700;margin-bottom:12px">RESUMEN DE SESIÓN</div>';

    // Show what was trained
    if (sessionType && sessionType.indexOf('ra') !== -1) {
      html += '<div style="margin:8px 0;font-size:13px">✓ Entrenaste esta área de responsabilidad</div>';
    }
    if (sessionType && sessionType.indexOf('topic') !== -1) {
      html += '<div style="margin:8px 0;font-size:13px">✓ Practicaste un tema específico</div>';
    }

    // Show current weak areas
    if (ws.weakRAs && ws.weakRAs.length) {
      html += '<div style="margin:12px 0;color:#d5a84f;font-weight:600;font-size:12px">ÁREAS PARA MEJORAR</div>';
      ws.weakRAs.slice(0, 2).forEach(function (ra) {
        html += '<div style="margin:6px 0;font-size:12px">• ' + ra + '</div>';
      });
    }

    // CTA for next action
    html += '<div style="margin-top:12px;padding:12px;background:#202830;border-radius:6px;font-size:12px">' +
      'Ve a tu perfil para ver las recomendaciones de tu próximo paso.' +
      '</div>';

    html += '</div>';
    return html;
  }

  // Y.1.6: Learning loop connector (suggests next experience)
  function nextExperienceSuggestion() {
    if (!root.LI) return null;
    var a = root.LI.analytics();
    if (!a) return null;

    // If they've done a lot of SBA, suggest OR
    if (a.sbaSessions >= 5 && a.orSessions < a.sbaSessions / 2) {
      return {
        experience: 'open_response',
        reason: 'Ya practicaste suficiente SBA. Mejora tu articulación en respuestas abiertas.',
        label: 'Ir al Laboratorio de Respuesta Abierta'
      };
    }
    // If they've done OR, suggest SAT
    if (a.orSessions >= 2 && a.satSessions === 0) {
      return {
        experience: 'sat',
        reason: 'Tu siguiente desafío: SAT. Practica calibración de calidad.',
        label: 'Ir a SAT Sprint'
      };
    }
    // If they've done SAT, suggest full simulation
    if (a.satSessions >= 1 && a.sbaSessions >= 10) {
      return {
        experience: 'full_simulation',
        reason: 'Estás listo para el simulacro completo. Practica bajo presión de tiempo.',
        label: 'Ir a Full Simulation'
      };
    }
    // Default: more SBA
    return {
      experience: 'adaptive',
      reason: 'Continúa reforzando con Adaptive Session. Enfocarte en tus áreas débiles.',
      label: 'Ir a Adaptive Session'
    };
  }

  // Y.1.3: Render progress card
  function renderProgressSummary() {
    if (!root.LI) return '';
    var a = root.LI.analytics();
    var ws = root.LI.weakSet(a);

    var html = '<div style="background:#202830;border:1px solid #303944;border-radius:8px;padding:14px;margin:12px 0">';
    html += '<div style="color:#d5a84f;font-weight:700;margin-bottom:10px;font-size:12px">PROGRESO GENERAL</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';

    html += '<div style="background:#161b24;border-radius:6px;padding:10px;text-align:center">' +
      '<div style="font-size:24px;font-weight:700;color:#65b7c7">' + a.sbaSessions + '</div>' +
      '<div style="font-size:11px;color:#aab4bd">Sesiones SBA</div>' +
      '</div>';

    html += '<div style="background:#161b24;border-radius:6px;padding:10px;text-align:center">' +
      '<div style="font-size:24px;font-weight:700;color:#2ec27e">' + ws.strongTopics.length + '</div>' +
      '<div style="font-size:11px;color:#aab4bd">Temas dominados</div>' +
      '</div>';

    html += '<div style="background:#161b24;border-radius:6px;padding:10px;text-align:center">' +
      '<div style="font-size:24px;font-weight:700;color:#e0a93e">' + ws.weakRAs.length + '</div>' +
      '<div style="font-size:11px;color:#aab4bd">Áreas de mejora</div>' +
      '</div>';

    html += '<div style="background:#161b24;border-radius:6px;padding:10px;text-align:center">' +
      '<div style="font-size:24px;font-weight:700;color:#65b7c7">' + a.orSessions + '</div>' +
      '<div style="font-size:11px;color:#aab4bd">Respuestas abiertas</div>' +
      '</div>';

    html += '</div></div>';
    return html;
  }

  return {
    buildPracticeSession: buildPracticeSession,
    detectImprovement: detectImprovement,
    sessionEndMessage: sessionEndMessage,
    nextExperienceSuggestion: nextExperienceSuggestion,
    renderProgressSummary: renderProgressSummary,
  };
});
