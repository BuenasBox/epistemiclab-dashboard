/* ============================================================================
 * Epistemic Profile — SHARED FRONTEND CLIENT (EP-01 adapter)
 *
 * Ítem 3 del orden de implementación. Reemplaza los stubs locales de cada módulo
 * (bottle-lab, label-lab) por un único cliente compartido.
 *
 * RESPONSABILIDAD (frontend):
 *   - Exponer window.EpistemicProfile con la MISMA interfaz que usaban los stubs,
 *     para que los módulos no cambien su lógica (solo su <script src>).
 *   - Traducir las llamadas de los módulos a EVENTOS CANÓNICOS del contrato EP-01
 *     (contracts/epistemic-profile/epistemic_profile_contract.json, de Codex).
 *   - Enviar cada evento a POST /functions/v1/record-epistemic-event cuando haya
 *     transporte configurado; si no, BUFFER local (degradación elegante).
 *
 * NO HACE (es de backend / Codex):
 *   - No deriva métricas (domain/calibration/transfer/readiness/adherence): eso lo
 *     calcula el backend al leer eventos vía get-epistemic-profile. No duplicamos
 *     la fuente de verdad ni shared/epistemic-profile-metrics.js.
 *   - No persiste nada localmente como verdad: el buffer es transitorio.
 *
 * Eventos EP-01 emitidos: decision_made, confidence_selected, novel_item_presented,
 *   misconception_detected, misconception_resolved, practice_completed,
 *   session_completed. (simulation_completed/time_expired los usará Full Simulation.)
 *
 * getSessionDelta() devuelve un RESUMEN ILUSTRATIVO local para la pantalla
 *   "Qué cambió en ti" mientras get-epistemic-profile no esté desplegado; se
 *   sustituirá por las métricas reales del backend cuando exista el endpoint.
 * ==========================================================================*/
