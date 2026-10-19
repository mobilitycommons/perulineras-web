// Mapa de electrolineras públicas. Datos: data/electrolineras.geojson, generado por
// scripts/electrolineras.py a partir de varias fuentes (AAP, Open Charge Map, OpenStreetMap).
// Una estación se considera verificada solo si trae la propiedad
// `verificacion: {fecha, fuente}`, añadida tras revisión de Perulineras.
//
// En /mapa (con [data-panel]) la ficha de la estación se abre en el panel lateral
// (en móvil, como hoja inferior) y cada estación tiene enlace propio: /mapa/#<id>.
// En la portada, el marcador abre un resumen con enlace a esa ficha.
(function () {
  var contenedor = document.querySelector('[data-mapa]');
  if (!contenedor || !window.L) return;

  var PERU = [[-18.4, -81.4], [-0.03, -68.65]];
  var CONECTORES = {
    type1: 'Tipo 1', type1_combo: 'CCS1', type2: 'Tipo 2', type2_combo: 'CCS2',
    type2_cable: 'Tipo 2 (cable)', chademo: 'CHAdeMO', gb_t: 'GB/T', gb_t_dc: 'GB/T DC',
    schuko: 'Schuko', tesla_supercharger: 'Tesla', nema_5_15: 'NEMA 5-15', nema_14_50: 'NEMA 14-50'
  };
  var CORRIENTE = { type1_combo: 'DC', type2_combo: 'DC', chademo: 'DC', gb_t_dc: 'DC', tesla_supercharger: 'DC' };
  var RAYO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor"/></svg>';
  // Iconos de trazo para el panel (formas basadas en Lucide, licencia ISC).
  var ICONOS = {
    volver: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    enchufe: '<path d="M12 22v-5M9 8V2M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    cerrar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    ruta: '<path d="M3 11 22 2l-9 19-2-8z"/>',
    compartir: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    copiado: '<path d="M20 6 9 17l-5-5"/>',
    verificada: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    aviso: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    direccion: '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    operador: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4"/>',
    acceso: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    costo: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    horario: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    equipo: '<path d="M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1"/><path d="m11 7-3 5h4l-3 5"/><path d="M22 11v2"/>',
    cargadores: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    externo: '<path d="M15 3h6v6M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3"/>',
    reportar: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>'
  };
  function ico(nombre) {
    return '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONOS[nombre] + '</svg>';
  }

  var panel = document.querySelector('[data-panel]');
  var movil = window.matchMedia('(max-width: 820px)');

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

  var infoFuente = {};
  var esperaEncuadre; // reencuadre diferido tras buscar o filtrar

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fecha(iso) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function titulo(p) { return p.nombre || 'Punto de carga'; }
  function operador(p) { return p.operador || ''; }
  function direccion(p) {
    var incluida = p.direccion && p.localidad && p.direccion.toLowerCase().indexOf(p.localidad.toLowerCase()) !== -1;
    return [p.direccion, incluida ? '' : p.localidad].filter(Boolean).join(', ');
  }
  function kw(n) { return String(n).replace('.', ',') + ' kW'; }
  function nombreConector(tipo) { return CONECTORES[tipo] || tipo; }
  function rapida(p) { return (p.corriente || '').indexOf('DC') !== -1; }
  function tipoCarga(p) {
    if (!p.corriente) return '';
    return (rapida(p) ? 'Carga rápida (DC)' : 'Carga lenta (AC)') +
      (p.potencia_max_kw ? ' · hasta ' + kw(p.potencia_max_kw) : '');
  }
  function acceso(p) {
    return { publico: 'Público', clientes: 'Solo clientes del establecimiento' }[p.acceso] || '';
  }
  function comoLlegar(f) {
    var c = f.geometry.coordinates;
    return 'https://www.google.com/maps/dir/?api=1&destination=' + c[1] + ',' + c[0];
  }
  function fuentes(p) {
    return (p.fuentes || []).map(function (f) {
      var info = infoFuente[f.id] || {};
      var cuando = f.actualizado ? 'dato del ' + fecha(f.actualizado) : info.consultado ? 'consultada el ' + fecha(info.consultado) : '';
      return '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(info.nombre || f.id) + '</a>' +
        (cuando ? ' (' + esc(cuando) + ')' : '');
    }).join(', ');
  }

  function verificacion(p) {
    if (p.verificacion && p.verificacion.fecha) {
      return '<p class="popup-verificacion verificada">Verificado por Perulineras el ' + esc(fecha(p.verificacion.fecha)) +
        (p.verificacion.fuente ? ' (' + esc(p.verificacion.fuente) + ')' : '') + '.</p>';
    }
    return '<p class="popup-verificacion">No verificado por Perulineras. Fuente: ' + (fuentes(p) || 'desconocida') +
      '.' + (p.precision === 'lugar' ? ' Ubicación aproximada del establecimiento.' : '') +
      ' Sin estado en tiempo real: confirma condiciones y disponibilidad con el operador.</p>';
  }

  // --- Marcadores ---------------------------------------------------------------

  function clasePunto(p) { return 'punto' + (rapida(p) ? ' punto-dc' : p.corriente ? '' : ' punto-sd'); }

  function icono(p, activo) {
    var clase = clasePunto(p) + (activo ? ' punto-activo' : '');
    var lado = rapida(p) ? 24 : 18;
    if (activo) lado += 8;
    return L.divIcon({
      className: '', html: '<span class="' + clase + '">' + (rapida(p) ? RAYO : '') + '</span>',
      iconSize: [lado, lado], iconAnchor: [lado / 2, lado / 2], popupAnchor: [0, -lado / 2 - 2]
    });
  }

  var Leyenda = L.Control.extend({
    options: { position: 'bottomleft' },
    onAdd: function () {
      var div = L.DomUtil.create('div', 'leyenda');
      div.innerHTML = '<span><i class="punto punto-dc">' + RAYO + '</i>Rápida (DC)</span>' +
        '<span><i class="punto"></i>Lenta (AC)</span><span><i class="punto punto-sd"></i>Sin dato</span>';
      return div;
    }
  });
  new Leyenda().addTo(mapa);

  // Resumen en globo (portada, sin panel).
  function resumen(f) {
    var p = f.properties;
    var tipos = (p.conectores || []).map(function (c) { return nombreConector(c.tipo); }).join(', ');
    return '<div class="popup"><h3>' + esc(titulo(p)) + '</h3>' +
      '<p class="popup-linea">' + esc([operador(p), p.localidad].filter(Boolean).join(' · ') || 'Operador desconocido') + '</p>' +
      '<p class="popup-linea"><strong>' + esc(tipoCarga(p) || 'Tipo de carga desconocido') + '</strong>' +
      (tipos ? '<br>' + esc(tipos) : '') + '</p>' +
      '<div class="popup-enlaces">' +
      '<a href="/mapa/#' + esc(p.id) + '">Ver ficha completa</a>' +
      '<a href="' + esc(comoLlegar(f)) + '" target="_blank" rel="noopener">Cómo llegar</a>' +
      '</div></div>';
  }

  // --- Ficha (panel lateral / hoja inferior) -------------------------------------

  function ficha(f) {
    var p = f.properties;
    var conectores = (p.conectores || []).map(function (c) {
      var corriente = c.corriente || CORRIENTE[c.tipo] || 'AC';
      return '<li class="conector conector-' + corriente.toLowerCase() + '">' +
        '<strong>' + esc(nombreConector(c.tipo)) + '</strong>' +
        '<span>' + esc(corriente) + (c.potencia_kw ? ' · ' + esc(kw(c.potencia_kw)) : '') + '</span>' +
        '<span>' + (c.cantidad ? esc(c.cantidad + (c.cantidad === 1 ? ' conector' : ' conectores')) : '<span class="sin-dato">Cantidad sin dato</span>') + '</span>' +
        '</li>';
    }).join('');
    var filas = [
      ['direccion', 'Dirección', direccion(p)],
      ['operador', 'Operador', operador(p)],
      ['acceso', 'Acceso', acceso(p)],
      ['costo', 'Costo', { gratuito: 'Gratuito', pago: 'De pago' }[p.costo] || ''],
      ['horario', 'Horario', p.horario === '24/7' ? '24 horas' : p.horario || ''],
      ['equipo', 'Equipo', p.equipo || ''],
      ['cargadores', 'Cargadores', p.cargadores ? String(p.cargadores) : '']
    ].map(function (r) {
      return '<dt>' + ico(r[0]) + r[1] + '</dt><dd>' + (r[2] ? esc(r[2]) : '<span class="sin-dato">Desconocido</span>') + '</dd>';
    }).join('');

    return '<button type="button" class="ficha-asa" data-asa aria-label="Expandir o reducir la ficha"><span></span></button>' +
      '<div class="ficha-barra">' +
      '<button type="button" class="ficha-volver" data-cerrar aria-label="Volver a la lista y cerrar la ficha">' +
      '<span class="solo-escritorio">' + ico('volver') + 'Volver a la lista</span><span class="solo-movil-ficha">' + ico('cerrar') + '</span></button></div>' +
      '<div class="ficha-cuerpo">' +
      '<h2 id="ficha-titulo" tabindex="-1">' + esc(titulo(p)) + '</h2>' +
      '<p class="ficha-sub">' + esc([operador(p), p.localidad].filter(Boolean).join(' · ') || 'Operador desconocido') + '</p>' +
      '<p class="ficha-etiquetas">' +
      (p.corriente ? '<span class="etiqueta-carga' + (rapida(p) ? ' etiqueta-dc' : '') + '">' + (rapida(p) ? RAYO : ico('enchufe')) + esc(tipoCarga(p)) + '</span>' : '') +
      (p.verificacion ? '<span class="etiqueta-estado verificada">' + ico('verificada') + 'Verificada</span>' : '<span class="etiqueta-estado">' + ico('aviso') + 'No verificada</span>') +
      '</p>' +
      '<div class="ficha-acciones">' +
      '<a class="boton boton-primario" href="' + esc(comoLlegar(f)) + '" target="_blank" rel="noopener">' + ico('ruta') + 'Cómo llegar</a>' +
      '<button type="button" class="boton boton-secundario" data-compartir>' + ico('compartir') + 'Compartir</button>' +
      '</div>' +
      '<h3>Conectores</h3>' +
      (conectores ? '<ul class="conectores">' + conectores + '</ul>' : '<p class="sin-dato">Sin datos de conectores.</p>') +
      '<h3>Detalles</h3><dl class="ficha-datos">' + filas + '</dl>' +
      '<h3>Fuente y verificación</h3>' + verificacion(p) +
      '<p class="ficha-enlaces">' +
      (p.osm ? '<a href="https://www.openstreetmap.org/' + esc(p.osm) + '" target="_blank" rel="noopener">' + ico('externo') + 'Ver o corregir en OpenStreetMap</a>' : '') +
      '<a href="/nosotros/#reportar">' + ico('reportar') + 'Reportar un error</a>' +
      '</p></div>';
  }

  // --- Carga de datos -------------------------------------------------------------

  fetch(contenedor.getAttribute('data-mapa'))
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (datos) {
      ((datos.metadata && datos.metadata.fuentes) || []).forEach(function (f) { infoFuente[f.id] = f; });
      var actualizado = datos.metadata && datos.metadata.actualizado;
      if (actualizado) {
        document.querySelectorAll('[data-actualizado]').forEach(function (el) { el.textContent = fecha(actualizado); });
      }
      document.querySelectorAll('[data-conteo]').forEach(function (el) { el.textContent = datos.features.length; });

      var marcadores = datos.features.map(function (f) {
        var c = f.geometry.coordinates;
        var p = f.properties;
        var m = L.marker([c[1], c[0]], { icon: icono(p), title: titulo(p), alt: titulo(p), keyboard: true, riseOnHover: true });
        if (!panel) m.bindPopup(resumen(f), { maxWidth: 280 });
        capa.addLayer(m);
        m.feature = f;
        m.texto = [titulo(p), operador(p), direccion(p), p.equipo].join(' ').toLowerCase();
        return m;
      });

      var items = construirLista(marcadores);
      var fichas = panel ? conectarFicha(marcadores, items) : null;
      conectarFiltros(marcadores, items);
      if (fichas) fichas.abrirDesdeHash();
    })
    .catch(function (e) {
      if (window.console) console.error(e);
      document.querySelectorAll('[data-conteo]').forEach(function (el) { el.textContent = '—'; });
      var lista = document.querySelector('[data-lista]');
      if (lista) lista.innerHTML = '<li class="vacio">No se pudieron cargar los datos del mapa. Intenta recargar la página.</li>';
    });

  // Lista lateral (solo en la página /mapa).
  function construirLista(marcadores) {
    var lista = document.querySelector('[data-lista]');
    if (!lista) return [];

    var ordenados = marcadores.slice().sort(function (a, b) {
      return titulo(a.feature.properties).localeCompare(titulo(b.feature.properties), 'es');
    });
    var items = ordenados.map(function (m) {
      var p = m.feature.properties;
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = '<i class="' + clasePunto(p) + '">' + (rapida(p) ? RAYO : '') + '</i>' +
        '<strong>' + esc(titulo(p)) + '</strong>' +
        '<span>' + esc([operador(p), p.localidad].filter(Boolean).join(' · ') || 'Ubicación sin detalle') + '</span>' +
        (p.corriente ? '<span class="lista-carga' + (rapida(p) ? ' lista-dc' : '') + '">' + esc(tipoCarga(p)) + '</span>' : '');
      li.appendChild(b);
      li.marcador = m;
      li.boton = b;
      m.item = li;
      lista.appendChild(li);
      return li;
    });

    var vacio = document.createElement('li');
    vacio.className = 'vacio';
    vacio.textContent = 'No hay electrolineras que coincidan con la búsqueda o los filtros.';
    vacio.hidden = true;
    vacio.setAttribute('data-sin-resultados', '');
    lista.appendChild(vacio);
    return items;
  }

  // Ficha en el panel: abrir desde lista, marcador o enlace /mapa/#<id>.
  function conectarFicha(marcadores, items) {
    var contenedorFicha = panel.querySelector('[data-ficha]');
    var porId = {};
    marcadores.forEach(function (m) { porId[m.feature.properties.id] = m; });
    var activo = null;
    var origenFoco = null;

    function centrar(m) {
      clearTimeout(esperaEncuadre);
      var zoom = Math.max(mapa.getZoom(), 15);
      var punto = mapa.project(m.getLatLng(), zoom);
      // En móvil la hoja inferior tapa parte del mapa: se sube el marcador.
      if (movil.matches) punto = punto.add([0, contenedorFicha.offsetHeight / 2]);
      mapa.flyTo(mapa.unproject(punto, zoom), zoom, { duration: 0.8 });
    }

    function abrir(m, opciones) {
      opciones = opciones || {};
      if (activo) {
        activo.setIcon(icono(activo.feature.properties));
        activo.setZIndexOffset(0);
        if (activo.item) activo.item.boton.setAttribute('aria-pressed', 'false');
      }
      activo = m;
      var p = m.feature.properties;
      m.setIcon(icono(p, true));
      m.setZIndexOffset(1000);
      if (m.item) m.item.boton.setAttribute('aria-pressed', 'true');

      contenedorFicha.innerHTML = ficha(m.feature);
      contenedorFicha.hidden = false;
      contenedorFicha.removeAttribute('data-expandida');
      contenedorFicha.scrollTop = 0;
      panel.setAttribute('data-con-ficha', '');
      if (location.hash !== '#' + p.id) history.replaceState(null, '', '#' + p.id);
      document.title = titulo(p) + ' | Electrolineras | Perulineras';
      if (!capa.hasLayer(m)) capa.addLayer(m);
      centrar(m);
      if (!opciones.sinFoco) contenedorFicha.querySelector('#ficha-titulo').focus({ preventScroll: true });
    }

    function cerrar() {
      if (!activo) return;
      activo.setIcon(icono(activo.feature.properties));
      activo.setZIndexOffset(0);
      if (activo.item) activo.item.boton.setAttribute('aria-pressed', 'false');
      activo = null;
      contenedorFicha.hidden = true;
      contenedorFicha.innerHTML = '';
      panel.removeAttribute('data-con-ficha');
      history.replaceState(null, '', location.pathname + location.search);
      document.title = tituloOriginal;
      if (origenFoco && document.contains(origenFoco)) origenFoco.focus({ preventScroll: movil.matches });
    }

    var tituloOriginal = document.title;

    marcadores.forEach(function (m) {
      m.on('click', function () {
        origenFoco = null;
        abrir(m, { sinFoco: movil.matches });
      });
    });
    items.forEach(function (li) {
      li.boton.addEventListener('click', function () {
        origenFoco = li.boton;
        if (movil.matches) window.scrollTo({ top: 0, behavior: 'smooth' });
        abrir(li.marcador, { sinFoco: movil.matches });
      });
    });

    contenedorFicha.addEventListener('click', function (e) {
      if (e.target.closest('[data-cerrar]')) cerrar();
      else if (e.target.closest('[data-asa]')) contenedorFicha.toggleAttribute('data-expandida');
      else if (e.target.closest('[data-compartir]')) compartir(e.target.closest('[data-compartir]'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && activo && !document.querySelector('.nav.abierto')) cerrar();
    });

    // Hoja inferior: deslizar hacia arriba la expande; hacia abajo la reduce o la cierra.
    var inicioY = null;
    contenedorFicha.addEventListener('touchstart', function (e) {
      inicioY = (e.target.closest('[data-asa]') || contenedorFicha.scrollTop === 0) ? e.touches[0].clientY : null;
    }, { passive: true });
    contenedorFicha.addEventListener('touchend', function (e) {
      if (inicioY === null || !movil.matches) return;
      var dy = e.changedTouches[0].clientY - inicioY;
      inicioY = null;
      if (dy < -40) contenedorFicha.setAttribute('data-expandida', '');
      else if (dy > 40) {
        if (contenedorFicha.hasAttribute('data-expandida')) contenedorFicha.removeAttribute('data-expandida');
        else cerrar();
      }
    }, { passive: true });

    function compartir(boton) {
      var p = activo.feature.properties;
      var url = location.origin + '/mapa/#' + p.id;
      if (navigator.share) {
        navigator.share({ title: titulo(p) + ' · Perulineras', url: url }).catch(function () {});
        return;
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          boton.innerHTML = ico('copiado') + 'Enlace copiado';
          setTimeout(function () { boton.innerHTML = ico('compartir') + 'Compartir'; }, 2000);
        });
      }
    }

    function abrirDesdeHash() {
      var id = decodeURIComponent(location.hash.slice(1));
      if (porId[id]) abrir(porId[id], { sinFoco: true });
      else if (!id && activo) cerrar();
    }
    window.addEventListener('hashchange', abrirDesdeHash);

    return { abrirDesdeHash: abrirDesdeHash };
  }

  // Búsqueda y filtros: actúan sobre marcadores y lista a la vez.
  function conectarFiltros(marcadores, items) {
    var buscador = document.querySelector('[data-buscador]');
    var sinResultados = document.querySelector('[data-sin-resultados]');
    var gruposCarga = document.querySelector('[data-filtro-carga]');
    var gruposConector = document.querySelector('[data-filtro-conector]');
    var selectorLocalidad = document.querySelector('[data-filtro-localidad]');
    var resultado = document.querySelector('[data-resultado]');
    var limpiar = document.querySelector('[data-limpiar]');
    var estado = { q: '', carga: '', conectores: [], localidad: '' };

    // Opciones de filtro a partir de los datos disponibles (solo las que existen).
    function contar(clave) {
      var cuenta = {};
      marcadores.forEach(function (m) {
        clave(m.feature.properties).forEach(function (v) { if (v) cuenta[v] = (cuenta[v] || 0) + 1; });
      });
      return cuenta;
    }
    if (gruposConector) {
      var porTipo = contar(function (p) {
        return (p.conectores || []).map(function (c) { return c.tipo; }).filter(function (t, i, a) { return a.indexOf(t) === i; });
      });
      Object.keys(porTipo).sort(function (a, b) { return porTipo[b] - porTipo[a]; }).forEach(function (tipo) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip-filtro';
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('data-valor', tipo);
        b.innerHTML = esc(nombreConector(tipo)) + ' <span class="chip-cuenta">' + porTipo[tipo] + '</span>';
        gruposConector.appendChild(b);
      });
    }
    if (selectorLocalidad) {
      var porLocalidad = contar(function (p) { return [p.localidad]; });
      Object.keys(porLocalidad).sort(function (a, b) { return a.localeCompare(b, 'es'); }).forEach(function (loc) {
        var o = document.createElement('option');
        o.value = loc;
        o.textContent = loc + ' (' + porLocalidad[loc] + ')';
        selectorLocalidad.appendChild(o);
      });
    }

    function coincide(m) {
      var p = m.feature.properties;
      if (estado.q && m.texto.indexOf(estado.q) === -1) return false;
      if (estado.carga && (p.corriente || '').indexOf(estado.carga) === -1) return false;
      if (estado.localidad && p.localidad !== estado.localidad) return false;
      if (estado.conectores.length && !(p.conectores || []).some(function (c) {
        return estado.conectores.indexOf(c.tipo) !== -1;
      })) return false;
      return true;
    }

    function aplicar() {
      var visibles = [];
      marcadores.forEach(function (m) {
        if (coincide(m)) { capa.addLayer(m); visibles.push(m); } else { capa.removeLayer(m); }
      });
      items.forEach(function (li) { li.hidden = !capa.hasLayer(li.marcador); });
      if (sinResultados) sinResultados.hidden = visibles.length > 0;
      var filtrando = estado.carga || estado.localidad || estado.conectores.length;
      if (resultado) {
        resultado.textContent = (filtrando || estado.q)
          ? visibles.length + ' de ' + marcadores.length + ' electrolineras'
          : marcadores.length + ' electrolineras';
      }
      if (limpiar) limpiar.hidden = !filtrando;

      clearTimeout(esperaEncuadre);
      esperaEncuadre = setTimeout(function () {
        if ((filtrando || estado.q) && visibles.length) mapa.fitBounds(capa.getBounds(), { padding: [40, 40], maxZoom: 15 });
        else if (!filtrando && !estado.q) mapa.fitBounds(PERU, { padding: [8, 8] });
      }, 350);
    }

    if (buscador) {
      buscador.addEventListener('input', function () {
        estado.q = buscador.value.trim().toLowerCase();
        aplicar();
      });
    }
    if (gruposCarga) {
      gruposCarga.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        gruposCarga.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        estado.carga = b.getAttribute('data-valor');
        aplicar();
      });
    }
    if (gruposConector) {
      gruposConector.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        var activo = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(activo));
        estado.conectores = Array.prototype.filter.call(gruposConector.querySelectorAll('button'), function (x) {
          return x.getAttribute('aria-pressed') === 'true';
        }).map(function (x) { return x.getAttribute('data-valor'); });
        aplicar();
      });
    }
    if (selectorLocalidad) {
      selectorLocalidad.addEventListener('change', function () {
        estado.localidad = selectorLocalidad.value;
        aplicar();
      });
    }
    if (limpiar) {
      limpiar.addEventListener('click', function () {
        estado.carga = '';
        estado.localidad = '';
        estado.conectores = [];
        document.querySelectorAll('[data-filtro-carga] button, [data-filtro-conector] button').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b.getAttribute('data-valor') === '' && b.parentNode === gruposCarga));
        });
        if (selectorLocalidad) selectorLocalidad.value = '';
        aplicar();
      });
    }
    if (resultado) resultado.textContent = marcadores.length + ' electrolineras';
  }
})();
