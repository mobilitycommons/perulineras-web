// Mapa de electrolineras públicas (datos de OpenStreetMap, ver data/electrolineras.geojson).
// Una estación se considera verificada solo si trae la propiedad
// `verificacion: {fecha, fuente}`, añadida tras revisión de Perulineras.
(function () {
  var contenedor = document.querySelector('[data-mapa]');
  if (!contenedor || !window.L) return;

  var PERU = [[-18.4, -81.4], [-0.03, -68.65]];
  var CONECTORES = {
    type1: 'Tipo 1', type1_combo: 'CCS1', type2: 'Tipo 2', type2_combo: 'CCS2',
    type2_cable: 'Tipo 2 (cable)', chademo: 'CHAdeMO', gb_t: 'GB/T', gb_t_dc: 'GB/T DC',
    schuko: 'Schuko', tesla_supercharger: 'Tesla', nema_5_15: 'NEMA 5-15', nema_14_50: 'NEMA 14-50'
  };

  var mapa = L.map(contenedor, {
    scrollWheelZoom: contenedor.hasAttribute('data-zoom-rueda')
  });
  mapa.fitBounds(PERU, { padding: [8, 8] });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>'
  }).addTo(mapa);
  mapa.attributionControl.setPrefix(false);
  var capa = L.featureGroup().addTo(mapa);

  var icono = L.divIcon({ className: '', html: '<span class="punto"></span>', iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10] });
  var fechaDatos = '';

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fecha(iso) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function titulo(p) { return p.name || p.brand || 'Punto de carga'; }
  function operador(p) { return p.operator || p.network || p.brand || ''; }
  function direccion(p) {
    return [[p['addr:street'], p['addr:housenumber']].filter(Boolean).join(' '), p['addr:city']].filter(Boolean).join(', ');
  }
  function conectores(p) {
    return (p.conectores || []).map(function (c) {
      var nombre = CONECTORES[c.tipo] || c.tipo;
      return esc((c.cantidad && c.cantidad !== 'yes' ? c.cantidad + '× ' : '') + nombre + (c.potencia ? ' · ' + c.potencia : ''));
    }).join('<br>');
  }
  function acceso(p) {
    return { yes: 'Público', 'public': 'Público' }[p.access] || '';
  }

  function verificacion(p) {
    if (p.verificacion && p.verificacion.fecha) {
      return '<p class="popup-verificacion verificada">Verificado por Perulineras el ' + esc(fecha(p.verificacion.fecha)) +
        (p.verificacion.fuente ? ' (' + esc(p.verificacion.fuente) + ')' : '') + '.</p>';
    }
    return '<p class="popup-verificacion">No verificado por Perulineras. Fuente: OpenStreetMap' +
      (fechaDatos ? ', consultado el ' + esc(fechaDatos) : '') + '. Confirma condiciones y disponibilidad con el operador.</p>';
  }

  function popup(f) {
    var p = f.properties;
    var lat = f.geometry.coordinates[1], lon = f.geometry.coordinates[0];
    var filas = [
      ['Operador', operador(p)],
      ['Dirección', direccion(p)],
      ['Conectores', conectores(p)],
      ['Acceso', acceso(p)],
      ['Costo', p.fee === 'no' ? 'Gratuito' : p.fee === 'yes' ? 'De pago' : ''],
      ['Horario', p.opening_hours === '24/7' ? '24 horas' : p.opening_hours || '']
    ];
    var dl = filas.map(function (r) {
      // conectores ya viene escapado por partes; el resto se escapa aquí
      var valor = r[0] === 'Conectores' ? r[1] : esc(r[1]);
      return '<dt>' + r[0] + '</dt><dd>' + (r[1] ? valor : '<span class="sin-dato">Desconocido</span>') + '</dd>';
    }).join('');
    return '<div class="popup"><h3>' + esc(titulo(p)) + '</h3><dl>' + dl + '</dl>' + verificacion(p) +
      '<div class="popup-enlaces">' +
      '<a href="https://www.google.com/maps/dir/?api=1&amp;destination=' + lat + ',' + lon + '" target="_blank" rel="noopener">Cómo llegar</a>' +
      '<a href="https://www.openstreetmap.org/' + esc(p.osm) + '" target="_blank" rel="noopener">Ver o corregir en OSM</a>' +
      '</div></div>';
  }

  fetch(contenedor.getAttribute('data-mapa'))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (datos) {
      var actualizado = datos.metadata && datos.metadata.actualizado;
      if (actualizado) {
        fechaDatos = fecha(actualizado);
        document.querySelectorAll('[data-actualizado]').forEach(function (el) { el.textContent = fechaDatos; });
      }
      document.querySelectorAll('[data-conteo]').forEach(function (el) { el.textContent = datos.features.length; });

      var marcadores = datos.features.map(function (f) {
        var c = f.geometry.coordinates;
        var p = f.properties;
        var m = L.marker([c[1], c[0]], { icon: icono, title: titulo(p), alt: titulo(p), keyboard: true })
          .bindPopup(popup(f), { maxWidth: 300 });
        capa.addLayer(m);
        m.feature = f;
        m.texto = [titulo(p), operador(p), direccion(p)].join(' ').toLowerCase();
        return m;
      });

      var items = construirLista(marcadores);
      conectarBuscador(marcadores, items);
    })
    .catch(function () {
      document.querySelectorAll('[data-conteo]').forEach(function (el) { el.textContent = '—'; });
      var lista = document.querySelector('[data-lista]');
      if (lista) lista.innerHTML = '<li class="vacio">No se pudieron cargar los datos del mapa. Intenta recargar la página.</li>';
    });

  // Lista lateral (solo en la página /mapa).
  function construirLista(marcadores) {
    var lista = document.querySelector('[data-lista]');
    if (!lista) return [];

    var activo = null;
    var ordenados = marcadores.slice().sort(function (a, b) {
      return titulo(a.feature.properties).localeCompare(titulo(b.feature.properties), 'es');
    });
    var items = ordenados.map(function (m) {
      var p = m.feature.properties;
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<strong>' + esc(titulo(p)) + '</strong><span>' + esc(operador(p) || 'Operador desconocido') + (p['addr:city'] ? ' · ' + esc(p['addr:city']) : '') + '</span>';
      b.addEventListener('click', function () {
        if (activo) activo.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-pressed', 'true');
        activo = b;
        mapa.flyTo(m.getLatLng(), 16, { duration: 0.8 });
        m.openPopup();
      });
      li.appendChild(b);
      li.marcador = m;
      lista.appendChild(li);
      return li;
    });

    var vacio = document.createElement('li');
    vacio.className = 'vacio';
    vacio.textContent = 'No hay electrolineras que coincidan con la búsqueda.';
    vacio.hidden = true;
    vacio.setAttribute('data-sin-resultados', '');
    lista.appendChild(vacio);
    return items;
  }

  // Buscador por nombre, operador o dirección: filtra marcadores y lista.
  function conectarBuscador(marcadores, items) {
    var buscador = document.querySelector('[data-buscador]');
    var sinResultados = document.querySelector('[data-sin-resultados]');
    if (!buscador) return;

    var espera;
    buscador.addEventListener('input', function () {
      var q = buscador.value.trim().toLowerCase();
      var visibles = [];
      marcadores.forEach(function (m) {
        var ok = !q || m.texto.indexOf(q) !== -1;
        if (ok) { capa.addLayer(m); visibles.push(m); } else { capa.removeLayer(m); }
      });
      items.forEach(function (li) { li.hidden = !capa.hasLayer(li.marcador); });
      if (sinResultados) sinResultados.hidden = visibles.length > 0;

      clearTimeout(espera);
      espera = setTimeout(function () {
        if (q && visibles.length) mapa.fitBounds(capa.getBounds(), { padding: [40, 40], maxZoom: 15 });
        else if (!q) mapa.fitBounds(PERU, { padding: [8, 8] });
      }, 350);
    });
  }
})();
