# Perulineras Web

Sitio web de Perulineras: mapa de electrolineras públicas del Perú y servicios de ingeniería e instalación de recarga.

## Estructura

- `index.html` — portada con el mapa de electrolineras públicas.
- `mapa/` — mapa completo con lista y buscador.
- `instala/`, `proveedores/`, `nosotros/` — servicio de instalación, directorio de proveedores, identidad y contacto.
- `privacidad/`, `terminos/` — borradores legales v0.1; `404.html` — página de error.
- `assets/` — estilos, scripts, logos e íconos.
- `data/electrolineras.geojson` — electrolineras públicas del Perú según OpenStreetMap.
- `scripts/actualizar_electrolineras.py` — regenera los datos desde Overpass API.

## Desarrollo local

```sh
python3 -m http.server 8000
# abrir http://localhost:8000/
```

## Actualizar datos

```sh
python3 scripts/actualizar_electrolineras.py
```

Datos © colaboradores de OpenStreetMap, licencia ODbL. Mapa base: teselas de OpenStreetMap.

Ver `REQUISITOS_PERULINERAS.md` (requisitos) y `REDESIGN_BRIEF.md` (diseño y estado).
