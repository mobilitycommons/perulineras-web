# Perulineras web — notas para asistentes

- **Idioma:** hablar siempre en español con el usuario en este repo. El contenido del sitio también es en español (Perú).
- El brief de diseño vigente está en `REDESIGN_BRIEF.md`; léelo antes de cambiar la web.
- Sitio estático sin build: `index.html` (inicio), `mapa/index.html` (mapa completo), `assets/` (estilos, JS, logos), `data/electrolineras.geojson`.
- Leaflet 1.9.4 está vendorizado en `assets/vendor/leaflet/` (sin CDN).
- Los datos del mapa salen de OpenStreetMap: actualizar con `python3 scripts/actualizar_electrolineras.py`. No inventar cifras, proveedores, correos ni teléfonos.
- Los logos de `assets/` se extrajeron del `Tablero de Marca Perulineras.png` (opción 1, bicolor). Reemplazar por los archivos oficiales aislados cuando existan.
- Probar en local: `python3 -m http.server` y abrir `http://localhost:8000/` (el mapa usa `fetch`, no funciona con `file://`).
