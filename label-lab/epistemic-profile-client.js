/* ============================================================================
 * Epistemic Profile — CLIENT STUB (Label Guided)
 *
 * ⚠ STUB. El cliente real se implementa en el ítem 3 del orden ("Epistemic
 *   Profile (frontend)") y será compartido por todos los módulos. Este stub
 *   replica la MISMA superficie pública (window.EpistemicProfile) usada por
 *   Bottle Guided, añadiendo el manejo de CONFIANZA (calibración, M2).
 *
 * Cuando exista el cliente real, se reemplaza manteniendo la interfaz; los
 * módulos no cambian.
 *
 * Contrato: design/EpistemicLab-Functional-Architecture.md §7.
 * El frontend emite SEÑALES; las métricas (M1–M4) las deriva el backend.
 * ==========================================================================*/
(function () {
  "use strict";

  var CONF_RANK = { "Intuyo": 1, "Bastante seguro": 2, "Seguro": 3 };
  var buffer = [];
  var session = null;
  function now() { return new Date().toISOString(); }

  var EP = {
    isStub: true,

    startSession: function (meta) {
      session = { module: (meta && meta.module) || "unknown", startedAt: now(),
                  decisions: [], misconceptions: [], competencies: (meta && meta.competencies) || [] };
      buffer.push({ type: "session_started", at: now(), payload: meta || {} });
      return session;
    },

    /* decision_made → B, C (calibración via confidence), E, F */
    decisionMade: function (p) {
      // p: { competency, itemId, zoneId, response, correctnessBand, confidence, novel }
      buffer.push({ type: "decision_made", at: now(), payload: p });
      if (session) session.decisions.push(p);
      return true;
    },

    hypothesisSubmitted: function (p) {
      buffer.push({ type: "hypothesis_submitted", at: now(), payload: p });
      if (session) session.decisions.push(Object.assign({ zoneId: "hypothesis" }, p));
      return true;
    },

    misconception: function (p) {
      buffer.push({ type: "misconception", at: now(), payload: p });
      if (session) session.misconceptions.push(p);
      return true;
    },

    sessionCompleted: function (p) {
      buffer.push({ type: "session_completed", at: now(), payload: p });
      if (session) session.completedAt = now();
      return true;
    },

    /* Sólo para "Qué cambió en ti". El cliente real devolverá deltas reales;
       el stub deriva una vista ILUSTRATIVA, incluida una señal de calibración. */
    getSessionDelta: function () {
      if (!session) return null;
      var decided = session.decisions.filter(function (d) { return d.zoneId !== "hypothesis"; });
      var total = decided.length || 1;
      var correct = decided.filter(function (d) { return d.correctnessBand === "coincide"; }).length;

      // calibración (stub): ¿hubo fallos con confianza alta? → sobreconfianza
      var confidentMisses = decided.filter(function (d) {
        return d.correctnessBand !== "coincide" && (CONF_RANK[d.confidence] || 0) >= 2;
      }).length;
      var underConfidentHits = decided.filter(function (d) {
        return d.correctnessBand === "coincide" && (CONF_RANK[d.confidence] || 0) <= 1;
      }).length;
      var calibration = "calibrado";
      if (confidentMisses > 0) calibration = "sobreconfianza";
      else if (underConfidentHits >= 2) calibration = "infraconfianza";

      var resolved = session.misconceptions.filter(function (m) {
        return m.status === "resolved" || m.status === "detected";
      });

      return {
        illustrative: true,
        competencies: session.competencies,
        accuracy: correct + "/" + total,
        calibration: calibration,
        confidentMisses: confidentMisses,
        misconceptions: resolved,
        transferTouched: session.decisions.some(function (d) { return d.novel; })
      };
    },

    dump: function () { return buffer.slice(); }
  };

  window.EpistemicProfile = window.EpistemicProfile || EP;
})();
