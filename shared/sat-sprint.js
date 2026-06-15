// Y.1.5: SAT Sprint mode (single wine, quality focus)
// Lower barrier to SAT practice. Formative only. safe_for_examiner=False

(function (root, factory) {
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SATSprint = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  // Y.1.5: Get a single wine for sprint mode
  function getSingleWineForSprint() {
    // Try new wine inventory first
    if (root.WINE_INVENTORY && root.WINE_INVENTORY.length > 0) {
      var wines = root.WINE_INVENTORY;
      var idx = Math.floor(Math.random() * wines.length);
      return wines[idx];
    }
    // Fallback to legacy SESSION_BANK.sat_prompts if new inventory unavailable
    if (root.SESSION_BANK && root.SESSION_BANK.sat_prompts && root.SESSION_BANK.sat_prompts.length > 0) {
      var legacyWines = root.SESSION_BANK.sat_prompts;
      var idx = Math.floor(Math.random() * legacyWines.length);
      return legacyWines[idx];
    }
    return null;
  }

  // Y.1.5: Render SAT Sprint UI
  function renderSATSprintUI(wine) {
    if (!wine) return '';
    var html = '<div style="background:#1a2332;border:2px solid #4a7c8c;border-radius:8px;padding:20px">' +
      '<div style="color:#65b7c7;font-weight:700;margin-bottom:12px">SAT SPRINT · CALIBRACIÓN DE CALIDAD</div>' +
      '<div style="color:#aab4bd;margin-bottom:16px">Sesión enfocada: describe este vino y emite tu juicio de calidad</div>' +
      '<div style="background:#0f1519;border-radius:6px;padding:14px;margin-bottom:14px">' +
      '<div style="color:#d5a84f;font-weight:600;margin-bottom:8px">WINE</div>' +
      '<div style="color:#aab4bd;font-size:13px;line-height:1.6">' + (wine.description || wine.wine_name) + '</div>' +
      '</div>' +
      '<div style="color:#c9a84c;font-size:11px;margin-bottom:12px;font-weight:600">YOUR RESPONSE</div>' +
      '<textarea id="sprint-response" style="width:100%;min-height:120px;border:1px solid #303944;background:#0f1519;color:#f5f7fa;padding:10px;border-radius:6px;font-family:inherit;font-size:13px" placeholder="Describe el vino y emite tu juicio de calidad..."></textarea>' +
      '<div style="margin-top:12px;color:#525e6e;font-size:11px">' +
      'Respuesta de entrenamiento. Recibiras feedback sobre tu estructura y observaciones.' +
      '</div>' +
      '</div>';
    return html;
  }

  // Y.1.5: Process SAT Sprint response
  function processSATSprintResponse(response, wine) {
    if (!response || !root.LI) return { findings: [] };
    var findings = root.LI.coachSAT ? root.LI.coachSAT(response, wine) : [];
    return {
      findings: findings,
      quality: extractQuality(response),
      readiness: extractReadiness(response),
      sections_found: findSATSections(response)
    };
  }

  // Y.1.5: Extract quality declaration
  function extractQuality(text) {
    var low = String(text || '').toLowerCase();
    var qualities = ['excelente', 'muy bueno', 'bueno', 'aceptable', 'simple'];
    for (var i = 0; i < qualities.length; i++) {
      if (low.indexOf(qualities[i]) !== -1) return qualities[i];
    }
    return null;
  }

  // Y.1.5: Extract readiness
  function extractReadiness(text) {
    var low = String(text || '').toLowerCase();
    if (/guarda|envejec|potencial/i.test(low)) return 'age-worthy';
    if (/beber ahora|consumo inmediato/i.test(low)) return 'drink-now';
    return null;
  }

  // Y.1.5: Find SAT sections
  function findSATSections(text) {
    var low = String(text || '').toLowerCase();
    var sections = {
      appearance: /color|aspecto|tonalidad/.test(low),
      nose: /aroma|nariz|olfato/.test(low),
      palate: /boca|sabor|gustativo/.test(low),
      conclusion: /calidad|juicio|valoracion/.test(low)
    };
    return sections;
  }

  // Y.1.5: Render sprint feedback
  function renderSprintFeedback(result) {
    var html = '<div style="background:#1a2332;border:1px solid #4a7c8c;border-radius:8px;padding:16px;margin:12px 0">' +
      '<div style="color:#65b7c7;font-weight:700;margin-bottom:12px">TU FEEDBACK</div>';

    if (!result.quality) {
      html += '<div style="background:#302017;border-left:3px solid #e0a93e;padding:10px;margin-bottom:10px;border-radius:4px">' +
        '<div style="color:#d5a84f;font-weight:600;margin-bottom:4px">⚠ Calidad no declarada</div>' +
        '<div style="color:#aab4bd;font-size:12px">Emite siempre un juicio: excelente, muy bueno, bueno, aceptable, o simple.</div>' +
        '</div>';
    } else {
      html += '<div style="background:#0f2a10;border-left:3px solid #2ec27e;padding:10px;margin-bottom:10px;border-radius:4px">' +
        '<div style="color:#2ec27e;font-weight:600;margin-bottom:4px">✓ Calidad declarada</div>' +
        '<div style="color:#aab4bd;font-size:12px">Juicio: «' + result.quality + '»</div>' +
        '</div>';
    }

    if (!result.readiness) {
      html += '<div style="background:#302017;border-left:3px solid #e0a93e;padding:10px;margin-bottom:10px;border-radius:4px">' +
        '<div style="color:#d5a84f;font-weight:600;margin-bottom:4px">⚠ Potencial de guarda no indicado</div>' +
        '<div style="color:#aab4bd;font-size:12px">Indica si debe envejecer o es para beber ahora.</div>' +
        '</div>';
    }

    (result.findings || []).slice(0, 3).forEach(function (f) {
      var icon = f.ok ? '✓' : '△';
      var color = f.ok ? '#2ec27e' : '#e0a93e';
      html += '<div style="border-left:3px solid ' + color + ';padding:10px;margin-bottom:8px;border-radius:4px;background:#0f1519">' +
        '<div style="color:' + color + ';font-weight:600;font-size:12px">' + icon + ' ' + (f.label || 'Item') + '</div>' +
        '<div style="color:#aab4bd;font-size:11px;margin-top:4px">' + (f.detail || '') + '</div>' +
        '</div>';
    });

    html += '</div>';
    return html;
  }

  return {
    getSingleWineForSprint: getSingleWineForSprint,
    renderSATSprintUI: renderSATSprintUI,
    processSATSprintResponse: processSATSprintResponse,
    renderSprintFeedback: renderSprintFeedback,
  };
});
