/* EpistemicLab — sistema de navegación ÚNICO (header + footer compartidos).
 * Una sola fuente para toda la plataforma. Adopción con una línea:
 *   <script src="/platform-nav.js" defer></script>
 * Rutas absolutas (funciona desde cualquier profundidad). Inyecta header al inicio
 * del <body> y footer al final. <body data-nav="bare"> omite el header (modo examen). */
(function () {
  'use strict';
  if (typeof document === 'undefined') return;

  var LINKS = [
    { href: '/', label: 'Inicio', match: ['/', '/index.html'] },
    { href: '/about/', label: '¿Qué es EpistemicLab?', match: ['/about'] },
    { href: '/dashboard/', label: 'Mi progreso', match: ['/dashboard'] },
    { href: '/sat-lab/', label: 'Aprender', match: ['/bottle-lab', '/label-lab', '/sat-lab', '/adaptive-review'] },
    { href: '/full-simulation-v2/', label: 'Evaluarte', match: ['/full-simulation-v2', '/diagnostic-sba', '/open-response-lab', '/adaptive-session'] },
    { href: '/mentor/', label: 'Mi aprendizaje', match: ['/mentor', '/learning-loop', '/profile'] },
    { href: '/login/', label: 'Mi cuenta', match: ['/login', '/upgrade'] }
  ];

  var MENU = [
    { label: 'Inicio', submenu: [
      { label: 'Inicio', href: '/' },
      { label: '¿Qué es EpistemicLab?', href: '/about/' }
    ]},
    { label: 'Aprender', submenu: [
      { label: 'Laboratorio SAT', href: '/sat-lab/' },
      { label: 'Plan de Refuerzo', href: '/adaptive-review/' }
    ]},
    { label: 'Evaluarte', submenu: [
      { label: 'Evaluación Teórica', href: '/diagnostic-sba/' },
      { label: 'Respuesta Abierta', href: '/open-response-lab/' },
      { label: 'Entrenamiento Adaptativo', href: '/adaptive-session/' },
      { label: 'Simulacro Completo', href: '/full-simulation-v2/' }
    ]},
    { label: 'Experiencias complementarias', submenu: [
      { label: 'Botellas', href: '/bottle-lab/' },
      { label: 'Etiquetas', href: '/label-lab/' }
    ]},
    { label: 'Mi aprendizaje', submenu: [
      { label: 'Mi progreso', href: '/dashboard/' },
      { label: 'Mentor', href: '/mentor/' },
      { label: 'Plan de aprendizaje', href: '/learning-loop/' },
      { label: 'Mi perfil', href: '/profile/' }
    ]},
    { label: 'Mi cuenta', submenu: [
      { label: 'Iniciar sesión', href: '/login/' },
      { label: 'Crear cuenta', href: '/login/' },
      { label: 'Mi perfil', href: '/profile/' },
      { label: 'Planes', href: '/upgrade/' }
    ]}
  ];

  function isActive(link) {
    var p = location.pathname.replace(/\/index\.html$/, '/');
    if (link.href === '/') return p === '/' || p === '';
    return link.match.some(function (m) { return p.indexOf(m) === 0; });
  }

  function buildNav() {
    var nav = document.createElement('nav');
    nav.id = 'pnav';

    var brand = '<a class="pnav-brand" href="/"><span class="pnav-dot"></span> EpistemicLab</a>';
    var links = '<div class="pnav-links">' +
      LINKS.map(function (l) {
        return '<a class="pnav-link' + (isActive(l) ? ' active' : '') + '" href="' + l.href + '">' + l.label + '</a>';
      }).join('') +
      '</div>';

    var menuBtn = '<button type="button" class="pnav-menu-btn" id="pnav-menu-btn" aria-label="Menú" aria-controls="pnav-menu" aria-expanded="false"><span class="ep-icon ep-icon--menu" aria-hidden="true"></span><span class="ep-sr-only">Menú</span></button>';
    var menu = '<div class="pnav-menu" id="pnav-menu" hidden>' +
      MENU.map(function (item) {
        if (item.submenu) {
          return '<div class="pnav-menu-group">' +
            '<div class="pnav-menu-label">' + item.label + '</div>' +
            item.submenu.map(function (sub) {
              return '<a class="pnav-menu-item" href="' + sub.href + '">' + sub.label + '</a>';
            }).join('') +
            '</div>';
        } else {
          var cls = item.admin ? ' pnav-menu-item--muted' : '';
          return '<a class="pnav-menu-item' + cls + '" href="' + item.href + '">' + item.label + '</a>';
        }
      }).join('') +
      '</div>';

    nav.innerHTML = brand + links + menuBtn + menu;

    var menuButton = nav.querySelector('#pnav-menu-btn');
    var menuPanel = nav.querySelector('#pnav-menu');
    if (menuButton && menuPanel) {
      menuButton.onclick = function () {
        menuPanel.hidden = !menuPanel.hidden;
        menuButton.setAttribute('aria-expanded', String(!menuPanel.hidden));
        var icon = menuButton.querySelector('.ep-icon');
        if (icon) icon.className = 'ep-icon ep-icon--' + (menuPanel.hidden ? 'menu' : 'close');
      };
      document.addEventListener('click', function (e) {
        if (e.target !== menuButton && !menuPanel.contains(e.target)) {
          menuPanel.hidden = true;
          menuButton.setAttribute('aria-expanded', 'false');
          var icon = menuButton.querySelector('.ep-icon');
          if (icon) icon.className = 'ep-icon ep-icon--menu';
        }
      });
    }

    return nav;
  }

  function build() {
    var bare = document.body.getAttribute('data-nav') === 'bare';
    if (!bare && !document.getElementById('pnav')) {
      var nav = buildNav();
      document.body.insertBefore(nav, document.body.firstChild);
    }
    if (!document.getElementById('pfoot')) {
      var f = document.createElement('footer');
      f.id = 'pfoot';
      f.innerHTML = '<div class="pfoot-content">' +
        '<div class="pfoot-header">' +
          '<div class="pfoot-brand"><span class="pfoot-dot"></span> EpistemicLab</div>' +
          '<p class="pfoot-tagline">Una plataforma diseñada para desarrollar criterio, razonamiento y capacidad de análisis en el estudio profesional del vino.</p>' +
        '</div>' +
        '<div class="pfoot-nav">' +
          '<div class="pfoot-col"><div class="pfoot-col-title">Plataforma</div><div class="pfoot-links"><a href="/">Inicio</a><a href="/about/">Acerca</a><a href="/dashboard/">Mi progreso</a></div></div>' +
          '<div class="pfoot-col pfoot-col-exp"><div class="pfoot-col-title">Experiencias</div><div class="pfoot-links"><a href="/diagnostic-sba/">Evaluación</a><a href="/adaptive-session/">Adaptativo</a></div></div>' +
          '<div class="pfoot-col"><div class="pfoot-col-title">Cuenta</div><div class="pfoot-links"><a href="/profile/">Mi perfil</a><a href="/upgrade/">Planes</a></div></div>' +
        '</div>' +
        '<p class="pfoot-copy">© 2026 EpistemicLab<br>Todos los derechos reservados.</p>' +
        '</div>';
      document.body.appendChild(f);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
