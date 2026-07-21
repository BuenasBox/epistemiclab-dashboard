/* ============================================================================
   SATWineGlass — copa de cata dinámica y realista. SVG puro + CSS.
   Sin librerías, sin imágenes.
   API (sin cambios de contrato):
     var g = SATWineGlass.mount(containerEl);  -> { update(state), destroy(), el }
     SATWineGlass.render(state)  -> string SVG (degradación / SSR / informes)
   El estado SOLO refleja lo declarado por el estudiante:
     { wineType, clarity, colour, intensity, evolution, alcohol, body, bubbles,
       aroma:{active, intensity}, fill }   // fill 0..1 opcional (nivel de llenado)
   Nunca recibe canonical / expected / country / region / grape / producer / vintage.
   El líquido sigue EXACTAMENTE la geometría interior del cáliz (curva de Bézier),
   con menisco elíptico: nunca un rectángulo.
   ============================================================================ */
(function (root) {
  'use strict';

  /* ---- Paleta de color declarada (token -> hex) ---- */
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
    if (state.wineType === 'TINTO') return '#8d1c30';
    if (state.wineType === 'ROSADO') return '#f0a8b8';
    if (state.wineType === 'BLANCO') return '#ecd24f';
    return '#9c6b86';
  }
  var INTENSITY = { 'pálida':0.55,'palida':0.55,'media_menos':0.68,'media':0.82,'media_más':0.91,'media_mas':0.91,'profunda':0.98 };
  function intensityFor(state){ return (state.intensity && INTENSITY[state.intensity] != null) ? INTENSITY[state.intensity] : 0.8; }
  var BODY = { 'poco':0.12,'medio_menos':0.3,'media_menos':0.3,'medio':0.5,'medio_más':0.7,'medio_mas':0.7,'mucho':0.92 };
  function bodyFor(state){ return (state.body && BODY[state.body] != null) ? BODY[state.body] : 0; }
  function legsFor(state){ if(state.alcohol==='alto') return 6; if(state.alcohol==='medio') return 4; if(state.alcohol==='bajo') return 2; return 0; }

  /* ---- Etiquetas humanas para aria (solo lo declarado) ---- */
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
    if (state.aroma && state.aroma.active) parts.push('aromas en evaluación');
    parts.push('Representa lo que declaraste, no la respuesta correcta.');
    return parts.join('. ');
  }

  /* ============================================================================
     GEOMETRÍA INTERIOR DEL CÁLIZ
     Borde derecho interior = Bézier cuadrática P0(90,22) P1(96,72) P2(60,106).
     y(t) = -16 t^2 + 100 t + 22   ->  16 t^2 - 100 t + (y-22) = 0
     x(t) =  -42 t^2 + 12 t + 90
     El borde izquierdo es el espejo en x=60. El líquido se recorta a esta curva,
     por lo que JAMÁS aparece un rectángulo: los costados siguen la pared del cáliz.
     ============================================================================ */
  var Y_EMPTY = 106, Y_FULL = 44;       // nivel de líquido según fill 0..1
  function levelY(fill){ fill = Math.max(0, Math.min(1, fill)); return Y_EMPTY - fill * (Y_EMPTY - Y_FULL); }
  function tForY(y){
    var a=16, b=-100, c=(y-22), disc=b*b-4*a*c; if(disc<0) disc=0;
    var t=(-b - Math.sqrt(disc))/(2*a);
    return Math.max(0, Math.min(1, t));
  }
  function xRightForY(y){ var t=tForY(y); return (-42*t*t + 12*t + 90); }
  function halfWidthAt(y){ return xRightForY(y) - 60; }

  // Trazo del líquido (sigue la pared interior + cierre por menisco)
  function liquidPath(fill){
    if (fill <= 0) return '';
    var y = levelY(fill), t = tForY(y);
    var xR = (-42*t*t + 12*t + 90), xL = 120 - xR;
    // controles del subtramo inferior (división De Casteljau en t)
    var By = 72 + 34*t, BRx = 96 - 36*t, BLx = 24 + 36*t;
    return 'M'+xL.toFixed(2)+','+y.toFixed(2)
         + ' Q'+BLx.toFixed(2)+','+By.toFixed(2)+' 60,106'
         + ' Q'+BRx.toFixed(2)+','+By.toFixed(2)+' '+xR.toFixed(2)+','+y.toFixed(2)+' Z';
  }

  var INTERIOR_PATH = 'M30,22 Q24,72 60,106 Q96,72 90,22 Z';

  /* ---- SVG base: cristal estático + capas dinámicas (id) ---- */
  function svgMarkup(){
    var bubbles = '';
    var bx = [50,56,62,68,74,58,66], by=[100,96,102,98,101,93,99];
    for (var b=0;b<bx.length;b++){
      bubbles += '<circle class="swg-bubble" cx="'+bx[b]+'" cy="'+by[b]+'" r="'+(0.8+(b%3)*0.4)+'" fill="#ffffff" opacity="0.9"/>';
    }
    var aroma = '';
    var ax=[48,60,72];
    for (var k=0;k<3;k++){
      aroma += '<path class="swg-wave" d="M'+ax[k]+',14 q5,-7 0,-13 q-5,-6 0,-12" fill="none" stroke="#e7d6e1" stroke-width="1.5" stroke-linecap="round"/>';
    }
    return ''
    + '<svg class="swg-svg" viewBox="0 0 120 205" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">'
    +   '<defs>'
    +     '<clipPath id="swg-liquidclip"><path id="swg-clip-d" d=""/></clipPath>'
    +     '<clipPath id="swg-interiorclip"><path d="'+INTERIOR_PATH+'"/></clipPath>'
    +     '<linearGradient id="swg-dens" x1="0" y1="0" x2="0" y2="1">'
    +       '<stop offset="0%" stop-color="#000" stop-opacity="0"/>'
    +       '<stop offset="100%" stop-color="#000" stop-opacity="0.55"/>'
    +     '</linearGradient>'
    +     '<linearGradient id="swg-sheen" x1="0" y1="0" x2="1" y2="1">'
    +       '<stop offset="0%" stop-color="#fff" stop-opacity="0.18"/>'
    +       '<stop offset="35%" stop-color="#fff" stop-opacity="0"/>'
    +     '</linearGradient>'
    +     '<filter id="swg-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.7"/></filter>'
    +   '</defs>'
    // Vidrio (relleno tenue del cáliz interior, da volumen)
    +   '<path d="'+INTERIOR_PATH+'" fill="url(#swg-sheen)"/>'
    // Capa LÍQUIDO (recortada a la forma del propio líquido)
    +   '<g clip-path="url(#swg-liquidclip)">'
    +     '<path class="swg-wine" id="swg-wine" d="" fill="#9c6b86" opacity="0.8"/>'
    +     '<path class="swg-density" id="swg-density" d="" fill="url(#swg-dens)" opacity="0"/>'
    +     '<ellipse class="swg-haze" id="swg-haze" cx="60" cy="80" rx="26" ry="14" fill="#efe9ee" filter="url(#swg-blur)"/>'
    +     '<g class="swg-bubbles" id="swg-bubbles">' + bubbles + '</g>'
    +   '</g>'
    // Menisco (superficie del vino) — NO recortado, da el efecto de copa real
    +   '<ellipse class="swg-surface" id="swg-surface" cx="60" cy="80" rx="0" ry="3.2" fill="#ffffff" opacity="0.16"/>'
    +   '<path class="swg-surface-rim" id="swg-surface-rim" d="" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.22"/>'
    // Lágrimas / piernas (en la pared interior, por encima del vino)
    +   '<g class="swg-tears" id="swg-tears" clip-path="url(#swg-interiorclip)"></g>'
    // Cristal (contorno) por encima de todo
    +   '<g class="swg-crystal" fill="none" stroke="#d7c6d2" stroke-width="2">'
    +     '<path d="M28,20 Q22,73 60,108 Q98,73 92,20"/>'
    +     '<ellipse cx="60" cy="20" rx="32" ry="5.2"/>'
    +     '<line x1="60" y1="108" x2="60" y2="170"/>'
    +     '<ellipse cx="60" cy="174" rx="27" ry="5.4"/>'
    +   '</g>'
    +   '<path class="swg-shine" d="M40,26 Q34,60 54,96" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.22" stroke-linecap="round"/>'
    // Ondas aromáticas
    +   '<g class="swg-aroma" id="swg-aroma">' + aroma + '</g>'
    + '</svg>';
  }

  function buildTears(rootEl, n, surfaceY){
    var g = rootEl.querySelector('#swg-tears'); if(!g) return;
    if (n<=0){ g.innerHTML=''; return; }
    var topY = Math.max(30, surfaceY - 30);     // las lágrimas nacen del borde interno
    var botY = Math.max(topY+10, surfaceY - 3); // y bajan hasta justo encima del vino
    var midY = (topY+botY)/2, hw = halfWidthAt(midY);
    var offs=[0.86,0.6,0.4], html='';
    for (var i=0;i<n;i++){
      var off = offs[Math.floor(i/2)%offs.length];
      var xpos = 60 + ((i%2)? off : -off) * hw;
      var delay = (i*0.5).toFixed(2);
      html += '<g class="swg-tear" data-swg-delay="'+delay+'">'
        + '<line x1="'+xpos.toFixed(1)+'" y1="'+topY.toFixed(1)+'" x2="'+xpos.toFixed(1)+'" y2="'+botY.toFixed(1)+'" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round" opacity="0.32"/>'
        + '<circle class="swg-tear-drop" cx="'+xpos.toFixed(1)+'" cy="'+topY.toFixed(1)+'" r="1.5" fill="#ffffff" opacity="0.8" data-swg-fall="'+(botY-topY).toFixed(1)+'"/>'
        + '</g>';
    }
    g.innerHTML = html;
    // CSP-safe: --swg-delay/--swg-fall se aplican vía CSSOM, no style="" en el markup.
    g.querySelectorAll('.swg-tear').forEach(function(el){
      el.style.setProperty('--swg-delay', el.getAttribute('data-swg-delay')+'s');
    });
    g.querySelectorAll('.swg-tear-drop').forEach(function(el){
      el.style.setProperty('--swg-fall', el.getAttribute('data-swg-fall')+'px');
    });
  }

  function applyState(rootEl, state){
    state = state || {};
    var hasWine = !!(state.wineType || state.colour);
    var fill = (typeof state.fill === 'number') ? state.fill : (hasWine ? 0.5 : 0);
    var y = levelY(fill), hw = halfWidthAt(y);
    var lp = liquidPath(fill);

    rootEl.setAttribute('role','img');
    rootEl.setAttribute('aria-label', ariaLabel(state));
    rootEl.setAttribute('data-clarity', state.clarity === 'turbio' ? 'turbio' : 'claro');
    rootEl.setAttribute('data-bubbles', state.bubbles ? 'on' : 'off');
    rootEl.setAttribute('data-empty', hasWine ? '0' : '1');
    rootEl.setAttribute('data-aroma', (state.aroma && state.aroma.active) ? 'on' : 'off');
    rootEl.setAttribute('data-aroma-strong',
      (state.aroma && (state.aroma.intensity === 'pronunciada' || state.aroma.intensity === 'media_más' || state.aroma.intensity === 'media_mas')) ? '1' : '0');

    var wine = rootEl.querySelector('#swg-wine');
    var clip = rootEl.querySelector('#swg-clip-d');
    var dens = rootEl.querySelector('#swg-density');
    var surf = rootEl.querySelector('#swg-surface');
    var srim = rootEl.querySelector('#swg-surface-rim');
    var haze = rootEl.querySelector('#swg-haze');
    if (clip) clip.setAttribute('d', lp);
    if (wine){ wine.setAttribute('d', lp); wine.setAttribute('fill', colourFor(state)); wine.setAttribute('opacity', String(intensityFor(state))); }
    if (dens){ dens.setAttribute('d', lp); dens.setAttribute('opacity', String(bodyFor(state) * 0.6)); }
    if (surf){ surf.setAttribute('cx','60'); surf.setAttribute('cy', y.toFixed(2)); surf.setAttribute('rx', Math.max(0,hw).toFixed(2)); }
    if (srim){
      // arco frontal del menisco (medio elipse inferior) para dar perspectiva
      srim.setAttribute('d', fill>0 ? ('M'+(60-hw).toFixed(2)+','+y.toFixed(2)+' A'+hw.toFixed(2)+',3.2 0 0 0 '+(60+hw).toFixed(2)+','+y.toFixed(2)) : '');
    }
    if (haze){
      var cy=(y+106)/2; haze.setAttribute('cy', cy.toFixed(2));
      haze.setAttribute('rx', Math.max(4, hw*0.82).toFixed(2));
      haze.setAttribute('ry', Math.max(4,(106-y)*0.42).toFixed(2));
    }
    buildTears(rootEl, legsFor(state), y);
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

  function render(state){
    var wrap = document.createElement('div');
    wrap.className = 'swg-root';
    wrap.innerHTML = svgMarkup();
    applyState(wrap, state || {});
    return wrap.outerHTML;
  }

  root.SATWineGlass = { mount: mount, render: render };

})(typeof window !== 'undefined' ? window : this);
