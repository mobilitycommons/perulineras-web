# Perulineras Web

Sitio web de Perulineras: mapa de electrolineras públicas del Perú y servicios de ingeniería e instalación de recarga.

## Estructura

- `index.html` — portada con el mapa de electrolineras públicas.
- `mapa/` — mapa completo con lista y buscador.
- `instala/`, `proveedores/`, `nosotros/` — servicio de instalación, directorio de proveedores, identidad y contacto.
- `privacidad/`, `terminos/` — borradores legales v0.1; `404.html` — página de error.
- `assets/` — estilos, scripts, logos e íconos.
- `data/` — base de datos de electrolineras (ver «Datos del mapa»).
- `scripts/electrolineras.py` y `scripts/fuentes.py` — descargan las fuentes y construyen la BD.

## Desarrollo local

```sh
python3 -m http.server 8000
# abrir http://localhost:8000/
```

## Datos del mapa

No existe un registro oficial público de electrolineras en el Perú (el reglamento DS 036-2023-EM prevé que las estaciones de acceso público se declaren al MINEM para su geolocalización, pero ese registro no se publica). La BD reúne las fuentes abiertas disponibles:

| Fuente | Qué aporta | Licencia |
|---|---|---|
| [Padrón de la AAP](https://aap.org.pe/electrolineras) | La lista más completa: nombre, dirección, equipo, potencia, conectores | Sin licencia declarada; se cita con atribución (pendiente pedir autorización) |
| [Open Charge Map](https://openchargemap.org/) | Ubicación exacta, operador, conectores y estado reportado | CC BY 4.0 / CC0 según proveedor |
| [OpenStreetMap](https://www.openstreetmap.org/) | Ubicación exacta, acceso, costo, horario | ODbL 1.0 |

```
data/fuentes/<fuente>.json   instantánea normalizada por fuente (versionada)
data/curado/fuentes.json     fuentes, prioridad y si se publican
data/curado/ajustes.json     uniones/separaciones, exclusiones, correcciones, verificaciones y altas propias
data/esquema.sql             esquema de la BD
data/electrolineras.sqlite   BD completa (generada, no versionada)
data/electrolineras.geojson  estaciones publicables, lo que lee assets/mapa.js
```

```sh
python3 scripts/electrolineras.py              # descargar todas las fuentes y construir
python3 scripts/electrolineras.py descargar aap
python3 scripts/electrolineras.py construir    # tras editar data/curado/
sqlite3 data/electrolineras.sqlite "select nombre, localidad, potencia_max_kw from estacion_publica"
```

Al construir se unen automáticamente los registros de distintas fuentes a menos de 100 m; los pares cercanos que no se unen se listan para revisión (tabla `posible_duplicado`) y se resuelven en `ajustes.json` (`unir` / `separar`). No se publican estaciones con acceso privado, reportadas como no operativas ni registros excluidos. Una estación figura como verificada solo si `ajustes.json` trae su verificación. Sin `OCM_API_KEY` se usa el export público de Open Charge Map en GitHub.

Mapa base: teselas de OpenStreetMap.

Ver `REQUISITOS_PERULINERAS.md` (requisitos) y `REDESIGN_BRIEF.md` (diseño y estado).
