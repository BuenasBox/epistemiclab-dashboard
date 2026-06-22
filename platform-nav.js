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
    { href: '/dashboard/', label: 'Dashboard', match: ['/dashboard'] },
    { href: '/bottle-lab/', label: 'Practicar', match: ['/bottle-lab', '/label-lab', '/sat-lab', '/adaptive-review'] },
    { href: '/full-simulation-v2/', label: 'Evaluar', match: ['/full-simulation-v2', '/diagnostic-sba', '/open-response-lab', '/adaptive-session'] },
    { href: '/mentor/', label: 'Progreso', match: ['/mentor', '/learning-loop', '/profile'] },
    { href: '/login/', label: 'Cuenta', match: ['/login', '/upgrade'] }
  ];

  var MENU = [
    { label: 'Inicio', href: '/' },
    { label: 'Practicar', submenu: [
      { label: 'Bottle Guided', href: '/bottle-lab/' },
      { label: 'Label Guided', href: '/label-lab/' },
      { label: 'SAT Lab', href: '/sat-lab/' },
      { label: 'Adaptive Review', href: '/adaptive-review/' }
    ]},
    { label: 'Evaluar', submenu: [
      { label: 'Full Simulation', href: '/full-simulation-v2/' },
      { label: 'Diagnostic SBA', href: '/diagnostic-sba/' },
      { label: 'Open Response', href: '/open-response-lab/' },
      { label: 'Adaptive Session', href: '/adaptive-session/' }
    ]},
    { label: 'Progreso', submenu: [
      { label: 'Dashboard', href: '/dashboard/' },
      { label: 'Mentor', href: '/mentor/' },
      { label: 'Learning Loop', href: '/learning-loop/' },
      { label: 'Mi perfil', href: '/profile/' }
    ]},
    { label: 'Cuenta', submenu: [
      { label: 'Crear cuenta', href: '/login/' },
      { label: 'Mejorar plan', href: '/upgrade/' }
    ]},
    { label: 'Admin', href: '/admin/', admin: true }
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

    var menuBtn = '<button class="pnav-menu-btn" id="pnav-menu-btn" aria-label="Menú">☰</button>';
    var menu = '<div class="pnav-menu" id="pnav-menu" style="display:none">' +
      MENU.map(function (item) {
        if (item.submenu) {
          return '<div class="pnav-menu-group">' +
            '<div class="pnav-menu-label">' + item.label + '</div>' +
            item.submenu.map(function (sub) {
              return '<a class="pnav-menu-item" href="' + sub.href + '">' + sub.label + '</a>';
            }).join('') +
            '</div>';
        } else {
          var cls = item.admin ? ' style="opacity:.6"' : '';
          return '<a class="pnav-menu-item"' + cls + ' href="' + item.href + '">' + item.label + '</a>';
        }
      }).join('') +
      '</div>';

    nav.innerHTML = brand + links + menuBtn + menu;

    var menuBtn = nav.querySelector('#pnav-menu-btn');
    var menu = nav.querySelector('#pnav-menu');
    if (menuBtn && menu) {
      menuBtn.onclick = function () {
        var isHidden = menu.style.display === 'none';
        menu.style.display = isHidden ? 'block' : 'none';
        menuBtn.setAttribute('aria-expanded', isHidden);
      };
      document.addEventListener('click', function (e) {
        if (e.target !== menuBtn && !menu.contains(e.target)) {
          menu.style.display = 'none';
          menuBtn.setAttribute('aria-expanded', 'false');
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
      f.innerHTML = '<div class="pfoot-content"><span class="pfoot-gov">Práctica formativa · No es evaluación oficial WSET</span><div class="pfoot-links"><a href="/dashboard/">Dashboard</a><a href="/login/">Cuenta</a><a href="/profile/">Perfil</a><a href="/upgrade/">Mejorar plan</a></div></div>';
      document.body.appendChild(f);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
