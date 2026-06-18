/* ============================================================================
   SATWineGlass — copa de cata dinámica. SVG + CSS. Sin librerías externas.
   API:
     var g = SATWineGlass.mount(containerEl);  -> { update(state), destroy(), el }
     SATWineGlass.render(state)  -> string SVG (para degradación / SSR / informes)
   El estado SOLO refleja lo declarado por el estudiante:
     { wineType, clarity, colour, intensity, evolution, alcohol, body, bubbles,
       aroma:{active, intensity} }
   Nunca recibe canonical / expected / country / region / grape / producer / vintage.
   ============================================================================ */
(function (root) {
  'use strict';

  // token de color -> hex (paleta SAT visible)
  var COLOURS = {
    'verde_limón':'#d9e07e','verde_limon':'#d9e07e',
    'amarillo_limón':'#ecd24f','amarillo_limon':'#ecd24f','limón':'#ecd24f','limon':'#ecd24f',
    'dorado':'#d6a431','ámbar':'#b9762a','ambar':'#b9762a',
    'rosado':'#f0a8b8','rosa':'#f0a8b8','salmón':'#f1a07c','salmon':'#f1a07c','naranja':'#e3853f',
    'púrpura':'#5e1c50','purpura':'#5e1c50','rubí':'#8d1c30','rubi':'#8d1c30',
    'granate':'#6b1320','teja':'#9c3a27','marrón':'#6e4326','marron':'#6e4326'
  };
  function colourFor(state){
    if (state.colour && COLOURS[state.colour]) return COLOURS[state.colour];
    // por defecto según tipo
    if (state.wineType === 'TINTO') return '#8d1c30';
    if (state.wineType === 'ROSADO') return '#f0a8b8';
    if (state.wineType === 'BLANCO') return '#ecd24f';
    return '#9c6b86';
  }
  // intensidad -> opacidad del vino
  var INTENSITY = { 'pálida':0.5,'palida':0.5,'media_menos':0.65,'media':0.8,'media_más':0.9,'media_mas':0.9,'profunda':0.97 };
  function intensityFor(state){ return (state.intensity && INTENSITY[state.intensity] != null) ? INTENSITY[state.intensity] : 0.78; }
  // cuerpo -> densidad visual 0..1
  var BODY = { 'poco':0.12,'medio_menos':0.3,'media_menos':0.3,'medio':0.5,'medio_más':0.7,'medio_mas':0.7,'mucho':0.92 };
  function bodyFor(state){ return (state.body && BODY[state.body] != null) ? BODY[state.body] : 0; }
  // alcohol -> nº de lágrimas
  function legsFor(state){ if(state.alcohol==='alto') return 6; if(state.alcohol==='medio') return 4; if(state.alcohol==='bajo') return 2; return 0; }

  // etiquetas humanas para aria (solo lo declarado)
  var WORD = {
    'verde_limón':'verde limón','amarillo_limón':'amarillo limón','dorado':'dorado','ámbar':'ámbar','marrón':'marrón',
    'rosado':'rosado','salmón':'salmón','naranja':'naranja','púrpura':'púrpura','rubí':'rubí','granate':'granate','teja':'teja',
    'pálida':'pálida','media':'media','profunda':'profunda','claro':'claro','turbio':'turbio',
    'bajo':'bajo','alto':'alto','poco':'poco','mucho':'mucho',
    'joven':'joven','en_evolución':'en evolución','evolucionado':'evolucionado','cansado':'cansado'
  };
  function w(v){ return WORD[v] || (v ? String(v).replace(/_/g,' ') : ''); }
  function typeWord(t){ return t==='TINTO'?'tinto':(t==='ROSADO'?'rosado':(t==='BLANCO'?'blanco':'')); }

  function ariaLabel(state){
    var parts = ['Copa de vino' + (typeWord(state.wineType)?(' '+typeWord(state.wineType)):'')];
    var visual = [];
    if (state.colour) visual.push('color ' + w(state.colour));
    if (state.intensity) visual.push('intensidad ' + w(state.intensity));
    if (state.clarity) visual.push(w(state.clarity));
    if (visual.length) parts.push(visual.join(', '));
    var palate = [];
    if (state.alcohol) palate.push('alcohol ' + w(state.alcohol));
    if (state.body) palate.push('cuerpo ' + w(state.body));
    if (palate.length) parts.push(palate.join(', '));
    parts.push('Representa lo que declaraste, no la respuesta correcta.');
    return parts.join('. ');
  }

  // SVG base (geometría fija, parametrizada por atributos/ids)
  function svgMarkup(){
    var legs = '';
    var xs = [40,48,56,64,72,80];
    for (var i=0;i<6;i++){
      var x = xs[i];
      legs += '<g class="swg-leg" data-leg="'+i+'">'
        + '<line x1="'+x+'" y1="46" x2="'+(x+ (x<60?1:-1))+'" y2="62" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round"/>'
        + '<circle class="swg-leg-drop" cx="'+x+'" cy="48" r="1.3" fill="#ffffff"/></g>';
    }
    var bubbles = '';
    var bx = [50,58,62,68,72];
    for (var b=0;b<5;b++){
      bubbles += '<circle class="swg-bubble" cx="'+bx[b]+'" cy="78" r="'+(1+ (b%2?0.6:0.2))+'" fill="#ffffff" opacity="0.85"/>';
    }
    return ''
    + '<svg class="swg-svg" viewBox="0 0 120 175" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">'
    +   '<defs>'
    +     '<clipPath id="swg-bowlclip"><path d="M31,19 Q31,69 60,90 Q89,69 89,19 Z"/></clipPath>'
    +     '<linearGradient id="swg-dens" x1="0" y1="0" x2="0" y2="1">'
    +       '<stop offset="0%" stop-color="#000000" stop-opacity="0"/>'
    +       '<stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>'
    +     '</linearGradient>'
    +     '<filter id="swg-blur"><feGaussianBlur stdDeviation="1.6"/></filter>'
    +   '</defs>'
    +   '<g clip-path="url(#swg-bowlclip)">'
    +     '<rect class="swg-wine" id="swg-wine" x="28" y="46" width="64" height="48" fill="#9c6b86" opacity="0.78"/>'
    +     '<ellipse class="swg-surface" id="swg-surface" cx="60" cy="46" rx="29" ry="4" fill="#ffffff" opacity="0.18"/>'
    +     '<rect class="swg-density" id="swg-density" x="28" y="46" width="64" height="48" fill="url(#swg-dens)" opacity="0"/>'
    +     '<ellipse class="swg-haze" id="swg-haze" cx="60" cy="66" rx="26" ry="20" fill="#e9e4ea" filter="url(#swg-blur)"/>'
    +     '<g id="swg-legs">' + legs + '</g>'
    +     '<g class="swg-bubbles" id="swg-bubbles">' + bubbles + '</g>'
    +   '</g>'
    +   '<path d="M30,18 Q30,70 60,92 Q90,70 90,18" fill="none" stroke="#cdbcc8" stroke-width="2"/>'
    +   '<ellipse cx="60" cy="18" rx="30" ry="5" fill="none" stroke="#cdbcc8" stroke-width="2"/>'
    +   '<rect x="58" y="92" width="4" height="46" fill="#cdbcc8"/>'
    +   '<ellipse cx="60" cy="150" rx="26" ry="5" fill="none" stroke="#cdbcc8" stroke-width="2"/>'
    +   '<path d="M44,16 Q52,30 58,52" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.25"/>'
    +   '<g class="swg-aroma" id="swg-aroma">'
    +     '<path class="swg-wave" d="M48,14 q4,-7 0,-14" fill="none" stroke="#d9c7d2" stroke-width="1.4" stroke-linecap="round"/>'
    +     '<path class="swg-wave" d="M60,12 q5,-8 0,-16" fill="none" stroke="#d9c7d2" stroke-width="1.4" stroke-linecap="round"/>'
    +     '<path class="swg-wave" d="M72,14 q4,-7 0,-14" fill="none" stroke="#d9c7d2" stroke-width="1.4" stroke-linecap="round"/>'
    +   '</g>'
    + '</svg>';
  }

  function applyState(rootEl, state){
    state = state || {};
    rootEl.setAttribute('role','img');
    rootEl.setAttribute('aria-label', ariaLabel(state));
    rootEl.setAttribute('data-clarity', state.clarity === 'turbio' ? 'turbio' : 'claro');
    rootEl.setAttribute('data-bubbles', state.bubbles ? 'on' : 'off');
    rootEl.setAttribute('data-aroma', (state.aroma && state.aroma.active) ? 'on' : 'off');
    rootEl.setAttribute('data-aroma-strong',
      (state.aroma && (state.aroma.intensity === 'pronunciada' || state.aroma.intensity === 'media_más' || state.aroma.intensity === 'media_mas')) ? '1' : '0');

    var wine = rootEl.querySelector('#swg-wine');
    if (wine){ wine.setAttribute('fill', colourFor(state)); wine.setAttribute('opacity', String(intensityFor(state))); }
    var dens = rootEl.querySelector('#swg-density');
    if (dens){ dens.setAttribute('opacity', String(bodyFor(state) * 0.55)); }
    var n = legsFor(state);
    var legGroups = rootEl.querySelectorAll('.swg-leg');
    for (var i=0;i<legGroups.length;i++){ legGroups[i].classList.toggle('on', i < n); }
  }

  function mount(container){
    if (!container) return null;
    var rootEl = document.createElement('div');
    rootEl.className = 'swg-root';
    rootEl.innerHTML = svgMarkup();
    container.innerHTML = '';
    container.appendChild(rootEl);
    applyState(rootEl, {});
    return {
      el: rootEl,
      update: function (state){ applyState(rootEl, state); },
      destroy: function (){ if (rootEl && rootEl.parentNode) rootEl.parentNode.removeChild(rootEl); }
    };
  }

  // Devuelve markup completo (degradación / informes estáticos)
  function render(state){
    var wrap = document.createElement('div');
    wrap.className = 'swg-root';
    wrap.innerHTML = svgMarkup();
    applyState(wrap, state || {});
    return wrap.outerHTML;
  }

  root.SATWineGlass = { mount: mount, render: render };
})(typeof window !== 'undefined' ? window : this);
