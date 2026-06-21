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
    { href: '/bottle-lab/', label: 'Practicar', match: ['/bottle-lab', '/label-lab', '/sat-lab'] },
    { href: '/full-simulation-v2/', label: 'Simulacro', match: ['/full-simulation-v2'] },
    { href: '/mentor/', label: 'Mentor', match: ['/mentor'] }
  ];
  function isActive(link) {
    var p = location.pathname.replace(/\/index\.html$/, '/');
    if (link.href === '/') return p === '/' || p === '';
    return link.match.some(function (m) { return p.indexOf(m) === 0; });
  }
  function build() {
    var bare = document.body.getAttribute('data-nav') === 'bare';
    if (!bare && !document.getElementById('pnav')) {
      var nav = document.createElement('nav');
      nav.id = 'pnav';
      nav.innerHTML =
        '<a class="pnav-brand" href="/"><span class="pnav-dot"></span> EpistemicLab</a>' +
        '<div class="pnav-links">' +
        LINKS.map(function (l) { return '<a class="pnav-link' + (isActive(l) ? ' active' : '') + '" href="' + l.href + '">' + l.label + '</a>'; }).join('') +
        '</div>';
      document.body.insertBefore(nav, document.body.firstChild);
    }
    if (!document.getElementById('pfoot')) {
      var f = document.createElement('footer');
      f.id = 'pfoot';
      f.innerHTML = '<span class="pfoot-gov">Práctica formativa · No es evaluación oficial WSET</span><a class="pfoot-up" href="/upgrade/">Mejorar mi plan</a>';
      document.body.appendChild(f);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
