// Header: menú móvil accesible.
(function () {
  var boton = document.querySelector('.menu-boton');
  var nav = document.getElementById('nav-principal');

  if (!boton || !nav) return;

  function cerrar(devolverFoco) {
    nav.classList.remove('abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.setAttribute('aria-label', 'Abrir menú');
    if (devolverFoco) boton.focus();
  }

  boton.addEventListener('click', function () {
    var abierto = nav.classList.toggle('abierto');
    boton.setAttribute('aria-expanded', String(abierto));
    boton.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    if (abierto) nav.querySelector('a').focus();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('abierto')) cerrar(true);
  });

  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) cerrar(false);
  });

  window.matchMedia('(min-width: 961px)').addEventListener('change', function (m) {
    if (m.matches) cerrar(false);
  });
})();
