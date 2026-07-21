/* ============================================================================
   WineIntelligenceCard — motor visual del panel de inteligencia del vino.
   API:
     WineIntelligenceCard.render(profile) -> string HTML
     WineIntelligenceCard.mount(el, profile) -> { update(profile), el }
   Lee SOLO campos seguros (whitelist). Oculta secciones sin datos: nunca deja
   huecos. Reutiliza SATWineGlass.render() para la copa (no duplica lógica).
   Gobernanza: jamás muestra canonical / expected / respuestas correctas /
   productor / añada / source refs / safe_for_examiner / flags internos.
   ============================================================================ */
(function (root) {
  'use strict';

  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function isArr(a){ return Array.isArray(a) && a.length>0; }
  function has(v){ return v!=null && v!=='' && !(Array.isArray(v)&&v.length===0); }

  function chips(arr, kind){
    if(!isArr(arr)) return '';
    return '<div class="wic-chips">' + arr.map(function(t){
      return '<span class="wic-chip '+(kind||'')+'">'+esc(t)+'</span>'; }).join('') + '</div>';
  }
  function list(arr, cls){
    if(!isArr(arr)) return '';
    return '<ul class="wic-list '+(cls||'')+'">' + arr.map(function(t){
      return '<li>'+esc(t)+'</li>'; }).join('') + '</ul>';
  }
  function row(label, val){
    if(!has(val)) return '';
    return '<div class="wic-row"><span>'+esc(label)+'</span><span>'+esc(val)+'</span></div>';
  }
  function section(title, body){
    if(!body) return '';
    return '<div class="wic-sec"><h4>'+esc(title)+'</h4>'+body+'</div>';
  }
  function sub(label, body){
    if(!body) return '';
    return '<div class="wic-sublabel">'+esc(label)+'</div>'+body;
  }
  function meter(score){
    score = Math.max(0, Math.min(5, parseInt(score,10)||0));
    var dots=''; for(var i=1;i<=5;i++){ dots+='<i class="'+(i<=score?'on':'')+'"></i>'; }
    return '<span class="wic-meter" aria-hidden="true">'+dots+'</span>';
  }

  // Copa: reutiliza SATWineGlass si está disponible y hay datos de copa.
  function glassSlot(glass){
    if(!glass || typeof glass!=='object') return '';
    if(!(root.SATWineGlass && typeof root.SATWineGlass.render==='function')) return '';
    return '<div class="wic-glass-slot">'+root.SATWineGlass.render(glass)+'</div>';
  }

  function renderBody(p){
    p = p || {};
    var id = p.identity || {};
    var pr = p.progress || {};
    var pe = p.pedagogy || {};
    var cm = p.comparison || {};
    var st = p.sat_state || {};

    // ---- Cabecera ----
    var badges = '';
    if(has(id.wine_type)) badges += '<span class="wic-badge type">'+esc(id.wine_type)+'</span>';
    if(has(id.practice_mode)) badges += '<span class="wic-badge">'+esc(id.practice_mode)+'</span>';
    if(has(id.difficulty)) badges += '<span class="wic-badge diff-'+(parseInt(id.difficulty_score,10)||3)+'">'+esc(id.difficulty)+(has(id.difficulty_score)?meter(id.difficulty_score):'')+'</span>';
    if(has(id.recommended_level)) badges += '<span class="wic-badge">'+esc(id.recommended_level)+'</span>';
    if(has(id.related_ra)) badges += '<span class="wic-badge">'+esc(id.related_ra)+'</span>';
    if(has(id.importance)) badges += '<span class="wic-badge type">'+esc(id.importance)+'</span>';
    if(has(id.confidence)) badges += '<span class="wic-badge">Confianza '+esc(id.confidence)+'</span>';
    if(has(id.priority)) badges += '<span class="wic-badge">Prioridad '+esc(id.priority)+'</span>';
    if(has(id.wset_level)) badges += '<span class="wic-badge wset">'+esc(id.wset_level)+'</span>';
    if(has(id.practice_number)) badges += '<span class="wic-badge">Práctica '+esc(id.practice_number)+'</span>';

    // Meta del hero: objetivo pedagógico + mensaje motivador (sin revelar identidad)
    var heroMeta = '';
    if(has(id.objective)) heroMeta += '<div class="wic-objective"><span class="wic-obj-ic" aria-hidden="true">🎯</span><span>'+esc(id.objective)+'</span></div>';
    if(has(id.motivational)) heroMeta += '<div class="wic-motiv">'+esc(id.motivational)+'</div>';
    if(heroMeta) heroMeta = '<div class="wic-hero-meta">'+heroMeta+'</div>';

    var head = '<div class="wic-head"><div class="wic-head-main">'
      + '<div class="wic-eyebrow">Panel de práctica</div>'
      + '<div class="wic-title">'+esc(id.display_label || 'Práctica de cata')+'</div>'
      + (badges ? '<div class="wic-badges">'+badges+'</div>' : '')
      + heroMeta
      + '</div>' + glassSlot(p.glass) + '</div>';

    // ---- Secciones (grid) ----
    var secs = '';

    // Progreso del estudiante
    var progBody = '';
    if(has(pr.percent)){
      var pct = Math.max(0, Math.min(100, parseInt(pr.percent,10)||0));
      progBody += '<div class="wic-prog-meta"><span>Progreso</span><span>'+pct+'%</span></div>'
        + '<div class="wic-prog"><i data-pct="'+pct+'"></i></div>';
    }
    progBody += row('Intentos previos', pr.attempts);
    progBody += row('Fase actual', pr.current_phase);
    progBody += sub('Fortalezas', chips(pr.strengths,'ok'));
    progBody += sub('A reforzar', chips(pr.weaknesses,'warn'));
    progBody += sub('Conceptos dominados', chips(pr.mastered,'gold'));
    progBody += sub('Conceptos pendientes', chips(pr.pending,'muted'));
    secs += section('Progreso del estudiante', progBody);

    // Inteligencia pedagógica
    var pedBody = '';
    pedBody += sub('Conceptos clave', chips(pe.core_concepts,'gold'));
    pedBody += sub('Objetivos de aprendizaje', list(pe.learning_objectives));
    if(has(pe.mentor_focus)) pedBody += sub('Foco del mentor', '<div class="wic-focus">'+esc(pe.mentor_focus)+'</div>');
    pedBody += sub('Errores típicos', list(pe.misconceptions,'traps'));
    pedBody += sub('Trampas de examen', list(pe.exam_traps,'traps'));
    pedBody += sub('Anclas de memoria', list(pe.memory_hooks,'hooks'));
    secs += section('Inteligencia pedagógica', pedBody);

    // Comparación (futuro) — se oculta si no hay datos
    var cmpBody = '';
    cmpBody += sub('Se confunde con', chips(cm.confused_with,'warn'));
    cmpBody += sub('Rasgos distintivos', list(cm.distinguishing_features));
    cmpBody += sub('Perfiles similares', chips(cm.similar_profiles,'muted'));
    cmpBody += row('Siguiente vino recomendado', cm.next_recommended);
    secs += section('Comparación', cmpBody);

    // Estado SAT
    var satOrder = [['appearance','Aspecto'],['nose','Nariz'],['palate','Paladar'],['quality','Calidad'],['ageing','Estado para el consumo / Potencial para el envejecimiento']];
    var satBody = '';
    satOrder.forEach(function(pair){ satBody += row(pair[1], st[pair[0]]); });
    secs += section('Estado SAT', satBody);

    var grid = secs ? '<div class="wic-grid">'+secs+'</div>' : '';
    var notes = has(p.teaching_notes) ? '<div class="wic-notes">'+esc(p.teaching_notes)+'</div>' : '';

    // aria-label resumido (solo identidad pedagógica, nada de respuesta)
    return head + grid + notes;
  }

  function ariaFor(p){
    p=p||{}; var id=p.identity||{};
    var parts=['Panel de práctica de cata'];
    if(has(id.display_label)) parts.push(id.display_label);
    if(has(id.difficulty)) parts.push('dificultad '+id.difficulty);
    if(has(id.related_ra)) parts.push(id.related_ra);
    return parts.join('. ');
  }

  function render(profile){
    return '<section class="wic" role="region" aria-label="'+esc(ariaFor(profile))+'">'
      + renderBody(profile) + '</section>';
  }

  function applyDynamicStyles(el){
    if(!el) return;
    el.querySelectorAll('[data-pct]').forEach(function(i){ i.style.width = i.getAttribute('data-pct')+'%'; });
  }

  function mount(el, profile){
    if(!el) return null;
    el.innerHTML = render(profile);
    applyDynamicStyles(el);
    return {
      el: el,
      update: function(p){ el.innerHTML = render(p); applyDynamicStyles(el); }
    };
  }

  root.WineIntelligenceCard = { render: render, mount: mount };
})(typeof window !== 'undefined' ? window : this);
