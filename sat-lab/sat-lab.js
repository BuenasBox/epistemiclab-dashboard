(function(){
  "use strict";
  var CFG = (window.WSET_SUPABASE_CONFIG || {url:'https://hylknjjhmxsuuwbsslkr.supabase.co'});
  var FN = CFG.url + '/functions/v1/';

  var LABELS = {
    claridad:{claro:'Claro',turbio:'Turbio (¿defecto?)'},
    intensidad_aspecto:{'pálida':'Pálida',media:'Media',profunda:'Profunda'},
    color_blanco:{'verde_limón':'Verde limón','amarillo_limón':'Amarillo limón',dorado:'Dorado','ámbar':'Ámbar','marrón':'Marrón'},
    color_tinto:{'púrpura':'Púrpura','rubí':'Rubí',granate:'Granate',teja:'Teja','marrón':'Marrón'},
    color_rosado:{rosado:'Rosado','salmón':'Salmón',naranja:'Naranja'},
    'condición':{limpia:'Limpia',no_limpia:'No limpia (¿defecto?)'},
    intensidad_nariz:{ligera:'Ligera',media_menos:'Media (−)',media:'Media','media_más':'Media (+)',pronunciada:'Pronunciada'},
    'evolución':{joven:'Joven','en_evolución':'En evolución',evolucionado:'Evolucionado',cansado:'Pasó su mejor momento'},
    dulzor:{seco:'Seco',casi_seco:'Casi seco',semiseco:'Semiseco',semidulce:'Semidulce',dulce:'Dulce',muy_dulce:'Muy dulce'},
    acidez:{baja:'Baja',media_menos:'Media (−)',media:'Media','media_más':'Media (+)',alta:'Alta'},
    tanino:{bajo:'Bajo',medio_menos:'Medio (−)',medio:'Medio','medio_más':'Medio (+)',alto:'Alto'},
    alcohol:{bajo:'Bajo',medio:'Medio',alto:'Alto'},
    cuerpo:{poco:'Poco',medio_menos:'Medio (−)',medio:'Medio','medio_más':'Medio (+)',mucho:'Mucho'},
    intensidad_sabor:{ligera:'Ligera',media_menos:'Media (−)',media:'Media','media_más':'Media (+)',pronunciada:'Pronunciada'},
    final:{corto:'Corto',medio_menos:'Medio (−)',medio:'Medio','medio_más':'Medio (+)',largo:'Largo'},
    'evaluación_calidad':{defectuoso:'Defectuoso',pobre:'Pobre',aceptable:'Aceptable',bueno:'Bueno',muy_bueno:'Muy bueno',excelente:'Excelente'},
    potencial_guarda:{demasiado_joven:'Demasiado joven',se_puede_beber_ahora:'Se puede beber ahora, pero tiene potencial para el envejecimiento',beber_ahora_no_adecuado:'Beber ahora: no adecuado para el envejecimiento o para un mayor envejecimiento',demasiado_viejo:'Demasiado viejo'}
  };
  var DEC_TITLE = {
    claridad:'Claridad',intensidad_aspecto:'Intensidad del color',color_blanco:'Color',color_tinto:'Color',color_rosado:'Color',
    'condición':'Condición',intensidad_nariz:'Intensidad aromática','evolución':'Evolución',
    dulzor:'Dulzor',acidez:'Acidez',tanino:'Taninos',alcohol:'Alcohol',cuerpo:'Cuerpo',intensidad_sabor:'Intensidad de sabor',final:'Final',
    'evaluación_calidad':'Nivel de calidad',potencial_guarda:'Estado para el consumo / Potencial para el envejecimiento'
  };
  var PHASE_NAME = {ASPECTO:'Aspecto',NARIZ:'Nariz',PALADAR:'Paladar',EVALUACION_CALIDAD:'Evaluación de calidad',POTENCIAL_GUARDA:'Estado para el consumo / Potencial para el envejecimiento'};
  var PHASES = [
    {id:'ASPECTO', title:'Aspecto · la vista', sub:'¿Qué te dice la copa antes de olerla?', decisions:['claridad','intensidad_aspecto','__color__']},
    {id:'NARIZ', title:'Nariz · el olfato', sub:'Intensidad y familias de aroma. Aún no concluyas.', decisions:['condición','intensidad_nariz','evolución']},
    {id:'PALADAR', title:'Paladar · la boca', sub:'Contrasta la estructura con lo que la nariz sugirió.', decisions:['dulzor','acidez','__tanino__','alcohol','cuerpo','intensidad_sabor','final']},
    {id:'EVALUACION_CALIDAD', title:'Evaluación de calidad', sub:'Comprométete con un nivel y justifícalo (BICL).', decisions:['evaluación_calidad']},
    {id:'POTENCIAL_GUARDA', title:'Estado para el consumo / Potencial para el envejecimiento', sub:'Decide el estado para el consumo y el potencial para el envejecimiento a partir de la estructura observada.', decisions:['potencial_guarda']}
  ];

  var S = { wine:null, attemptId:null, phaseIdx:0, answers:{}, decisionsCount:0, finished:false, mode:'blind' };
  var glass = null;

  // Estado declarado por el estudiante para la copa (NUNCA la respuesta correcta).
  function glassState(aromaActive){
    var a = S.answers;
    function v(k){ return a[k] ? a[k].value : null; }
    return {
      wineType: S.wine && S.wine.wine_type,
      fill: 0.5,
      clarity: v('claridad'),
      colour: v('color_blanco') || v('color_tinto') || v('color_rosado'),
      intensity: v('intensidad_aspecto'),
      evolution: v('evolución'),
      alcohol: v('alcohol'),
      body: v('cuerpo'),
      bubbles: v('burbuja'),
      aroma: { active: !!aromaActive, intensity: v('intensidad_nariz') }
    };
  }
  function updateGlass(){
    if (!window.SATWineGlass) return;
    var mountEl = $('glass-mount');
    if (!mountEl) return;
    if (!glass) glass = SATWineGlass.mount(mountEl);
    glass.update(glassState(PHASES[S.phaseIdx] && PHASES[S.phaseIdx].id==='NARIZ'));
  }

  function $(id){return document.getElementById(id);}
  function show(id){['screen-intro','screen-loading','screen-tasting','screen-summary'].forEach(function(s){$(s).style.display=(s===id)?'block':'none';});}

  async function authHeaders(json){
    var token = await requireAuth();
    var h = {'Authorization':'Bearer '+token};
    if(json) h['Content-Type']='application/json';
    return h;
  }

  async function fetchPracticeWine(mode, requestedId){
    var headers = await authHeaders(false);
    var url = FN+'get-sat-wines?mode='+encodeURIComponent(mode||'blind_simulation');
    if(requestedId) url += '&wine_id='+encodeURIComponent(requestedId);
    var response = await fetch(url, {headers:headers, cache:'no-store'});
    var payload = await response.json().catch(function(){ return {}; });
    if(!response.ok) throw new Error(payload.error||'No se pudo preparar la práctica SAT.');
    var wine = payload.wines && payload.wines[0];
    if(!wine) throw new Error('No hay vinos disponibles ahora mismo.');
    return wine;
  }

  // Capa de perfil escalable: la pantalla es una PLANTILLA. Un futuro perfil de
  // vino (biblioteca de ~107 perfiles o modo "Mi botella") puede llegar en
  // S.wine.render_profile y sobreescribir dinámicamente: decisiones por fase,
  // escala de color, escalas/ opciones permitidas y etiquetas. Si no llega, se
  // usan los valores SAT-006 por defecto (comportamiento actual intacto).
  function profile(){ return (S.wine && S.wine.render_profile) || {}; }

  function resolveDecisions(phase){
    var pr=profile();
    if(pr.decisions && pr.decisions[phase.id]){
      return pr.decisions[phase.id].filter(function(dn){ return LABELS[dn]; });
    }
    return phase.decisions.map(function(d){
      if(d==='__color__'){
        if(pr.color_scale) return pr.color_scale;
        return S.wine.wine_type==='TINTO'?'color_tinto':(S.wine.wine_type==='ROSADO'?'color_rosado':'color_blanco');
      }
      if(d==='__tanino__'){ return (S.wine.wine_type==='TINTO'||S.wine.wine_type==='ROSADO')?'tanino':null; }
      return d;
    }).filter(Boolean);
  }

  function optionValues(dn){
    var pr=profile();
    if(pr.options && pr.options[dn]) return pr.options[dn].filter(function(v){ return LABELS[dn][v]; });
    return Object.keys(LABELS[dn]);
  }

  function requestEntry(){
    $('intro-err').textContent='';
    if(!window.WSETModeAccessGate){ $('intro-err').textContent='No se pudo verificar tu acceso. Inténtalo de nuevo.'; return; }
    window.WSETModeAccessGate.request({
      route:'/sat-lab/', experience:'sat_lab', mode:'sat_sprint', enforcement:'active'
    }).then(function(d){ if(d && d.would_allow) startPractice(); });
  }

  async function startPractice(){
    show('screen-loading');
    try{
      var apiMode = S.mode==='guided'?'bottle_guided':'blind_simulation';
      var wine = previewWine;
      if(!wine || (S.mode==='guided' && !wine.guided_identity)) wine = await fetchPracticeWine(apiMode);
      S.wine = wine;
      var hp = await authHeaders(true);
      var sr = await fetch(FN+'start-sat-attempt', {method:'POST',headers:hp,
        body:JSON.stringify({wine_id:S.wine.id,mode:apiMode,source:'canonical_wine'})});
      var sd = await sr.json();
      if(!sr.ok || !sd.attempt_id) throw new Error('No se pudo iniciar la práctica.');
      S.attemptId = sd.attempt_id; S.phaseIdx=0; S.answers={}; S.decisionsCount=0; glass=null; S.finished=false;
      POST = { debrief:null, comparison:null, recommend:null };
      renderTasting();
    }catch(e){
      show('screen-intro'); $('intro-err').textContent = e.message || String(e);
    }
  }

  // Hero premium de la practica: construido desde el render_profile.blind (campos seguros).
  function buildHero(){
    var id=null, reveal=null;
    if(S.mode==='guided'){
      var tp=resolveTrainingProfile(S.wine.id);
      if(tp){ var ct=mapTrainingToCard(tp, S.wine); id=ct.identity; reveal=ct.reveal; }
    }
    if(!id){
      var prof = (typeof resolveBlindProfile==='function') ? resolveBlindProfile(S.wine.id) : null;
      id = prof ? mapBlindToCard(prof, S.wine).identity : {
        wine_type:S.wine.wine_type, display_label:S.wine.display_label,
        wset_level:WSET_LEVEL, practice_number:practiceNumberOf(S.wine),
        objective:blindObjective(), motivational:blindMotivational(null),
        importance:null, priority:null, difficulty:null, difficulty_score:null };
    }
    if($('hero-eyebrow')) $('hero-eyebrow').textContent = (S.mode==='guided'?'Práctica guiada':'Cata a ciegas');
    if($('wine-label')) $('wine-label').textContent = (S.mode==='guided'? (id.display_label||S.wine.display_label) : (S.wine.display_label || id.display_label)) || 'Vino';
    var b='';
    if(id.wine_type) b+='<span class="sat-hb type">'+id.wine_type+'</span>';
    // if(id.practice_number) b+='<span class="sat-hb">Práctica '+id.practice_number+'</span>';
    if(id.difficulty){ var sc=parseInt(id.difficulty_score,10)||0, dots=''; var lit=Math.max(1,Math.min(5,Math.round(sc/2)));
      for(var i=1;i<=5;i++) dots+='<i class="'+(i<=lit?'on':'')+'"></i>';
      b+='<span class="sat-hb">'+id.difficulty+' <span class="mtr">'+dots+'</span></span>'; }
    if(id.importance) b+='<span class="sat-hb imp">'+id.importance+'</span>';
    if(id.priority) b+='<span class="sat-hb">Prioridad '+id.priority+'</span>';
    // if(id.wset_level) b+='<span class="sat-hb wset">'+id.wset_level+'</span>';
    if(reveal){
      if(reveal.country) b+='<span class="sat-hb">'+countryEs(reveal.country)+'</span>';
      if(reveal.region) b+='<span class="sat-hb">'+reveal.region+'</span>';
      if(reveal.appellation && reveal.appellation!==reveal.region) b+='<span class="sat-hb">'+reveal.appellation+'</span>';
      (reveal.grape_varieties||[]).forEach(function(g){ b+='<span class="sat-hb type">'+g+'</span>'; });
    }
    if($('hero-badges')) $('hero-badges').innerHTML=b;
    var obj=$('hero-objective');
    if(obj){ if(id.objective){ obj.style.display=''; obj.innerHTML='<span aria-hidden="true">🎯</span><span>'+id.objective+'</span>'; } else obj.style.display='none'; }
    if($('hero-motiv')) $('hero-motiv').textContent=id.motivational||'';
  }

  function renderTasting(){
    show('screen-tasting');
    if($('tasting-err')) $('tasting-err').textContent='';
    var wt = S.wine.wine_type;
    $('wine-label').textContent = S.wine.display_label || 'Vino';
    $('wine-chip').textContent = wt==='TINTO'?'Cata a ciegas · tinto':(wt==='ROSADO'?'Cata a ciegas · rosado':'Cata a ciegas · blanco');
    updateGlass();
    buildHero();
    var SHORT=['Aspecto','Nariz','Paladar','Calidad','Guarda'];
    var pct=(PHASES.length>1?(S.phaseIdx/(PHASES.length-1))*100:0);
    var dots = PHASES.map(function(p,i){
      var cls = i<S.phaseIdx?'step done':(i===S.phaseIdx?'step active':'step');
      var mark = i<S.phaseIdx?'✓':(i===S.phaseIdx?'▶':'○');
      return '<div class="'+cls+'"><span class="dot">'+mark+'</span><span class="lbl">'+(SHORT[i]||('F'+(i+1)))+'</span></div>';
    }).join('');
    var nextName = (S.phaseIdx<PHASES.length-1)? SHORT[S.phaseIdx+1] : null;
    $('steps').innerHTML = '<div class="prog-track"><i style="width:'+pct+'%"></i></div>'
      + '<div class="prog-steps">'+dots+'</div>'
      + '<div class="prog-label">Fase <b>'+(S.phaseIdx+1)+'</b> de '+PHASES.length+(nextName?(' · Siguiente: '+nextName):' · Última fase')+'</div>';
    renderPhase();
  }

  function renderPhase(){
    var phase = PHASES[S.phaseIdx];
    $('phase-title').textContent = phase.title;
    $('phase-sub').textContent = phase.sub;
    var decs = resolveDecisions(phase);
    var html = decs.map(function(dn){
      var opts = optionValues(dn).map(function(val){
        var sel = (S.answers[dn] && S.answers[dn].value===val)?' sel':'';
        return '<button class="opt'+sel+'" data-dec="'+dn+'" data-val="'+val+'">'+LABELS[dn][val]+'</button>';
      }).join('');
      return '<div class="decision"><h3>'+DEC_TITLE[dn]+'</h3><div class="opts">'+opts+'</div><div class="fb" id="fb-'+dn+'"></div></div>';
    }).join('');
    $('decisions').innerHTML = html;
    Array.prototype.forEach.call(document.querySelectorAll('.opt'), function(b){
      b.addEventListener('click', function(){ onSelect(b.getAttribute('data-dec'), b.getAttribute('data-val')); });
    });
    $('btn-prev').style.display = S.phaseIdx>0?'inline-block':'none';
    $('btn-next').textContent = (S.phaseIdx===PHASES.length-1)?'Finalizar práctica →':'Siguiente fase →';
    refreshNext();
  }

  function refreshNext(){
    var decs = resolveDecisions(PHASES[S.phaseIdx]);
    $('btn-next').disabled = !decs.every(function(dn){ return S.answers[dn]; });
  }

  async function onSelect(dn, val){
    var phase = PHASES[S.phaseIdx];
    Array.prototype.forEach.call(document.querySelectorAll('.opt[data-dec="'+dn+'"]'), function(b){
      b.classList.toggle('sel', b.getAttribute('data-val')===val);
    });
    var fb = $('fb-'+dn); fb.className='fb show info'; fb.innerHTML='<span class="spin"></span>';
    try{
      var hp = await authHeaders(true);
      var r = await fetch(FN+'evaluate-sat', {method:'POST',headers:hp,
        body:JSON.stringify({wine_id:S.wine.id,phase:phase.id,decision_name:dn,selected_value:val,attempt_id:S.attemptId})});
      var b = await r.json();
      if(!r.ok || !b.ok) throw new Error(b.error||'Error al evaluar.');
      if(!S.answers[dn]) S.decisionsCount++;
      S.answers[dn] = {value:val, label:LABELS[dn][val], severity:b.severity, phase:phase.id};
      var SEV={INFORMATIVA:{cls:'info',ic:'💡',name:'Observación'},
               ADVERTENCIA:{cls:'warn',ic:'⚠',name:'Atención'},
               BLOQUEANTE:{cls:'block',ic:'🎯',name:'Punto crítico'}};
      var sv = SEV[b.severity] || SEV.INFORMATIVA;
      var html = '<span class="mentor-ic" aria-hidden="true">'+sv.ic+'</span>'
        + '<span class="sev">'+sv.name+'</span>'+ (b.feedback_message||'');
      if(b.reasoning_hint) html += '<div class="hint">'+b.reasoning_hint+'</div>';
      if(b.bicl_signal) html += '<div class="bicl">'+b.bicl_signal+'</div>';
      if(b.next_step) html += '<div class="step">'+b.next_step+'</div>';
      fb.className='fb show '+sv.cls; fb.innerHTML = html;
      refreshNext(); updateGlass();
    }catch(e){
      fb.className='fb show block'; fb.innerHTML='<span class="sev">Error</span>'+(e.message||String(e));
    }
  }

  async function nextPhase(){
    if(S.phaseIdx < PHASES.length-1){ S.phaseIdx++; renderTasting(); window.scrollTo(0,0); return; }
    $('btn-next').disabled=true; $('btn-next').textContent='Cerrando práctica…';
    try{
      var hp = await authHeaders(true);
      var response = await fetch(FN+'complete-sat-attempt', {method:'POST',headers:hp,body:JSON.stringify({attempt_id:S.attemptId})});
      var result = await response.json().catch(function(){ return {}; });
      if(!response.ok || !result.ok) throw new Error(result.error||'No se pudo cerrar la práctica.');
      var post = result.post_session||{};
      POST = { debrief:post.debrief||null, comparison:post.comparison||null, recommend:post.recommendation||null };
    }catch(e){
      $('btn-next').disabled=false; $('btn-next').textContent='Finalizar práctica →';
      var box=$('tasting-err'); if(box) box.textContent=e.message||String(e);
      return;
    }
    renderSummary(); window.scrollTo(0,0);
  }
  function prevPhase(){ if(S.phaseIdx>0){ S.phaseIdx--; renderTasting(); window.scrollTo(0,0); } }

  function renderSummary(){
    show('screen-summary');
    S.finished = true;
    try{ if($('print-date')) $('print-date').textContent = new Date().toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'}); }catch(e){}
    var _dp=$('debrief-panel'); if(_dp){ _dp.style.display='none'; _dp.innerHTML=''; }
    var _cp=$('compare-panel'); if(_cp){ _cp.style.display='none'; _cp.innerHTML=''; }
    if (window.SATWineGlass && $('glass-mount-summary')) { var sg=SATWineGlass.mount($('glass-mount-summary')); sg.update(glassState(false)); }
    $('summary-msg').textContent = 'Registraste '+S.decisionsCount+' decisiones a lo largo de las 5 fases del SAT.';
    $('phases-box').innerHTML = PHASES.map(function(p){
      return '<div class="ph-done">✓ '+PHASE_NAME[p.id]+'</div>';
    }).join('');
    var tally={INFORMATIVA:0,ADVERTENCIA:0,BLOQUEANTE:0};
    Object.keys(S.answers).forEach(function(dn){ var s=S.answers[dn].severity; if(tally[s]!=null)tally[s]++; });
    $('tally-box').innerHTML =
      '<span class="pill ok">Informativas: '+tally.INFORMATIVA+'</span>'+
      '<span class="pill warn">Advertencias: '+tally.ADVERTENCIA+'</span>'+
      '<span class="pill block">Bloqueantes: '+tally.BLOQUEANTE+'</span>';
    // Informe pedagógico: hero + fortalezas/áreas (solo señales del mentor, nunca la respuesta).
    if($('report-title')) $('report-title').textContent = 'Tu cata';
    if($('report-badges')){
      var wt2=S.wine.wine_type, rb='';
      if(wt2) rb+='<span class="sat-hb type">'+wt2+'</span>';
      // rb+='<span class="sat-hb wset">'+WSET_LEVEL+'</span>';
      $('report-badges').innerHTML=rb;
    }
    var strengths=[], areas=[];
    PHASES.forEach(function(p){
      var decs=resolveDecisions(p), clean=decs.length>0;
      decs.forEach(function(dn){
        var a=S.answers[dn];
        if(!a){ clean=false; return; }
        if(a.severity!=='INFORMATIVA'){ clean=false; areas.push({t:DEC_TITLE[dn], v:a.label}); }
      });
      if(clean) strengths.push(PHASE_NAME[p.id]);
    });
    var sHtml='';
    if(tally.BLOQUEANTE===0 && tally.ADVERTENCIA===0) sHtml+='<div class="rep-li ok">Cata coherente: sin señales de alerta del mentor.</div>';
    sHtml += strengths.map(function(n){ return '<div class="rep-li ok">Fase sólida: '+n+'</div>'; }).join('');
    if($('strengths-box')) $('strengths-box').innerHTML = sHtml || '<div class="rep-empty">Sigue practicando para consolidar fortalezas.</div>';
    var aHtml = areas.length
      ? areas.map(function(x){ return '<div class="rep-li warn">'+x.t+' <span class="pick">— elegiste: '+x.v+'</span></div>'; }).join('')
      : '<div class="rep-li ok">Sin aspectos marcados para reforzar en esta práctica.</div>';
    if($('areas-box')) $('areas-box').innerHTML = aHtml;
    if($('nextprep-box')) $('nextprep-box').textContent = areas.length
      ? 'Repasa los puntos marcados arriba y repite con un vino del mismo tipo para afianzar el criterio.'
      : 'Excelente coherencia. Prueba un vino de mayor dificultad para seguir progresando.';
    var rows = '';
    PHASES.forEach(function(p){
      resolveDecisions(p).forEach(function(dn){
        if(S.answers[dn]) rows += '<div class="summary-li"><span>'+DEC_TITLE[dn]+'</span><span>'+S.answers[dn].label+'</span></div>';
      });
    });
    $('summary-box').innerHTML = rows || '<p class="muted">Sin decisiones registradas.</p>';
    loadRecommend();
    loadRevealHeader();
    animateSummaryReveal();
  }
  // SAT-UX-07 reconciliación: el resumen ya tenía entrada cascada por tarjeta
  // (ux7-rise) y celebración (se-ring/se-check) — mismo vocabulario que el
  // resto del sistema. Lo único que faltaba: 1) que las tarjetas entren en
  // cascada real (antes entraban todas a la vez) y 2) que "Fortalezas" y
  // "Aspectos por reforzar" — el verdadero mapa de burbujas de esta página —
  // aparezcan una a una en vez de en bloque. No se toca el celebrate-ring
  // existente. Respeta prefers-reduced-motion.
  function animateSummaryReveal(){
    var root = $('screen-summary');
    if(!root) return;
    var reduce = typeof window!=='undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cascade = root.querySelectorAll('.report-hero, .card');
    var items = root.querySelectorAll('.rep-li');
    if(reduce){
      items.forEach(function(el){ el.classList.add('rli-in'); });
      return;
    }
    cascade.forEach(function(el,i){ el.style.animationDelay = (i*0.07)+'s'; });
    items.forEach(function(el,i){ setTimeout(function(){ el.classList.add('rli-in'); }, 260 + i*70); });
  }

  // ============================================================================
  // SAT-POST-UX-01 — Contratos post-cata. SOLO se cargan tras finalizar (commit).
  // Durante la cata jamás se descargan; el gate S.finished lo garantiza.
  // No se expone canonical completo, expected raw, source refs, scoring ni pass/fail.
  // ============================================================================
  var POST = { debrief:null, comparison:null, recommend:null };
  // ===== SAT-FINISH-01A: capa de presentación en español (NO altera contratos) =====
  var COUNTRY_ES={France:'Francia',Germany:'Alemania',Italy:'Italia',Spain:'España',Portugal:'Portugal',Greece:'Grecia',Austria:'Austria',USA:'Estados Unidos','United States':'Estados Unidos','New Zealand':'Nueva Zelanda','South Africa':'Sudáfrica',Argentina:'Argentina',Chile:'Chile',Australia:'Australia'};
  function countryEs(c){ return (c&&COUNTRY_ES[c])||c||''; }
  var PRIORITY_ES={high:'alta',medium:'media',low:'baja'};
  function prioEs(p){
    if(!p) return p;
    var key=String(p).toLowerCase().split(/[:.]/)[0].trim();
    return PRIORITY_ES[key]||p;
  }
  var WINE_FAMILY_ES={
    'WSET Official Sparkling Wines':'Vinos espumosos WSET',
    'WSET Official Fortified Wines':'Vinos fortificados WSET',
    'WSET Essential Still Wines':'Vinos tranquilos esenciales WSET'
  };
  function wineFamilyEs(family,wineType){
    if(WINE_FAMILY_ES[family]) return WINE_FAMILY_ES[family];
    if(!family && wineType==='ESPUMOSO') return 'Vinos espumosos';
    if(!family && wineType==='FORTIFICADO') return 'Vinos fortificados';
    return family||'';
  }
  // Traducciones editoriales completas para frases pedagógicas. Conservamos el
  // catálogo canónico intacto y normalizamos únicamente la capa visible.
  var PRESENT_ES_EXACT={
    'fresh to textured verdejo from continental rueda':'Verdejo fresco o con textura procedente de la Rueda continental',
    'verdejo oxidation sensitivity':'Sensibilidad del Verdejo a la oxidación',
    'rueda white wine identity':'Identidad de los vinos blancos de Rueda',
    'protective versus richer winemaking':'Vinificación protectora frente a estilos de elaboración más estructurados',
    'identify verdejo structure':'Identificar la estructura del Verdejo',
    'connect rueda to white wine production':'Relacionar Rueda con la producción de vinos blancos',
    'separate verdejo from sauvignon blanc':'Diferenciar Verdejo de Sauvignon Blanc',
    'rueda is a red-wine region':'Rueda es una región de vinos tintos',
    'verdejo always tastes like sauvignon blanc':'El Verdejo siempre sabe como un Sauvignon Blanc',
    'barrel fermentation means chardonnay':'La fermentación en barrica implica que es Chardonnay',
    'ask whether melon-peach high-acid fruit points to verdejo':'Preguntar si el melón, el melocotón y la alta acidez apuntan a Verdejo',
    'calling all rueda sauvignon blanc':'Identificar todo Rueda como Sauvignon Blanc',
    'forgetting verdejo minimum in blends':'Olvidar el porcentaje mínimo de Verdejo en los ensamblajes',
    'rueda is verdejo country: cool nights, melon, peach, high acidity':'Rueda es tierra de Verdejo: noches frescas, melón, melocotón y alta acidez',
    'melon and peach rather than albariño citrus-stone fruit':'Melón y melocotón, en lugar del perfil cítrico y de fruta de hueso del Albariño',
    'rueda continental rather than atlantic damp climate':'Rueda continental, en lugar de un clima atlántico húmedo',
    'possible richer barrel-fermented verdejo style':'Posible estilo de Verdejo más estructurado y fermentado en barrica',
    'overcalling sauvignon blanc':'Identificar en exceso como Sauvignon Blanc',
    'missing rueda as a white specialist':'No reconocer a Rueda como región especializada en vinos blancos',
    'herbal notes':'Notas herbáceas',
    'green apple':'Manzana verde',
    'light to medium body':'Cuerpo ligero a medio',
    'persistent bubbles':'Burbujas persistentes',
    'fine persistent mousse':'Burbuja fina y persistente',
    'autolytic complexity':'Complejidad autolítica',
    'good to very good; styles range from simple fruity to richer barrel-fermented versions':'Bueno a muy bueno; los estilos van desde afrutados sencillos hasta versiones más estructuradas fermentadas en barrica',
    'drink young to short ageing for fresh styles':'Beber joven o con una guarda corta en los estilos frescos',
    'use this as a formative mirror: identify alignment and useful next observations without exam judgement language.':'Usa esta comparación como una guía formativa: identifica coincidencias y nuevas observaciones útiles, sin lenguaje de calificación de examen.',
    'use this as a formative mirror: identify alignment, partial alignment, and useful next observations without exam judgement language.':'Usa esta comparación como una guía formativa: identifica coincidencias, coincidencias parciales y nuevas observaciones útiles, sin lenguaje de calificación de examen.',
    'compare your note against the style band rather than a single required phrase.':'Compara tu nota con el rango del estilo, no con una única frase obligatoria.',
    'nearby structural descriptors are discussion points when the overall style logic is coherent.':'Los descriptores estructurales cercanos son puntos de análisis cuando la lógica general del estilo es coherente.'
  };
  // Traductor pragmático de patrones frecuentes WSET (solo presentación de lo renderizado).
  var ES_PAIRS=[
    ['medium to pronounced','media a pronunciada'],['pale to medium lemon','limón pálido a medio'],['medium to full','media a alta'],
    ['medium-minus','media (−)'],['medium minus','media (−)'],['medium-plus','media (+)'],['medium plus','media (+)'],
    ['bone dry','completamente seco'],['off-dry','semiseco'],['off dry','semiseco'],['residual sugar','azúcar residual'],
    ['stone fruit','fruta de hueso'],['green fruit','fruta verde'],['red fruit','fruta roja'],['black fruit','fruta negra'],['dried fruit','fruta seca'],['tree fruit','fruta de árbol'],['stewed fruit','fruta cocida'],['stone or steely','mineral o acerado'],
    ['very good','muy bueno'],['high quality','alta calidad'],['ageing potential','potencial de guarda'],['bottle ageing','guarda en botella'],['bottle age','guarda en botella'],['bottle evolution','evolución en botella'],['capable of','capaz de'],['drink now','beber ahora'],['not applicable','no aplica'],
    ['in the best examples','en los mejores ejemplos'],['in best examples','en los mejores ejemplos'],['best examples','mejores ejemplos'],
    ['medium','media'],['high','alta'],['low','baja'],['pronounced','pronunciada'],['light','ligera'],['full','pronunciada'],['pale','pálido'],['deep','profundo'],['dry','seco'],['sweet','dulce'],
    ['acidity','acidez'],['tannins','taninos'],['tannin','tanino'],['body','cuerpo'],['intensity','intensidad'],['finish','final'],['flavours','sabores'],['flavour','sabor'],['flavors','sabores'],['flavor','sabor'],['palate','paladar'],
    ['citrus','cítricos'],['lemon','limón'],['lime','lima'],['grapefruit','pomelo'],['apple','manzana'],['pear','pera'],['peach','melocotón'],['apricot','albaricoque'],['cherry','cereza'],['plum','ciruela'],['honey','miel'],['blossom','flor'],['spice','especias'],['spicy','especiado'],['pepper','pimienta'],['oak','roble'],['toast','tostado'],['vanilla','vainilla'],['tobacco','tabaco'],['leather','cuero'],['herbaceous','herbáceo'],['savoury','sabroso'],['earthy','terroso'],['stony','mineral'],['steely','acerado'],
    ['barrel-fermented','fermentado en barrica'],['red-wine','vino tinto'],['white wine','vino blanco'],['high-acid','de alta acidez'],
    ['identify','identificar'],['connect','relacionar'],['separate','diferenciar'],['distinguish','distinguir'],['recognize','reconocer'],['calling','identificar'],['forgetting','olvidar'],['missing','no reconocer'],['confusing','confundir'],['assuming','suponer'],['ask','preguntar'],['whether','si'],['means','implica'],['always','siempre'],
    ['winemaking','vinificación'],['fermentation','fermentación'],['structure','estructura'],['markers','marcadores'],['identity','identidad'],['region','región'],['climate','clima'],['grape','uva'],['variety','variedad'],['blends','ensamblajes'],['blend','ensamblaje'],['notes','notas'],['method','método'],['profile','perfil'],['range','rango'],['versions','versiones'],['simple','sencillo'],['richer','más estructurado'],['protective','protectora'],['specialist','especializada'],['minimum','porcentaje mínimo'],['production','producción'],['sensitivity','sensibilidad'],['oxidation','oxidación'],['damp','húmedo'],['atlantic','atlántico'],['herbal','herbáceo'],
    ['ripe','maduro'],['fresh','fresco'],['young','joven'],['firm','firme'],['concentrated','concentrado'],['concentration','concentración'],['balance','equilibrio'],['length','longitud'],['complexity','complejidad'],['quality','calidad'],['character','carácter'],
    ['outstanding','excelente'],['good','bueno'],['acceptable','aceptable'],['poor','pobre'],
    ['ageing','guarda'],['evolve','evolucionar'],['evolution','evolución'],
    ['ruby','rubí'],['garnet','granate'],['purple','púrpura'],['amber','ámbar'],['golden','dorado'],['gold','dorado'],['green','verde'],['red','roja'],['white','blanco'],
    ['fruit','fruta'],['styles','estilos'],['style','estilo'],['examples','ejemplos'],
    [' to ',' a '],[' and ',' y '],[' or ',' o '],[' with ',' con '],[' very ',' muy '],[' not ',' no '],[' for ',' para '],[' than ',' que '],[' more ',' más '],[' less ',' menos '],[' can ',' puede '],[' possible',' posible'],[' shown by',' mostrada por']
  ];
  var ES_DICT=ES_PAIRS.map(function(p){
    var en=p[0], esc=en.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
    var rx=(/^\s|\s$/.test(en))? new RegExp(esc,'gi') : new RegExp('\\b'+esc+'\\b','gi');
    return [rx,p[1]];
  });
  function presentEs(t){
    if(t==null) return t;
    var s=String(t), exact=PRESENT_ES_EXACT[s.trim().toLowerCase()];
    if(exact) return exact;
    for(var i=0;i<ES_DICT.length;i++) s=s.replace(ES_DICT[i][0],ES_DICT[i][1]);
    return s;
  }

  // Si una frase canónica aún conserva vocabulario inglés después de traducirla,
  // no mostramos una mezcla. La sección usa una orientación editorial española.
  var ENGLISH_RESIDUE=/\b(the|is|are|was|were|as|from|with|without|all|every|when|before|after|rather|than|only|plus|wine|wines|style|styles|method|traditional|reserve|blending|lees|autolysis|autolytic|dosage|benchmark|sparkling|vintage|official|essential|tasting|explain|consistency|solely|enough|higher|lower|chalky|cool|tension|fine|persistent|mousse|house|origin|character|judging|dryness|world|fruited|versions|points|toward|depends|because|usually|ready|early|drinking|develop|complex|flavours|aromas|fruit|acid|bodied|barrel|aged|oak|quality|good|outstanding|ageing|drink|young)\b/i;
  function cleanPresented(t){
    var s=presentEs(t);
    return s && !ENGLISH_RESIDUE.test(s) ? s : '';
  }

  function escP(x){ return String(x==null?'':x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function ppList(arr){ if(!arr||!arr.length) return ''; return arr.map(function(x){ return '<div class="pp-li">'+escP(presentEs(x))+'</div>'; }).join(''); }
  function ppListClean(arr,fallback){
    var clean=(arr||[]).map(cleanPresented).filter(Boolean);
    if(!clean.length && fallback) clean=Array.isArray(fallback)?fallback:[fallback];
    return clean.map(function(x){ return '<div class="pp-li">'+escP(x)+'</div>'; }).join('');
  }
  function uniqP(a){ var seen={},o=[]; (a||[]).forEach(function(x){ if(x&&!seen[x]){ seen[x]=1; o.push(x); } }); return o; }
  function fetchPost(file, key){
    if(!S.finished) return Promise.reject(new Error('Contrato post-cata bloqueado antes de finalizar.'));
    if(POST[key]) return Promise.resolve(POST[key]);
    return Promise.reject(new Error('Contenido post-cata no disponible para esta práctica.'));
  }

  // ---- Ver Debrief ----
  function toggleDebrief(){
    var p=$('debrief-panel'); if(!p) return;
    if(p.style.display!=='none' && p.innerHTML){ p.style.display='none'; return; }
    p.style.display='block'; p.innerHTML='<span class="spin"></span>';
    fetchPost('post_tasting_debrief.json','debrief').then(function(j){
      var d=j;
      p.innerHTML = d ? renderDebrief(d) : '<p class="muted">Debrief no disponible para esta práctica.</p>';
    }).catch(function(e){ p.innerHTML='<p class="err">'+escP(e.message||e)+'</p>'; });
  }
  function renderDebrief(d){
    var si=d.safe_identity||{}, dna=d.pedagogical_dna||{}, tn=d.teaching_notes||{}, ce=d.comparison_engine||{};
    function chip(v,cls){ return v?('<span class="sat-hb '+(cls||'')+'">'+escP(v)+'</span>'):''; }
    var rev=chip(wineFamilyEs(si.wine_family,si.wine_type))+chip(countryEs(si.country))+chip(si.region);
    if(si.appellation) rev+=chip(si.appellation);
    (si.grape_varieties||[]).forEach(function(g){ rev+=chip(g,'type'); });
    var styleEs=cleanPresented(si.wine_style);
    var why=(si.wset_importance==='CORE'?'Estilo núcleo del examen WSET. ':'')+(tn.revision_priority?('Prioridad de repaso: '+escP(prioEs(tn.revision_priority))+'. '):'')+(styleEs?escP(styleEs):'Practica la identificación de este estilo y su diferenciación frente a perfiles similares.');
    var traps=uniqP([].concat(dna.typical_misconceptions||[], d.exam_traps||[], tn.student_traps||[]));
    var sim=uniqP([].concat(dna.comparison_styles||[]));
    var h='<h3 style="margin:0 0 4px;font-size:17px">Debrief — '+escP(si.display_name||'Vino')+'</h3>';
    if(rev) h+='<div class="pp-reveal">'+rev+'</div>';
    if(why) h+='<div class="pp-sec"><h4>Por qué importa este estilo</h4><div class="pp-li" style="padding-left:0">'+why+'</div></div>';
    if(dna.core_concepts&&dna.core_concepts.length) h+='<div class="pp-sec"><h4>Conceptos clave</h4>'+ppListClean(dna.core_concepts,['Estructura sensorial característica del estilo.','Relación entre origen, variedades y método de elaboración.','Marcadores que permiten diferenciarlo de estilos cercanos.'])+'</div>';
    if(dna.learning_objectives&&dna.learning_objectives.length) h+='<div class="pp-sec"><h4>Objetivos de aprendizaje</h4>'+ppListClean(dna.learning_objectives,['Reconocer la estructura característica del estilo.','Relacionar las observaciones con el origen y la elaboración.','Distinguirlo de perfiles que pueden resultar similares.'])+'</div>';
    if(traps.length) h+='<div class="pp-sec"><h4>Trampas frecuentes</h4>'+ppListClean(traps,['No concluir la identidad a partir de un solo descriptor.','Confirmar la estructura completa antes de identificar el estilo.'])+'</div>';
    if(d.memory_hooks&&d.memory_hooks.length) h+='<div class="pp-sec"><h4>Anclas de memoria</h4>'+ppListClean(d.memory_hooks,'Recuerda el conjunto: estructura, intensidad, aromas y método de elaboración.')+'</div>';
    if(d.mentor_focus&&d.mentor_focus.length) h+='<div class="pp-sec"><h4>Enfoque del mentor</h4>'+ppListClean(d.mentor_focus,'Sustenta cada conclusión con evidencia sensorial observada.')+'</div>';
    var simBlock=ppListClean(sim)+ppListClean(ce.distinguishing_features);
    if(!simBlock) simBlock=ppListClean([],'Compara este vino con estilos de estructura y elaboración semejantes.');
    if(simBlock) h+='<div class="pp-sec"><h4>Estilos similares o confundibles</h4>'+simBlock+'</div>';
    var review=uniqP([].concat(tn.student_traps||[], d.exam_traps||[]));
    if(review.length) h+='<div class="pp-sec"><h4>Qué deberías revisar</h4>'+ppListClean(review,'Revisa la coherencia entre tus observaciones y la identidad propuesta.')+'</div>';
    return h;
  }

  // ---- Comparación con el modelo (tono formativo, nunca correcto/incorrecto) ----
  var CMP_SCALE={acidez:['baja','media_menos','media','media_más','alta'],dulzor:['seco','casi_seco','semiseco','semidulce','dulce','muy_dulce'],cuerpo:['poco','medio_menos','medio','medio_más','mucho'],alcohol:['bajo','medio','alto'],tanino:['bajo','medio_menos','medio','medio_más','alto']};
  var CMP_BAND_ATTR={dulzor:'sweetness',acidez:'acidity',cuerpo:'body',alcohol:'alcohol',tanino:'tannin'};
  function cmpBandRange(dn,text){
    text=(text||'').toLowerCase(); var idx=[];
    function add(i){ idx.push(i); }
    if(dn==='acidez'||dn==='tanino'){
      if(/\blow\b/.test(text)) add(0);
      if(/medium[\s-]*minus/.test(text)) add(1);
      if(/\bmedium\b/.test(text)) add(2);
      if(/medium[\s-]*plus/.test(text)) add(3);
      if(/\bhigh\b/.test(text)) add(4);
    } else if(dn==='cuerpo'){
      if(/\blight\b|\blow\b/.test(text)) add(0);
      if(/\bmedium\b/.test(text)) add(2);
      if(/\bfull\b/.test(text)) add(4);
    } else if(dn==='alcohol'){
      if(/\blow\b/.test(text)) add(0);
      if(/\bmedium\b/.test(text)) add(1);
      if(/\bhigh\b/.test(text)) add(2);
    } else if(dn==='dulzor'){
      if(/\bdry\b/.test(text)) add(0);
      if(/off[\s-]*dry|medium[\s-]*dry/.test(text)) add(1);
      if(/residual sugar|some sweetness/.test(text)) add(2);
      if(/semi|medium[\s-]*sweet/.test(text)) add(3);
      if(/\bsweet\b/.test(text)) add(4);
    }
    if(!idx.length) return null;
    return [Math.min.apply(null,idx), Math.max.apply(null,idx)];
  }
  function cmpTone(dn,val,text){
    var sc=CMP_SCALE[dn]; if(!sc) return null;
    var si=sc.indexOf(val); if(si<0) return null;
    var r=cmpBandRange(dn,text); if(!r) return null;
    var dist = si<r[0]? r[0]-si : (si>r[1]? si-r[1] : 0);
    if(dist===0) return {t:'Coincide',cls:'ok'};
    if(dist===1) return {t:'Cerca',cls:'near'};
    if(dist===2) return {t:'Revisar',cls:'warn'};
    return {t:'Posible contradicción',cls:'block'};
  }
  function toggleCompare(){
    var p=$('compare-panel'); if(!p) return;
    if(p.style.display!=='none' && p.innerHTML){ p.style.display='none'; return; }
    p.style.display='block'; p.innerHTML='<span class="spin"></span>';
    fetchPost('post_tasting_model_comparison.json','comparison').then(function(j){
      var c=j;
      p.innerHTML = c ? renderCompare(c) : '<p class="muted">Comparación no disponible para esta práctica.</p>';
    }).catch(function(e){ p.innerHTML='<p class="err">'+escP(e.message||e)+'</p>'; });
  }
  function renderCompare(c){
    var bands=(c.descriptor_bands&&c.descriptor_bands.palate)||{};
    var tn=c.teaching_notes||{}, av=c.acceptable_variations||{};
    var h='<h3 style="margin:0 0 4px;font-size:17px">Comparación con el modelo</h3>';
    if(tn.comparison_prompt) h+='<p class="cmp-intro">'+escP(presentEs(tn.comparison_prompt))+'</p>';
    var order=['dulzor','acidez','tanino','alcohol','cuerpo'];
    var rows='';
    order.forEach(function(dn){
      var a=S.answers[dn]; if(!a) return;
      var band=bands[CMP_BAND_ATTR[dn]];
      var bandTxt = (band==null)?'—':(band==='not_applicable'?'No aplica':presentEs(String(band)));
      var tone = (band==='not_applicable')? {t:'No aplica',cls:'na'} : cmpTone(dn, a.value, String(band));
      var toneHtml = tone? '<span class="tone '+tone.cls+'">'+tone.t+'</span>' : '<span class="tone na">Referencia</span>';
      rows+='<div class="cmp-row"><span><b>'+escP(DEC_TITLE[dn])+'</b><br><span class="lab">Tú: '+escP(a.label)+'</span></span>'
          + '<span class="lab">Modelo: '+escP(bandTxt)+'</span>'+toneHtml+'</div>';
    });
    if(rows) h+='<div class="pp-sec"><h4>Tu estructura vs. el modelo</h4>'+rows+'</div>';
    var mr=c.model_reference||{};
    var refMap=[['appearance_model','Aspecto'],['nose_model','Nariz'],['palate_model','Paladar'],['quality_model','Calidad'],['ageing_consumption_model','Estado / Guarda']];
    var ref='';
    var refFallback={
      appearance_model:'Revisa el color, la intensidad y la claridad característicos del estilo.',
      nose_model:'Revisa la intensidad aromática y las familias de aromas dominantes.',
      palate_model:'Contrasta dulzor, acidez, alcohol, cuerpo e intensidad.',
      quality_model:'Evalúa equilibrio, intensidad, complejidad y longitud.',
      ageing_consumption_model:'Relaciona estructura y evolución con el momento de consumo y el potencial de guarda.'
    };
    refMap.forEach(function(pair){ var arr=mr[pair[0]]; if(arr&&arr.length){ ref+='<div class="pp-sec"><h4>'+pair[1]+' — referencia del modelo</h4>'+ppListClean(arr,refFallback[pair[0]])+'</div>'; } });
    if(ref) h+=ref;
    if(av.style_tolerance&&av.style_tolerance.length) h+='<div class="pp-sec"><h4>Cómo leer esta comparación</h4>'+ppListClean(av.style_tolerance,'Interpreta el modelo como un rango formativo, no como una única frase obligatoria.')+'</div>';
    return h;
  }

  // ---- Siguiente práctica recomendada ----
  function loadRecommend(){
    var box=$('recommend-box'); if(!box) return; box.innerHTML='';
    fetchPost('next_practice_recommendations.json','recommend').then(function(j){
      var r=j; if(!r||!r.recommended_next||!r.recommended_next.length){ box.innerHTML=''; return; }
      var nextId=r.recommended_next[0];
      var h='<div class="pp-sec" style="margin:6px 0 0"><h4>Siguiente práctica recomendada</h4>';
      if(r.reason) h+='<div class="pp-li" style="padding-left:0">'+escP(presentEs(r.reason))+'</div>';
      h+='<button class="btn" id="btn-start-rec" data-id="'+escP(nextId)+'" style="margin-top:10px">Iniciar práctica recomendada</button></div>';
      box.innerHTML=h;
      var b=$('btn-start-rec'); if(b) b.addEventListener('click', function(){ startRecommended(b.getAttribute('data-id')); });
    }).catch(function(){ box.innerHTML=''; });
  }
  // Revela la identidad real en el resumen. Guiada: desde training (ya revelado). Ciegas: desde debrief tras finalizar.
  function revealHeaderFrom(si){
    if(!si) return;
    if($('report-title')) $('report-title').textContent = si.display_name || 'Tu cata';
    if($('summary-msg')) $('summary-msg').textContent = 'Registraste '+S.decisionsCount+' decisiones a lo largo de las 5 fases del SAT con '+(si.display_name||'tu vino')+'.';
    if($('report-badges')){
      var rb='';
      if(si.wine_type) rb+='<span class="sat-hb type">'+escP(si.wine_type)+'</span>';
      if(si.country) rb+='<span class="sat-hb">'+escP(countryEs(si.country))+'</span>';
      if(si.region) rb+='<span class="sat-hb">'+escP(si.region)+'</span>';
      if(si.appellation && si.appellation!==si.region) rb+='<span class="sat-hb">'+escP(si.appellation)+'</span>';
      (si.grape_varieties||[]).forEach(function(g){ rb+='<span class="sat-hb type">'+escP(g)+'</span>'; });
      // rb+='<span class="sat-hb wset">'+WSET_LEVEL+'</span>';
      $('report-badges').innerHTML=rb;
    }
  }
  function loadRevealHeader(){
    if(S.mode==='guided'){
      var tp=resolveTrainingProfile(S.wine.id);
      revealHeaderFrom(tp&&tp.identity);
      return;
    }
    fetchPost('post_tasting_debrief.json','debrief').then(function(j){
      var d=j; revealHeaderFrom(d&&d.safe_identity);
    }).catch(function(){});
  }

  function startRecommended(id){
    var b=$('btn-start-rec'); if(b){ b.disabled=true; b.textContent='Cargando…'; }
    fetchPracticeWine('blind_simulation', id).then(function(w){
      previewWine=w;
      try{ renderCardForWine(w); }catch(e){}
      requestEntry();
    }).catch(function(){ if(b){ b.disabled=false; b.textContent='Iniciar práctica recomendada'; } });
  }


  // La tarjeta usa el único perfil seguro entregado por el backend. El catálogo
  // completo y el contenido post-cata no se publican como archivos estáticos.
  var previewWine = null;     // vino preseleccionado (reusado por la practica)

  function blindDiffLabel(band, sc){
    var m={foundation:'Fundamento',intermediate:'Intermedio',advanced:'Avanzado',expert:'Experto'};
    if(band && m[band]) return m[band];
    sc=parseInt(sc,10)||0; return sc<=2?'Iniciación':(sc<=4?'Intermedio':(sc<=6?'Avanzado':'Experto'));
  }
  var WSET_LEVEL='WSET Nivel 3';
  function importanceEs(value){
    var labels={CORE:'Núcleo del examen',HIGH:'Alta relevancia',MEDIUM:'Relevancia media',LOW:'Relevancia complementaria',ESSENTIAL:'Esencial'};
    return labels[String(value||'').toUpperCase()]||value||null;
  }
  function practiceNumberOf(wine){
    if(!wine) return null;
    var m=String(wine.id||'').match(/(\d+)\s*$/); if(m) return String(parseInt(m[1],10));
    m=String(wine.display_label||'').match(/(\d+)\s*$/); return m?m[1]:null;
  }
  function blindObjective(){
    return 'Observa, infiere y comprométete con un juicio sin pistas de identidad. Desarrolla tu razonamiento profesional.';
  }
  function blindMotivational(band){
    var m={ foundation:'Un buen punto de partida para afianzar el método paso a paso.',
            intermediate:'Un reto equilibrado para pulir tu razonamiento estructurado.',
            advanced:'Exige precisión: confía en la estructura y sostén tus inferencias.',
            expert:'Nivel de examen: máxima atención al detalle y a la coherencia.' };
    return m[band] || 'Confía en el método: cada observación construye tu conclusión.';
  }
  function mapBlindToCard(item, wine){
    var id=(item&&item.identity)||{};
    return {
      identity:{
        display_label: id.display_label || 'Práctica a ciegas',
        wine_type: id.wine_type || null,
        practice_mode: 'Cata a ciegas',
        difficulty: blindDiffLabel(id.difficulty_band, id.difficulty_score),
        difficulty_score: id.difficulty_score || null,
        importance: importanceEs(id.wset_importance),
        confidence: (typeof id.confidence_score==='number'? Math.round(id.confidence_score*100)+'%':null),
        priority: (id.practice_priority!=null? (id.practice_priority+'/5'):null),
        wset_level: WSET_LEVEL,
        practice_number: practiceNumberOf(wine),
        objective: blindObjective(),
        motivational: blindMotivational(id.difficulty_band)
      },
      glass: (item&&item.glass&&item.glass.wine_type)?{ wineType:item.glass.wine_type }:null
    };
  }
  function loadTrainingIndex(){
    return Promise.resolve(true);
  }
  function resolveTrainingProfile(wineId){
    var wine=(S.wine&&S.wine.id===wineId)?S.wine:(previewWine&&previewWine.id===wineId?previewWine:null);
    return wine&&wine.guided_identity ? {identity:wine.guided_identity} : null;
  }
  function mapTrainingToCard(item, wine){
    var id=(item&&item.identity)||{};
    return {
      identity:{
        display_label: id.display_name || id.display_label || 'Práctica guiada',
        wine_type: id.wine_type || null,
        practice_mode: 'Práctica guiada',
        difficulty: blindDiffLabel(id.difficulty_band, id.difficulty_score),
        difficulty_score: id.difficulty_score || null,
        importance: importanceEs(id.wset_importance),
        confidence: (typeof id.confidence_score==='number'? Math.round(id.confidence_score*100)+'%':null),
        priority: (id.practice_priority!=null? (id.practice_priority+'/5'):null),
        wset_level: WSET_LEVEL,
        practice_number: practiceNumberOf(wine),
        objective: 'Estudia este estilo con identidad revelada: desarrolla tus marcadores sensoriales y tu lógica de razonamiento.',
        motivational: blindMotivational(id.difficulty_band)
      },
      glass: id.wine_type?{ wineType:id.wine_type }:null,
      reveal:{ country:id.country, region:id.region, subregion:id.subregion, appellation:id.appellation, grape_varieties:id.grape_varieties||[] }
    };
  }

  function resolveBlindProfile(wineId){
    var wine=(S.wine&&S.wine.id===wineId)?S.wine:(previewWine&&previewWine.id===wineId?previewWine:null);
    if(!wine) return null;
    return {identity:{
      display_label:wine.display_label, wine_type:wine.wine_type,
      difficulty_score:wine.difficulty_score, difficulty_band:wine.difficulty_band,
      wset_importance:wine.wset_importance, practice_priority:wine.practice_priority,
      confidence_score:wine.confidence_score
    },glass:{wine_type:wine.wine_type}};
  }
  function renderCardForWine(wine){
    if(!(window.WineIntelligenceCard && $('wic-demo'))) return;
    if(!wine){ $('wic-demo').innerHTML=''; return; }
    if(S.mode==='guided'){
      var tpw=resolveTrainingProfile(wine.id);
      if(tpw){ WineIntelligenceCard.mount($('wic-demo'), mapTrainingToCard(tpw, wine)); return; }
    }
    var prof = resolveBlindProfile(wine.id);
    if(prof){ WineIntelligenceCard.mount($('wic-demo'), mapBlindToCard(prof, wine)); return; }
    var wt=wine.wine_type;
    WineIntelligenceCard.mount($('wic-demo'), {
      identity:{ display_label:'Vino '+(wt==='TINTO'?'tinto':(wt==='ROSADO'?'rosado':'blanco'))+' — práctica a ciegas',
        wine_type:wt||null, practice_mode:'Cata a ciegas' },
      glass: wt?{ wineType:wt }:null
    });
  }
  function previewPracticeWine(){
    if(!$('wic-demo')) return;
    fetchPracticeWine('blind_simulation').then(function(wine){
      previewWine = wine;
      renderCardForWine(previewWine);
    }).catch(function(){ previewWine=null; $('wic-demo').innerHTML=''; });
  }

  document.addEventListener('DOMContentLoaded', function(){
    previewPracticeWine();
    $('mode-blind').addEventListener('click', function(){ S.mode='blind'; requestEntry(); });
    var _mg=$('mode-guided'); if(_mg) _mg.addEventListener('click', function(){ S.mode='guided'; loadTrainingIndex().then(function(){ try{ renderCardForWine(previewWine); }catch(e){} requestEntry(); }); });
    $('btn-next').addEventListener('click', nextPhase);
    $('btn-prev').addEventListener('click', prevPhase);
    $('btn-restart').addEventListener('click', function(){ show('screen-intro'); $('intro-err').textContent=''; S.mode='blind'; previewWine=null; previewPracticeWine(); });
    $('btn-home').addEventListener('click', function(){ window.location.href='../index.html'; });
    var _bd=$('btn-debrief'); if(_bd) _bd.addEventListener('click', toggleDebrief);
    var _bc=$('btn-compare'); if(_bc) _bc.addEventListener('click', toggleCompare);
    var _bp=$('btn-print'); if(_bp) _bp.addEventListener('click', function(){ window.print(); });
  });
})();
