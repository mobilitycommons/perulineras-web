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

// Contacto y formularios.
// CORREO: correo comercial operativo de Perulineras. Mientras esté vacío, los
// formularios se muestran desactivados con un aviso y no se envía nada.
// Envío temporal: el formulario prepara un correo en el programa del usuario
// (mailto). Sustituir por un servicio de formularios cuando se contrate uno.
(function () {
  var CORREO = 'info@perulineras.com';

  document.querySelectorAll('form[data-solicitud]').forEach(function (form) {
    var campos = form.querySelector('fieldset');
    var pendiente = form.querySelector('[data-pendiente]');
    var resultado = form.querySelector('[data-resultado]');

    if (!CORREO) {
      campos.disabled = true;
      if (pendiente) pendiente.hidden = false;
      return;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var lineas = [];
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.type === 'submit') return;
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) return;
        var etiqueta = el.getAttribute('data-etiqueta') || el.name;
        lineas.push(etiqueta + ': ' + (el.type === 'checkbox' && el.value === 'on' ? 'Sí' : el.value.trim()));
      });
      lineas.push('Fecha de la solicitud: ' + new Date().toISOString());
      var asunto = form.getAttribute('data-asunto') || 'Solicitud desde perulineras.com';
      window.location.href = 'mailto:' + CORREO + '?subject=' + encodeURIComponent(asunto) +
        '&body=' + encodeURIComponent(lineas.join('\n'));
      if (resultado) resultado.hidden = false;
    });
  });
})();
