// Mapa de electrolineras públicas (datos de OpenStreetMap, ver data/electrolineras.geojson).
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

  var icono = L.divIcon({ className: '', html: '<span class="punto"></span>', iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -10] });

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
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

  function popup(f) {
    var p = f.properties;
    var lat = f.geometry.coordinates[1], lon = f.geometry.coordinates[0];
    var filas = [
      ['Operador', operador(p)],
      ['Dirección', direccion(p)],
      ['Conectores', conectores(p)],
      ['Costo', p.fee === 'no' ? 'Gratuito' : p.fee === 'yes' ? 'De pago' : ''],
      ['Horario', p.opening_hours === '24/7' ? '24 horas' : p.opening_hours || '']
    ];
    var dl = filas.map(function (r) {
      // conectores ya viene escapado por partes; el resto se escapa aquí
      var valor = r[0] === 'Conectores' ? r[1] : esc(r[1]);
      return '<dt>' + r[0] + '</dt><dd>' + (r[1] ? valor : '<span class="sin-dato">Sin dato</span>') + '</dd>';
    }).join('');
    return '<div class="popup"><h3>' + esc(titulo(p)) + '</h3><dl>' + dl + '</dl>' +
      '<div class="popup-enlaces">' +
      '<a href="https://www.google.com/maps/dir/?api=1&amp;destination=' + lat + ',' + lon + '" target="_blank" rel="noopener">Cómo llegar</a>' +
      '<a href="https://www.openstreetmap.org/' + esc(p.osm) + '" target="_blank" rel="noopener">Ver o corregir en OSM</a>' +
      '</div></div>';
  }

  fetch(contenedor.getAttribute('data-mapa'))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (datos) {
      var marcadores = datos.features.map(function (f) {
        var c = f.geometry.coordinates;
        var m = L.marker([c[1], c[0]], { icon: icono, title: titulo(f.properties), alt: titulo(f.properties), keyboard: true })
          .bindPopup(popup(f), { maxWidth: 300 })
          .addTo(mapa);
        m.feature = f;
        return m;
      });

      document.querySelectorAll('[data-conteo]').forEach(function (el) { el.textContent = datos.features.length; });
      var fecha = datos.metadata && datos.metadata.actualizado;
      if (fecha) {
        var texto = new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
        document.querySelectorAll('[data-actualizado]').forEach(function (el) { el.textContent = texto; });
      }

      construirLista(marcadores);
    })
    .catch(function () {
      document.querySelectorAll('[data-conteo]').forEach(function (el) { el.textContent = '—'; });
      var lista = document.querySelector('[data-lista]');
      if (lista) lista.innerHTML = '<li class="vacio">No se pudieron cargar los datos del mapa. Intenta recargar la página.</li>';
    });

  // Lista lateral con buscador (solo en la página /mapa).
  function construirLista(marcadores) {
    var lista = document.querySelector('[data-lista]');
    var buscador = document.querySelector('[data-buscador]');
    if (!lista) return;

    var activo = null;
    marcadores.sort(function (a, b) { return titulo(a.feature.properties).localeCompare(titulo(b.feature.properties), 'es'); });
    var items = marcadores.map(function (m) {
      var p = m.feature.properties;
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<strong>' + esc(titulo(p)) + '</strong><span>' + esc(operador(p) || 'Operador sin registrar') + (p['addr:city'] ? ' · ' + esc(p['addr:city']) : '') + '</span>';
      b.addEventListener('click', function () {
        if (activo) activo.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-pressed', 'true');
        activo = b;
        mapa.flyTo(m.getLatLng(), 16, { duration: 0.8 });
        m.openPopup();
      });
      li.appendChild(b);
      li.texto = [titulo(p), operador(p), direccion(p)].join(' ').toLowerCase();
      lista.appendChild(li);
      return li;
    });

    var vacio = document.createElement('li');
    vacio.className = 'vacio';
    vacio.textContent = 'No hay electrolineras que coincidan con la búsqueda.';
    vacio.hidden = true;
    lista.appendChild(vacio);

    if (buscador) {
      buscador.addEventListener('input', function () {
        var q = buscador.value.trim().toLowerCase();
        var visibles = 0;
        items.forEach(function (li) {
          var ok = !q || li.texto.indexOf(q) !== -1;
          li.hidden = !ok;
          if (ok) visibles++;
        });
        vacio.hidden = visibles > 0;
      });
    }
  }
})();
