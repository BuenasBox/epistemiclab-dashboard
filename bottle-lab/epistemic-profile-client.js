/* ============================================================================
 * Epistemic Profile — CLIENT STUB
 *
 * ⚠ STUB. El cliente real se implementa en el ítem 3 del orden de implementación
 *   ("Epistemic Profile (frontend)"). Este stub define el INTERFAZ que los
 *   módulos usan para escribir en el perfil, y mantiene un buffer en memoria
 *   para que "Qué cambió en ti" pueda renderizarse durante el desarrollo.
 *
 * Cuando exista el cliente real, este archivo se reemplaza manteniendo la MISMA
 * superficie pública (window.EpistemicProfile). Los módulos no cambian.
 *
 * Referencia de contrato: design/EpistemicLab-Functional-Architecture.md §7.
 * Eventos: decision_made, hypothesis_submitted, misconception, session_completed.
 * El frontend emite SEÑALES; las métricas (M1–M4) las deriva el backend.
 * ==========================================================================*/
(function () {
  "use strict";

  var buffer = [];          // señales emitidas en la sesión actual
  var session = null;

  function now() { return new Date().toISOString(); }

  var EpistemicProfile = {
    isStub: true,

    startSession: function (meta) {
      session = { module: (meta && meta.module) || "unknown", startedAt: now(),
                  decisions: [], misconceptions: [], competencies: (meta && meta.competencies) || [] };
      buffer.push({ type: "session_started", at: now(), payload: meta || {} });
      return session;
    },

    /* decision_made → B (dominio), C (calibración), E (exposición), F (transferencia) */
    decisionMade: function (p) {
      // p: { competency, itemId, phaseId, response, correctnessBand, confidence(optional), novel(optional) }
      buffer.push({ type: "decision_made", at: now(), payload: p });
      if (session) session.decisions.push(p);
      return true;
    },

    /* hypothesis_submitted → B (Conclusiones), C */
    hypothesisSubmitted: function (p) {
      buffer.push({ type: "hypothesis_submitted", at: now(), payload: p });
      if (session) session.decisions.push(Object.assign({ phaseId: "hypothesis" }, p));
      return true;
    },

    /* misconception → D (ledger) */
    misconception: function (p) {
      // p: { id, status: "detected"|"reinforced"|"resolved", title }
      buffer.push({ type: "misconception", at: now(), payload: p });
      if (session) session.misconceptions.push(p);
      return true;
    },

    /* session_completed → B, G, H */
    sessionCompleted: function (p) {
      buffer.push({ type: "session_completed", at: now(), payload: p });
      if (session) session.completedAt = now();
      return true;
    },

    /* Sólo para "Qué cambió en ti". El cliente real devolverá deltas reales del
       perfil; el stub deriva una vista ILUSTRATIVA de la sesión en curso. */
    getSessionDelta: function () {
      if (!session) return null;
      var decided = session.decisions.filter(function (d) { return d.phaseId !== "hypothesis"; });
      var correct = decided.filter(function (d) { return d.correctnessBand === "coincide"; }).length;
      var total = decided.length || 1;
      var resolved = session.misconceptions.filter(function (m) { return m.status === "resolved" || m.status === "detected"; });
      var novelTouched = session.decisions.some(function (d) { return d.novel; });
      return {
        illustrative: true,
        competencies: session.competencies,
        accuracy: correct + "/" + total,
        misconceptions: resolved,
        transferTouched: novelTouched
      };
    },

    /* Utilidad de desarrollo: ver el flujo de señales en consola. */
    dump: function () { return buffer.slice(); }
  };

  window.EpistemicProfile = window.EpistemicProfile || EpistemicProfile;
})();
