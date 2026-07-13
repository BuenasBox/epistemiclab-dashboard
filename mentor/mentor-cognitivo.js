/* ============================================================================
 * Mentor Cognitivo — motor de interpretación DETERMINISTA
 *
 * Consume EXCLUSIVAMENTE el contrato EP-01 (Epistemic Profile):
 *   - métricas derivadas (domain, calibration, transfer, readiness, adherence)
 *     tal cual las devuelve GET /functions/v1/get-epistemic-profile en
 *     `derived_metrics.metrics`;
 *   - opcionalmente, los eventos canónicos EP-01 (mismos que registra el cliente
 *     window.EpistemicProfile) para leer misconceptions, historial reciente y
 *     desglose por competencia.
 *
 * NO usa LLM. NO genera contenido aleatorio. NO inventa datos: si una métrica no
 * tiene evidencia suficiente, NO afirma nada sobre ella. Mismo input → mismo output.
 *
 * Voz: Master of Wine que conoce el progreso del estudiante. Mensajes específicos,
 * citando la evidencia (números). Nada motivacional, genérico ni de chatbot.
 *
 * No es backend, no es contrato, no es Edge Function. Solo interpreta evidencia.
 * ==========================================================================*/
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;       // Node / tests
  if (root) root.MentorCognitivo = root.MentorCognitivo || api;                 // navegador
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Severidades alineadas con la Mentor Card del Design System.
  var SEV = {
    PISTA: 'info',          // orientación
    OBSERVACION: 'ok',      // refuerzo basado en evidencia
    ATENCION: 'warn',       // a revisar
    CRITICO: 'crit',        // concepto / riesgo serio
    SINTESIS: 'synthesis',  // titular
    RECOMENDACION: 'action' // siguiente paso accionable
  };

  // Umbrales reales del examen (verificados): 55% aprobado, 70% puerta del
  // simulacro, 75% objetivo recomendado.
  var TH = { pass: 0.55, sim: 0.70, target: 0.75, calLow: 0.60, calGood: 0.75, transferLow: 0.50 };

  var COMP_LABEL = {
    Aspecto: 'Aspecto', Nariz: 'Nariz', Paladar: 'Paladar',
    Calidad: 'Calidad (BLIC)', Conclusiones: 'Conclusiones', Teoria: 'Teoría', 'Teoría': 'Teoría'
  };

  function pct(v) { return Math.round((v || 0) * 100); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function has(metric) { return metric && metric.status === 'derived' && isNum(metric.value); }
  function metricOf(metrics, key) { return (metrics && metrics[key]) || { value: null, evidence_count: 0, status: 'insufficient_evidence' }; }

  function readinessBand(v) {
    if (v >= TH.target) return 'Listo';
    if (v >= TH.pass) return 'En camino';
    return 'Construyendo';
  }

  // ---- lectura determinista de eventos (opcional) ----
  function analyzeEvents(events) {
    var out = {
      decisionsByComp: {},     // competency -> {correct, total}
      overconfident: 0,        // confianza alta + fallo
      underconfident: 0,       // confianza baja + acierto
      confSamples: 0,
      misconceptionsActive: [],// {id,title,count}
      misconceptionsResolved: [],
      recentCount: 0
    };
    if (!Array.isArray(events) || !events.length) return out;

    var detected = {}; // id -> {title,count}
    var resolved = {};
    events.forEach(function (e) {
      if (!e || !e.event_type) return;
      var ev = e.evidence || {}, pl = e.payload || {};
      if (e.event_type === 'decision_made') {
        var tags = Array.isArray(ev.domain_tags) ? ev.domain_tags : [];
        var correct = ev.outcome === 'correct' ? 1 : 0;
        // sólo cuenta decisiones con resultado observable
        if (ev.outcome === 'correct' || ev.outcome === 'incorrect') {
          tags.forEach(function (t) {
            var k = COMP_LABEL[t] || t;
            (out.decisionsByComp[k] = out.decisionsByComp[k] || { correct: 0, total: 0 });
            out.decisionsByComp[k].total++; out.decisionsByComp[k].correct += correct;
          });
        }
      } else if (e.event_type === 'confidence_selected') {
        var c = Number(pl.confidence);
        if (isNum(c) && (ev.outcome === 'correct' || ev.outcome === 'incorrect')) {
          out.confSamples++;
          if (c >= 60 && ev.outcome === 'incorrect') out.overconfident++;
          if (c <= 40 && ev.outcome === 'correct') out.underconfident++;
        }
      } else if (e.event_type === 'misconception_detected') {
        var id = pl.misconception_id; if (!id) return;
        (detected[id] = detected[id] || { id: id, title: ev.title || id, count: 0 }).count++;
      } else if (e.event_type === 'misconception_resolved') {
        var rid = pl.misconception_id; if (!rid) return;
        resolved[rid] = { id: rid, title: ev.title || rid };
      }
    });
    out.recentCount = events.length;
    Object.keys(detected).forEach(function (id) {
      if (resolved[id]) out.misconceptionsResolved.push(resolved[id]);
      else out.misconceptionsActive.push(detected[id]);
    });
    Object.keys(resolved).forEach(function (id) {
      if (!detected[id]) out.misconceptionsResolved.push(resolved[id]);
    });
    // orden estable
    out.misconceptionsActive.sort(function (a, b) { return b.count - a.count || a.id.localeCompare(b.id); });
    out.misconceptionsResolved.sort(function (a, b) { return a.id.localeCompare(b.id); });
    return out;
  }

  function weakestCompetency(byComp, minTotal) {
    var weakest = null;
    Object.keys(byComp).sort().forEach(function (k) {
      var d = byComp[k];
      if (d.total < (minTotal || 3)) return;
      var acc = d.correct / d.total;
      if (!weakest || acc < weakest.acc) weakest = { name: k, acc: acc, correct: d.correct, total: d.total };
    });
    return weakest;
  }

  // Snapshot de todos los ejes con evidencia observable (sin el umbral mínimo
  // que sí aplica weakestCompetency para disparar un mensaje de ATENCION).
  // Pensado para que la UI pinte un mapa completo de competencias, no solo
  // "cuál es la más débil" — la interpretación (qué es débil, qué basta de
  // evidencia) sigue viviendo aquí, no en el renderer.
  function competencySnapshot(byComp) {
    var out = {};
    Object.keys(byComp).forEach(function (k) {
      var d = byComp[k];
      out[k] = {
        correct: d.correct,
        total: d.total,
        acc: d.total > 0 ? d.correct / d.total : null,
        // mismo umbral que usa weakestCompetency para considerar una lectura
        // fiable; por debajo de esto la UI debería mostrarlo como "en formación"
        // en vez de afirmar un nivel.
        reliable: d.total >= 3
      };
    });
    return out;
  }

  // ---- motor principal ----
  function interpret(input) {
    input = input || {};
    var metrics = input.metrics || {};
    var ev = analyzeEvents(input.events);
    var messages = [];
    function push(sev, title, body, basis) { messages.push({ severity: sev, title: title, body: body, basis: basis || '' }); }

    var domain = metricOf(metrics, 'domain');
    var calibration = metricOf(metrics, 'calibration');
    var transfer = metricOf(metrics, 'transfer');
    var readiness = metricOf(metrics, 'readiness');

    var totalEvidence = (domain.evidence_count || 0) + (calibration.evidence_count || 0) +
      (transfer.evidence_count || 0) + (readiness.evidence_count || 0);

    var anyMetric = has(domain) || has(calibration) || has(transfer) || has(readiness);
    var anyEventSignal = ev.misconceptionsActive.length || ev.misconceptionsResolved.length ||
      ev.confSamples > 0 || Object.keys(ev.decisionsByComp).length > 0;

    // 0) Arranque en frío: sin NINGUNA señal usable, no inventamos lecturas.
    if (!anyMetric && !anyEventSignal) {
      push(SEV.OBSERVACION, 'Aún no tengo lecturas tuyas',
        'No hay evidencia suficiente para evaluar tu nivel todavía. Cuando completes algunas prácticas, podré leer tu dominio, tu calibración y tu preparación.',
        'Evidencia: ' + totalEvidence + ' eventos con resultado.');
      push(SEV.RECOMENDACION, 'Empieza por una práctica guiada',
        'Una sesión de Bottle Guided o Label Guided genera la primera evidencia para tu perfil.',
        'Base: sin métricas derivadas (insufficient_evidence).');
      return finalize(messages, { readiness: null, band: null, competencies: competencySnapshot(ev.decisionsByComp) });
    }

    // 1) Misconceptions activas (máxima prioridad: concepto sin cerrar)
    ev.misconceptionsActive.forEach(function (m) {
      push(SEV.CRITICO, 'Idea recurrente sin cerrar',
        'Detecté un concepto que vuelve a aparecer: «' + m.title + '». Conviene corregirlo antes de avanzar; en cata ciega un error de base se arrastra a la conclusión.',
        'Base: detectada ' + m.count + (m.count === 1 ? ' vez' : ' veces') + ' y aún no contradicha por tu desempeño posterior.');
    });

    // 2) Transferencia: riesgo de memorización
    if (has(transfer) && transfer.value < TH.transferLow) {
      push(SEV.CRITICO, 'Riesgo de memorización',
        'Rindes mejor en material ya visto que en ítems nuevos. El examen es ciego y con vinos que nunca probaste: lo que cuenta es transferir el razonamiento, no recordar casos.',
        'Base: transferencia ' + pct(transfer.value) + '% sobre ' + transfer.evidence_count + ' señales (nuevo vs. visto).');
    }

    // 3) Calibración: dirección desde eventos si los hay
    if (has(calibration) && calibration.value < TH.calLow) {
      var dir = '';
      if (ev.confSamples > 0 && ev.overconfident > ev.underconfident) {
        dir = ' Tiendes a la sobreconfianza: en ' + ev.overconfident + ' lectura(s) declaraste seguridad alta y fallaste. En un examen, esa certeza mal puesta cuesta puntos.';
      } else if (ev.confSamples > 0 && ev.underconfident > ev.overconfident) {
        dir = ' Tiendes a infravalorarte: aciertas con baja confianza. Tu criterio es más fiable de lo que crees.';
      }
      push(SEV.ATENCION, 'Tu confianza no predice tu acierto',
        'Saber cuándo aciertas es tan importante como acertar.' + dir + ' Antes del simulacro, ajusta tu certeza a tu evidencia real.',
        'Base: calibración ' + pct(calibration.value) + '% sobre ' + calibration.evidence_count + ' lecturas de confianza.');
    }

    // 4) Competencia más débil (desde eventos) o dominio global
    var weak = weakestCompetency(ev.decisionsByComp, 3);
    if (weak && weak.acc < 0.7) {
      push(SEV.ATENCION, 'Tu eje más débil es ' + weak.name,
        'Concentra tu próxima práctica deliberada aquí: es donde más sube tu readiness ahora mismo.',
        'Base: ' + weak.correct + '/' + weak.total + ' correctas en ' + weak.name + ' (' + pct(weak.acc) + '%).');
    } else if (!weak && has(domain) && domain.value < 0.6) {
      push(SEV.ATENCION, 'Dominio general aún en formación',
        'Tu base de decisiones todavía no es sólida. Práctica guiada con apoyo antes de retirar pistas.',
        'Base: dominio ' + pct(domain.value) + '% sobre ' + domain.evidence_count + ' decisiones.');
    }

    // 5) Síntesis de readiness (titular)
    if (has(readiness)) {
      var band = readinessBand(readiness.value), v = pct(readiness.value);
      var gate = readiness.value < TH.sim
        ? ' El simulacro completo se abre en ' + pct(TH.sim) + '%: te faltan ' + (pct(TH.sim) - v) + ' puntos.'
        : ' Ya puedes afrontar el simulacro completo.';
      push(SEV.SINTESIS, 'Preparación: ' + band + ' (' + v + '%)',
        'Estás ' + (readiness.value >= TH.pass ? 'por encima' : 'por debajo') + ' del aprobado (' + pct(TH.pass) + '%); el objetivo recomendado antes de presentarte es ' + pct(TH.target) + '%.' + gate,
        'Base: readiness ' + v + '% sobre ' + readiness.evidence_count + ' sesiones integradas.');
    }

    // 6) Refuerzos basados en evidencia (no motivacionales: citan datos)
    if (has(calibration) && calibration.value >= TH.calGood) {
      push(SEV.OBSERVACION, 'Buena calibración',
        'Tu confianza acompaña a tu acierto: esa lucidez sobre lo que sabes es lo que sostiene la calma en un examen ciego.',
        'Base: calibración ' + pct(calibration.value) + '% sobre ' + calibration.evidence_count + ' lecturas.');
    }
    if (has(transfer) && transfer.value >= 0.75) {
      push(SEV.OBSERVACION, 'Transferencia sólida',
        'Aplicas tu razonamiento a material nuevo, no a casos memorizados. Es la señal de aprendizaje real que pide el examen.',
        'Base: transferencia ' + pct(transfer.value) + '% sobre ' + transfer.evidence_count + ' señales.');
    }
    ev.misconceptionsResolved.forEach(function (m) {
      push(SEV.OBSERVACION, 'Concepto consolidado',
        'Cerraste una idea que antes te confundía: «' + m.title + '». Una confusión menos para el examen.',
        'Base: detectada y luego contradicha por tu desempeño posterior.');
    });

    // 7) Siguiente paso (una sola acción accionable, derivada del hueco prioritario)
    var rec = recommend(ev, { domain: domain, calibration: calibration, transfer: transfer, readiness: readiness });
    if (rec) push(SEV.RECOMENDACION, rec.title, rec.body, rec.basis);

    return finalize(messages, {
      readiness: has(readiness) ? readiness.value : null,
      band: has(readiness) ? readinessBand(readiness.value) : null,
      competencies: competencySnapshot(ev.decisionsByComp)
    });
  }

  function recommend(ev, m) {
    if (ev.misconceptionsActive.length) {
      var top = ev.misconceptionsActive[0];
      return { title: 'Siguiente paso: cerrar «' + top.title + '»', body: 'Haz un mini-ejercicio dirigido a ese concepto antes de subir de dificultad.', basis: 'Prioridad: idea recurrente sin cerrar.' };
    }
    if (has(m.transfer) && m.transfer.value < TH.transferLow) {
      return { title: 'Siguiente paso: practica con material nuevo', body: 'Elige ítems que no hayas visto para convertir memoria en transferencia.', basis: 'Prioridad: transferencia ' + pct(m.transfer.value) + '%.' };
    }
    var weak = weakestCompetency(ev.decisionsByComp, 3);
    if (weak && weak.acc < 0.7) {
      return { title: 'Siguiente paso: práctica deliberada de ' + weak.name, body: 'Una sesión enfocada en tu eje más débil es lo que más mueve tu readiness ahora.', basis: 'Prioridad: ' + weak.name + ' ' + pct(weak.acc) + '%.' };
    }
    if (has(m.calibration) && m.calibration.value < TH.calLow) {
      return { title: 'Siguiente paso: ejercicio de calibración', body: 'Practica declarando tu confianza en cada decisión y compárala con el resultado.', basis: 'Prioridad: calibración ' + pct(m.calibration.value) + '%.' };
    }
    if (has(m.readiness) && m.readiness.value >= TH.sim) {
      return { title: 'Siguiente paso: simulacro completo', body: 'Tu preparación ya permite una sesión en condiciones de examen.', basis: 'Base: readiness ' + pct(m.readiness.value) + '% ≥ ' + pct(TH.sim) + '%.' };
    }
    return { title: 'Siguiente paso: práctica ciega', body: 'Retira el apoyo de identidad para consolidar tu juicio independiente.', basis: 'Base: progresión natural del andamiaje.' };
  }

  // Orden determinista por severidad/prioridad; estable dentro de cada grupo.
  function finalize(messages, summary) {
    var order = { crit: 0, warn: 1, synthesis: 2, ok: 3, info: 4, action: 5 };
    var idx = 0;
    messages.forEach(function (m) { m._i = idx++; });
    messages.sort(function (a, b) {
      var d = (order[a.severity] - order[b.severity]); return d !== 0 ? d : a._i - b._i;
    });
    messages.forEach(function (m) { delete m._i; });
    return { schema: 'mentor-cognitivo.v1', messages: messages, summary: summary };
  }

  // Orden canónico de ejes para que la UI pinte el mapa de competencias de
  // forma estable aunque algunos ejes todavía no tengan evidencia.
  var COMP_ORDER = ['Aspecto', 'Nariz', 'Paladar', 'Calidad (BLIC)', 'Conclusiones', 'Teoría'];

  return {
    SEVERITIES: SEV,
    THRESHOLDS: TH,
    COMPETENCY_ORDER: COMP_ORDER,
    interpret: interpret,
    // conveniencia: extrae métricas de la respuesta de get-epistemic-profile
    fromProfileResponse: function (resp, events, examDate) {
      var metrics = resp && resp.derived_metrics && resp.derived_metrics.metrics ? resp.derived_metrics.metrics : {};
      return interpret({ metrics: metrics, events: events || [], examDate: examDate });
    }
  };
});
