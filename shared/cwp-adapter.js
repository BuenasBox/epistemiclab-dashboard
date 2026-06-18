/* ============================================================================
   CWPAdapter — adaptador CONSUMIDOR del Canonical Wine Catalog.
   EpistemicLab es el primer consumidor del catálogo de Codex. El catálogo NO
   expone hoy un `render_profile` seguro, así que este adaptador define el
   contrato que el frontend necesita: proyecta un perfil canónico a un
   render_profile SEGURO según (a) field_metadata.visibility_level y (b) una
   política de seguridad-de-respuesta por modo.

   Regla dura: NUNCA incluye un campo cuyo visibility_level sea 'SERVER_ONLY'.
   En 'blind_simulation' tampoco incluye identidad ni pedagogía (revelan la
   respuesta aunque el catálogo las marque PUBLIC/TRAINING).

   IMPORTANTE: este adaptador está pensado para ejecutarse SERVER-SIDE o en
   build, porque el objeto canónico completo NO debe llegar al navegador. El
   frontend consume el resultado (render_profile), nunca el canónico.
   ============================================================================ */
(function (root) {
  'use strict';

  var DIFF = {1:'Introductorio',2:'Básico',3:'Intermedio',4:'Avanzado',5:'Experto'};

  function vis(canonical, field){
    var fm = canonical && canonical.field_metadata;
    return (fm && fm[field] && fm[field].visibility_level) || null;
  }
  function isServerOnly(canonical, field){ return vis(canonical, field) === 'SERVER_ONLY'; }

  // Política de seguridad-de-respuesta por modo (lo que NO se puede mostrar).
  // Nota: visibility_level del catálogo NO modela esto; lo aporta el consumidor.
  var ANSWER_FIELDS = ['display_name','wine_name','country','region','subregion',
    'appellation','grape_varieties','wine_style','wine_family','quality_level',
    'color','aroma_profile','flavour_profile','sat_fingerprint','pedagogical_dna',
    'comparison_engine','teaching_notes','knowledge_summary'];

  function pick(canonical, mode, opts){
    opts = opts || {};
    var gaps = [];
    var d = canonical || {};
    var diff = DIFF[d.difficulty_score] || null;
    var importance = d.wset_importance === 'CORE' ? 'Núcleo del examen' : d.wset_importance || null;
    var confidence = (typeof d.confidence_score === 'number') ? Math.round(d.confidence_score*100)+'%' : null;

    // --- BRIEFING (blind_simulation): solo meta no reveladora ---
    if (mode === 'blind_simulation'){
      // Campos pedidos por la UI pero ausentes en el modelo => documentar
      if (!d.recommended_level) gaps.push('recommended_level');
      if (!d.related_ra) gaps.push('related_ra');
      return {
        _mode: mode, _gaps: gaps,
        identity: {
          display_label: 'Vino ' + (d.wine_type==='TINTO'?'tinto':(d.wine_type==='ROSADO'?'rosado':'blanco')) + ' — práctica a ciegas',
          wine_type: d.wine_type || null,
          practice_mode: opts.practice_mode || 'Cata a ciegas',
          difficulty: diff,
          difficulty_score: d.difficulty_score || null,
          importance: importance,
          confidence: confidence,
          priority: d.practice_priority != null ? (d.practice_priority + '/5') : null
        },
        glass: d.wine_type ? { wineType: d.wine_type } : null
        // progress / pedagogy / comparison / sat_state: omitidos a propósito en ciego
      };
    }

    // --- DEBRIEF / LEARN (post-cata): pedagogía TRAINING, nunca SERVER_ONLY ---
    var ped = (!isServerOnly(d,'pedagogical_dna') && d.pedagogical_dna) || {};
    var cmp = (!isServerOnly(d,'comparison_engine') && d.comparison_engine) || {};
    var tn  = (!isServerOnly(d,'teaching_notes') && d.teaching_notes) || {};

    if (!cmp.next_recommended && !d.recommended_next_style) gaps.push('recommended_next_style');
    if (isArrIds(cmp.frequently_confused_with)) gaps.push('comparison_human_labels'); // son IDs, no etiquetas

    return {
      _mode: mode, _gaps: gaps,
      identity: {
        display_label: d.display_name || d.wine_name || null,
        wine_type: d.wine_type || null,
        practice_mode: opts.practice_mode || 'Repaso posterior',
        difficulty: diff,
        difficulty_score: d.difficulty_score || null,
        importance: importance,
        confidence: confidence
      },
      pedagogy: {
        core_concepts: ped.core_concepts || null,
        learning_objectives: ped.learning_objectives || null,
        mentor_focus: arrJoin(ped.mentor_focus),
        misconceptions: ped.typical_misconceptions || null,
        exam_traps: ped.exam_traps || null,
        memory_hooks: ped.memory_hooks || null
      },
      comparison: {
        distinguishing_features: cmp.distinguishing_features || null,
        confused_with: [],     // IDs crudos no se muestran (ver _gaps)
        similar_profiles: [],
        next_recommended: cmp.next_recommended || null
      },
      teaching_notes: tn.revision_priority ? ('Prioridad de repaso: ' + String(tn.revision_priority).toUpperCase()) : null
    };
  }

  function arrJoin(a){ return (Array.isArray(a)&&a.length) ? a.join(' · ') : null; }
  function isArrIds(a){ return Array.isArray(a) && a.length>0 && /^SAT_WINE_/.test(String(a[0])); }

  root.CWPAdapter = {
    toRenderProfile: pick,
    DIFFICULTY: DIFF
  };
})(typeof window !== 'undefined' ? window : this);