(function () {
  "use strict";

  var SCHEMA_VERSION = "EP-01";
  var CONF_TO_100 = { "Intuyo": 33, "Bastante seguro": 67, "Seguro": 95 };

  // Transporte opcional. La app (Dashboard/host) puede configurarlo con
  // EpistemicProfile.configure({ endpoint, getToken }). Sin esto → buffer local.
  var transport = { endpoint: null, getToken: null, flushing: false, retryTimer: null };

  var buffer = [];     // eventos canónicos de la sesión (transitorio)
  var pending = [];
  var sent = {};
  var session = null;

  function nowIso() { return new Date().toISOString(); }
  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return "ep-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }
  function bandToOutcome(band) { return band === "coincide" || band === "supported" || band === "uncertainty_correct" ? "correct" : "incorrect"; }
  function conf100(label) {
    if (CONF_TO_100[label] != null) return CONF_TO_100[label];
    var pro = { cannot_determine: 0, intuition: 25, probable: 50, fairly_sure: 75, certain: 100 };
    return pro[label] != null ? pro[label] : null;
  }

  function makeEvent(type, payload, evidence) {
    return {
      event_id: uuid(),
      event_type: type,
      source_experience: (session && session.module) || "unknown",
      source_mode: (session && session.mode) || "guided",
      occurred_at: nowIso(),
      payload: payload || {},
      evidence: evidence || {},
      metadata: {},
      schema_version: SCHEMA_VERSION
    };
  }

  function flush() {
    if (!transport.endpoint || transport.flushing || !pending.length || typeof fetch !== "function") return Promise.resolve(false);
    transport.flushing = true;
    var work = pending.slice();
    function next() {
      if (!work.length) { transport.flushing = false; return Promise.resolve(true); }
      var ev = work.shift();
      var headers = { "Content-Type": "application/json" };
      var token = null;
      try { token = transport.getToken && transport.getToken(); } catch (e) { token = null; }
      return Promise.resolve(token).then(function (resolvedToken) {
        if (resolvedToken) headers["Authorization"] = "Bearer " + resolvedToken;
        return fetch(transport.endpoint, { method: "POST", headers: headers, body: JSON.stringify(ev), cache: "no-store" });
      }).then(function (response) {
        if (!response || (!response.ok && response.status !== 409)) throw new Error("EP transport failed");
        sent[ev.event_id] = true;
        pending = pending.filter(function (candidate) { return candidate.event_id !== ev.event_id; });
        return next();
      }).catch(function () {
        transport.flushing = false;
        if (!transport.retryTimer) transport.retryTimer = setTimeout(function () { transport.retryTimer = null; flush(); }, 3000);
        return false;
      });
    }
    return next();
  }
  if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("online", flush);

  function emit(ev) {
    if (sent[ev.event_id] || pending.some(function (candidate) { return candidate.event_id === ev.event_id; })) return ev;
    buffer.push(ev);
    pending.push(ev);
    if (session) session.events.push(ev);
    flush();
    return ev;
    // Transporte: fire-and-forget; nunca bloquea la UI. Si no hay endpoint, no-op.
    if (transport.endpoint) {
      try {
        var headers = { "Content-Type": "application/json" };
        var token = transport.getToken && transport.getToken();
        if (token) headers["Authorization"] = "Bearer " + token;
        if (typeof fetch === "function") {
          fetch(transport.endpoint, { method: "POST", headers: headers, body: JSON.stringify(ev) })
            .catch(function () { /* degradación elegante: el evento ya está en buffer */ });
        }
      } catch (e) { /* no-op */ }
    }
    flush();
    return ev;
  }

  var EP = {
    schemaVersion: SCHEMA_VERSION,
    isStub: false,

    /* La app puede inyectar transporte real (endpoint + token). Opcional. */
    configure: function (opts) {
      if (opts && typeof opts === "object") {
        if (opts.endpoint) transport.endpoint = opts.endpoint;
        if (typeof opts.getToken === "function") transport.getToken = opts.getToken;
      }
      flush();
      return transport;
    },

    startSession: function (meta) {
      session = {
        module: (meta && meta.module) || "unknown",
        mode: (meta && meta.mode) || "guided",
        competencies: (meta && meta.competencies) || [],
        startedAt: nowIso(),
        events: [],
        presentedItems: {}
      };
      return session;
    },

    /* decisión del módulo → decision_made (+ confidence_selected) (+ novel_item_presented una vez por ítem) */
    decisionMade: function (p) {
      p = p || {};
      var outcome = bandToOutcome(p.correctnessBand);
      emit(makeEvent("decision_made",
        { decision_axis: p.zoneId || p.phaseId || "decision", selected_value: p.response },
        { outcome: outcome, domain_tags: p.competency ? [p.competency] : [], item_id: p.itemId, band: p.correctnessBand }));

      if (p.confidence != null) {
        var c = conf100(p.confidence);
        if (c != null) emit(makeEvent("confidence_selected",
          { confidence: c }, { outcome: outcome, item_id: p.itemId, confidence_label: p.confidence }));
      }

      if (p.novel && session && p.itemId && !session.presentedItems[p.itemId]) {
        session.presentedItems[p.itemId] = true;
        emit(makeEvent("novel_item_presented",
          { item_family: (p.competency || "wine") }, { item_id: p.itemId }));
      }
      return true;
    },

    /* hipótesis final → decision_made (eje "conclusion") (+ confidence_selected) */
    hypothesisSubmitted: function (p) {
      p = p || {};
      // banda representativa: la del primer sub-componente disponible
      var sub = p.style || p.sweetness || p.positioning || p.quality || {};
      var band = sub.band;
      var outcome = bandToOutcome(band);
      emit(makeEvent("decision_made",
        { decision_axis: "conclusion", selected_value: JSON.stringify({
            style: p.style && p.style.response, sweetness: p.sweetness && p.sweetness.response,
            quality: p.quality && p.quality.response, positioning: p.positioning && p.positioning.response }) },
        { outcome: outcome, domain_tags: ["Conclusiones"], item_id: p.itemId, band: band }));
      if (p.confidence != null) {
        var c = conf100(p.confidence);
        if (c != null) emit(makeEvent("confidence_selected",
          { confidence: c }, { outcome: outcome, item_id: p.itemId, confidence_label: p.confidence }));
      }
      return true;
    },

    misconception: function (p) {
      p = p || {};
      var type = p.status === "resolved" ? "misconception_resolved" : "misconception_detected";
      emit(makeEvent(type, { misconception_id: p.id }, { title: p.title, observed: true }));
      return true;
    },

    sessionCompleted: function (p) {
      p = p || {};
      var mod = (session && session.module) || p.module || "unknown";
      var transferApplied = !!(session && session.transferCompleted);
      emit(makeEvent("practice_completed",
        { practice_type: mod }, { completed: true, transfer_applied: transferApplied, item_id: p.itemId }));
      emit(makeEvent("session_completed",
        { session_type: mod }, { completed: true, item_id: p.itemId }));
      if (session) session.completedAt = nowIso();
      return true;
    },

    transferCompleted: function (p) {
      p = p || {};
      if (session) session.transferCompleted = true;
      emit(makeEvent("practice_completed", { practice_type: "transfer" }, { completed: true, transfer_applied: true, item_id: p.itemId }));
      return true;
    },

    /* RESUMEN ILUSTRATIVO local para "Qué cambió en ti" (pre-backend).
       El backend reemplazará esto con métricas reales vía get-epistemic-profile. */
    getSessionDelta: function () {
      if (!session) return null;
      var evs = session.events;
      var decisions = evs.filter(function (e) { return e.event_type === "decision_made" && e.payload.decision_axis !== "conclusion"; });
      var total = decisions.length || 1;
      var correct = decisions.filter(function (e) { return e.evidence.outcome === "correct"; }).length;

      var confEvents = evs.filter(function (e) { return e.event_type === "confidence_selected"; });
      var confidentMisses = confEvents.filter(function (e) {
        return e.evidence.outcome === "incorrect" && Number(e.payload.confidence) >= 60;
      }).length;
      var underConfidentHits = confEvents.filter(function (e) {
        return e.evidence.outcome === "correct" && Number(e.payload.confidence) <= 40;
      }).length;
      var calibration = "calibrado";
      if (confidentMisses > 0) calibration = "sobreconfianza";
      else if (underConfidentHits >= 2) calibration = "infraconfianza";

      var misc = evs.filter(function (e) { return e.event_type === "misconception_detected" || e.event_type === "misconception_resolved"; })
        .map(function (e) { return { id: e.payload.misconception_id, title: e.evidence.title, status: e.event_type }; });

      return {
        illustrative: true,
        backend: "pending",            // se sustituye por get-epistemic-profile
        competencies: session.competencies,
        accuracy: correct + "/" + total,
        calibration: calibration,
        confidentMisses: confidentMisses,
        misconceptions: misc,
        transferTouched: !!session.transferCompleted
      };
    },

    /* Utilidad de desarrollo: ver el flujo de eventos canónicos. */
    dump: function () { return buffer.slice(); },
    flush: flush,
    pending: function () { return pending.slice(); }
  };

  window.EpistemicProfile = window.EpistemicProfile || EP;
})();
