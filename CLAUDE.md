# Perulineras web — notas para asistentes

- **Idioma:** hablar siempre en español con el usuario en este repo. El contenido del sitio también es en español (Perú).
- El documento rector es `REQUISITOS_PERULINERAS.md` (producto, mensajes, prioridades); `REDESIGN_BRIEF.md` recoge la dirección visual y el estado. Léelos antes de cambiar la web.
- No mencionar electromovilidad.la en la web: solo se heredó el diseño del header.
- No presentar formularios como operativos si no envían datos; el correo comercial se configura en `CORREO` de `assets/sitio.js`.
- Sitio estático sin build: `index.html` (inicio), `mapa/`, `instala/`, `proveedores/`, `nosotros/`, `privacidad/`, `terminos/`, `404.html`, `assets/` (estilos, JS, logos), `data/electrolineras.geojson`. Rutas absolutas; header y footer se repiten en cada página.
- Leaflet 1.9.4 está vendorizado en `assets/vendor/leaflet/` (sin CDN).
- Los datos del mapa salen de OpenStreetMap: actualizar con `python3 scripts/actualizar_electrolineras.py`. No inventar cifras, proveedores, correos ni teléfonos.
- Los logos de `assets/` se extrajeron del `Tablero de Marca Perulineras.png` (opción 1, bicolor). Reemplazar por los archivos oficiales aislados cuando existan.
- Probar en local: `python3 -m http.server` y abrir `http://localhost:8000/` (el mapa usa `fetch`, no funciona con `file://`).
