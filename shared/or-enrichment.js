// Y.1.4: Open Response Lab enrichment layer
// Provides expected structure, concepts, and causal reasoning guidance
// Safe_for_examiner = False; formative only

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.OREnrichment = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  // Y.1.4: Expected structure for OR items (from Distinction Coach patterns)
  var EXPECTED_STRUCTURES = {
    'describe': ['Characterística', 'Detalle', 'Dato relevante'],
    'explain': ['Factor', 'Mecanismo', 'Resultado', 'Impacto en calidad'],
    'compare': ['Elemento 1', 'Elemento 2', 'Similitud/Diferencia', 'Impacto'],
    'justify': ['Posición', 'Evidencia 1', 'Evidencia 2', 'Conclusión'],
    'assess': ['Juicio', 'Evidencia positiva', 'Evidencia negativa', 'Balance final'],
    'evaluate': ['Aspecto 1', 'Importancia', 'Aspecto 2', 'Importancia', 'Conclusión'],
    'why': ['Problema', 'Método', 'Beneficio', 'Impacto'],
    'how': ['Factor', 'Mecanismo', 'Resultado', 'Impacto'],
  };

  // Y.1.4: Expected causal chain (always the same in wine context)
  var CAUSAL_CHAIN = ['vid (viña/cepa)', 'uva (maduración/composición)', 'vino (estilo/estructura)', 'calidad (complejidad/equilibrio)'];

  // Y.1.4: Build enrichment card from OR item
  function enrichORItem(stem, verb) {
    if (!stem || !verb) return null;
    var structure = EXPECTED_STRUCTURES[verb];
    if (!structure) return null;

    var html = '<div style="background:#1a2332;border:1px solid #4a7c8c;border-radius:8px;padding:14px;margin:12px 0;font-size:12px">' +
      '<div style="color:#65b7c7;font-weight:700;margin-bottom:10px">STRUCTURE GUIDANCE</div>' +
      '<div style="color:#aab4bd;margin-bottom:12px">Para responder «' + verb + '», sigue esta estructura:</div>';

    structure.forEach(function (step, idx) {
      html += '<div style="display:flex;gap:10px;margin:8px 0">' +
        '<div style="color:#d5a84f;font-weight:700;min-width:30px">' + (idx + 1) + '.</div>' +
        '<div style="color:#aab4bd">' + step + '</div>' +
        '</div>';
    });

    html += '<div style="background:#0f1519;border-radius:6px;padding:10px;margin-top:10px;color:#525e6e;font-size:11px">' +
      'Estructura formativa. No es scoring oficial.' +
      '</div></div>';
    return html;
  }

  // Y.1.4: Causal chain guidance
  function causalChainGuidance() {
    var html = '<div style="background:#1a2332;border:1px solid #4a7c8c;border-radius:8px;padding:14px;margin:12px 0;font-size:12px">' +
      '<div style="color:#65b7c7;font-weight:700;margin-bottom:10px">CAUSAL CHAIN (En respuestas EXPLAIN/WHY/HOW)</div>' +
      '<div style="color:#aab4bd;margin-bottom:8px">Conecta Factor → Efecto completo:</div>';

    CAUSAL_CHAIN.forEach(function (stage, idx) {
      html += '<div style="display:flex;align-items:center;gap:10px;margin:6px 0">' +
        '<span style="color:#d5a84f">' + stage + '</span>';
      if (idx < CAUSAL_CHAIN.length - 1) {
        html += '<span style="color:#525e6e">→</span>';
      }
      html += '</div>';
    });

    html += '<div style="background:#0f1519;border-radius:6px;padding:10px;margin-top:10px;color:#525e6e;font-size:11px">' +
      'Cadena causal formativa: vid → uva → vino → calidad' +
      '</div></div>';
    return html;
  }

  // Y.1.4: Render enrichment for OR item
  function renderOREnrichment(item) {
    if (!item || !item.stem) return '';
    if (!root.LI) return '';

    var verb = root.LI.detectVerb ? root.LI.detectVerb(item.stem) : null;
    if (!verb) return '';

    var html = '<div style="margin:12px 0;padding:12px;background:#0f1519;border-radius:8px;border:1px solid #1c222d">' +
      '<div style="color:#c9a84c;font-weight:700;margin-bottom:10px;font-size:11px">FORMATIVE GUIDANCE</div>';

    html += enrichORItem(item.stem, verb);
    var m = root.LI.VERB_MATRIX ? root.LI.VERB_MATRIX[verb] : null;
    if (m && m.causal) {
      html += causalChainGuidance();
    }

    html += '<div style="color:#525e6e;font-size:10px;margin-top:10px">Guía formativa para mejorar tu respuesta. NO evaluación oficial WSET.</div>';
    html += '</div>';
    return html;
  }

  return {
    enrichORItem: enrichORItem,
    causalChainGuidance: causalChainGuidance,
    renderOREnrichment: renderOREnrichment,
    EXPECTED_STRUCTURES: EXPECTED_STRUCTURES,
    CAUSAL_CHAIN: CAUSAL_CHAIN,
  };
});
