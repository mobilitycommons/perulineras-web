# Perulineras Web

Sitio web de Perulineras: plataforma integradora de la infraestructura de carga para vehículos eléctricos en el Perú.

## Estructura

- `index.html` — página principal con el mapa de electrolineras públicas.
- `mapa/` — mapa completo con lista y buscador.
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

Ver `REDESIGN_BRIEF.md` para el brief de diseño.
