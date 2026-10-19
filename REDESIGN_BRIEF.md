# Rediseño web de Perulineras

> **Documento rector:** `REQUISITOS_PERULINERAS.md` (v0.2, 2026-10-19). Este brief solo recoge la dirección visual y el estado de la implementación; ante cualquier conflicto, prevalecen los requisitos.

## Contexto

Perulineras es una plataforma de consulta de infraestructura de recarga para vehículos eléctricos en Perú y una empresa de ingeniería e integración de soluciones de recarga.

**electromovilidad.la no se menciona en la web.** Lo único heredado de ese proyecto es el diseño del header (decisión del 2026-10-19).

## Dirección visual

- Fondo predominantemente blanco.
- Utilizar el logo oficial de Perulineras.
- Usar azul corporativo para texto, navegación y detalles; rojo como acento y para la acción principal.
- Apariencia limpia, técnica, confiable y accesible. Responsive.

## Header

Diseño heredado de electromovilidad.la: barra fija de ancho completo, 52 px de alto, fondo azul marino oscuro, logo para fondo oscuro a la izquierda, navegación centrada en texto pequeño con subrayado rojo en el enlace activo y botones compactos a la derecha. Tipografía Manrope.

- Navegación: Mapa · Instala tu electrolinera · Proveedores · Nosotros.
- Acciones: «Registra tu empresa» (chip) y «Solicitar evaluación» (botón rojo).
- Menú móvil accesible.

## Arquitectura

- `/` — portada con el mapa como protagonista, buscador, accesos a buscar / instalar / registrar empresa.
- `/mapa/` — mapa completo con lista y buscador.
- `/instala/` — servicio «Te ayudamos a instalar tu electrolinera» y formulario de evaluación.
- `/proveedores/` — por qué participar, gratuidad inicial, autorización, monetización futura y formulario de incorporación (`#registro`).
- `/nosotros/` — identidad, estado del proyecto, reportes de estaciones (`#reportar`) y contacto (`#contacto`).
- `/privacidad/`, `/terminos/` — borradores v0.1 sujetos a revisión legal.
- `/404.html` — página de error (rutas absolutas).

## Mapa

Ruta propia: `/mapa/`. URL definitiva del dominio: `https://www.perulineras.com` (el apex redirige a `www`).

## Activos existentes

Actualmente existe:

`Tablero de Marca Perulineras.png`

Contiene las variantes del logo y referencias de color. Conviene exportar posteriormente archivos independientes:

- `logo-perulineras.svg` o PNG transparente
- `logo-perulineras-white.svg`
- `isotipo-perulineras.svg`
- favicon

No redibujar ni sustituir el logo con texto cuando esté disponible el archivo oficial aislado.

## Criterios de implementación

- Sitio estático sin dependencias mientras no se necesite un framework; HTML semántico.
- Foco visible, navegación por teclado, buen contraste y rendimiento.
- Metadatos para SEO y para compartir (URLs absolutas en `og:*`).
- No inventar correo, teléfono, estadísticas, socios ni proveedores.

## Pendientes por confirmar

- Servicio de formularios que sustituya al envío por mailto.
- Datos del titular del banco de datos (razón social, RUC, domicilio) y revisión legal de privacidad y términos.
- Archivo aislado del logo oficial.
- Proveedores que autoricen su publicación.

## Repositorio y despliegue

Repositorio:

https://github.com/mobilitycommons/perulineras-web

Rama principal:

`main`

La autenticación Git está configurada mediante GitHub CLI. Nunca guardar contraseñas, tokens ni secretos dentro del repositorio.

## Estado de la implementación (2026-10-19)

- Replanteamiento según `REQUISITOS_PERULINERAS.md` (hito B): portada centrada en el mapa, páginas de instalación, proveedores, nosotros, privacidad, términos y 404. Rutas absolutas (`/assets/...`).
- Mapa con Leaflet + teselas de OpenStreetMap; datos de electrolineras públicas desde OpenStreetMap (`data/electrolineras.geojson`), excluyendo `access=private/customers/no/permit/delivery`. La ficha distingue «no verificado» (por defecto) de «verificado» (si la estación trae `verificacion: {fecha, fuente}`) y marca los campos sin dato como «Desconocido».
- Contacto: `info@perulineras.com` (`CORREO` en `assets/sitio.js`). Los formularios (evaluación y registro de proveedores) abren el programa de correo del usuario con la solicitud preparada (mailto), como alternativa temporal; sustituir por un servicio de formularios cuando se decida. Si `CORREO` queda vacío, se desactivan con aviso.
- Privacidad y términos: borradores v0.1; faltan los datos del titular (razón social, RUC, domicilio) y la revisión legal.
- Logo provisional extraído del tablero de marca. Sustituir por los archivos oficiales aislados cuando estén disponibles.
- El mapa base usa las teselas públicas de OpenStreetMap (sujeto a su política de uso); con tráfico alto conviene un proveedor de teselas propio o contratado.
