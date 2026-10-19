# Rediseño web de Perulineras

## Contexto

Perulineras es una empresa peruana cuyo objetivo es integrar la infraestructura de carga para vehículos eléctricos de distintos proveedores.

El antecedente del proyecto es [electromovilidad.la](https://www.electromovilidad.la), desarrollado como observatorio regional de electromovilidad. Perulineras representa la evolución práctica de ese trabajo, enfocada en la infraestructura de carga del Perú.

## Objetivo principal

La página principal debe conducir al usuario al mapa de electrolineras.

Perulineras debe presentarse como una plataforma integradora e independiente, no como una red perteneciente a un único proveedor de carga.

## Dirección visual

- Fondo predominantemente blanco.
- Utilizar el logo oficial de Perulineras.
- Evitar una interfaz dominada por azul oscuro.
- Usar azul corporativo para texto, navegación y detalles.
- Usar rojo como acento y para la acción principal.
- Apariencia limpia, tecnológica, confiable e institucional.
- Diseño responsive para escritorio y móvil.
- Inspirarse en la claridad del header de electromovilidad.la, sin copiarlo literalmente.

## Header

Header compacto, fijo y con fondo blanco:

- Logo de Perulineras a la izquierda.
- Navegación:
  - Mapa
  - Red de carga
  - Datos
  - Nosotros
- Botón principal rojo: “Ver mapa”.
- Enlace secundario al “Observatorio electromovilidad.la”.
- Menú móvil accesible.
- Borde inferior o sombra muy sutil al hacer scroll.

## Hero

Mensaje recomendado:

**Una red. Todos los cargadores.**

Texto de apoyo:

> Integramos la infraestructura de carga de diferentes proveedores para que moverse en eléctrico por el Perú sea más simple.

Acciones:

1. “Ver mapa de electrolineras” — acción principal.
2. “Conoce Perulineras” — acción secundaria.

El hero puede incluir una visualización ligera inspirada en un mapa del Perú, rutas o puntos de carga. No debe usar fotografías genéricas como elemento dominante.

## Secciones propuestas

### Red integrada

Explicar que Perulineras reúne puntos de carga de múltiples operadores y proveedores en una experiencia unificada.

### Información útil

Mostrar que el mapa puede ofrecer, según disponibilidad:

- Ubicación
- Tipo de conector
- Potencia
- Operador
- Disponibilidad o estado
- Indicaciones para llegar

No publicar cifras inventadas. Las métricas deben salir de datos reales del mapa.

### Del observatorio a la infraestructura

Explicar brevemente que electromovilidad.la fue el antecedente de investigación y visualización regional, mientras Perulineras convierte ese conocimiento en una herramienta enfocada en Perú.

Enlace:

https://www.electromovilidad.la

### Proveedores y operadores

Invitación a integrar nuevos cargadores o corregir información existente.

CTA sugerido: “Integra tu red”.

## Mapa

La navegación principal debe apuntar al mapa propio de Perulineras.

Mientras no se confirme la URL definitiva, utilizar una ruta interna provisional:

```text
/mapa
```

El mapa del antecedente se encuentra en:

https://www.electromovilidad.la/mapa

No usar ese enlace como destino definitivo de Perulineras sin confirmación.

## Activos existentes

Actualmente existe:

`Tablero de Marca Perulineras.png`

Contiene las variantes del logo y referencias de color. Conviene exportar posteriormente archivos independientes:

- `logo-perulineras.svg` o PNG transparente
- `logo-perulineras-white.svg`
- `isotipo-perulineras.svg`
- favicon

No redibujar ni sustituir el logo con texto cuando esté disponible el archivo oficial aislado.

## Implementación actual

El repositorio contiene una web provisional estática en `index.html`.

La siguiente implementación debe:

1. Reemplazar el diseño oscuro provisional.
2. Mantener el sitio sin dependencias si no se necesita un framework.
3. Usar HTML semántico.
4. Incluir estados de foco visibles y navegación por teclado.
5. Mantener buen contraste y rendimiento.
6. Añadir metadatos básicos para SEO y compartir en redes.
7. Verificar visualmente escritorio y móvil.
8. No inventar correo, teléfono, estadísticas, socios ni proveedores.

## Pendientes por confirmar

- URL definitiva del mapa de Perulineras.
- Archivo aislado del logo oficial.
- Correo de contacto.
- Proveedores o redes que pueden mostrarse públicamente.
- Métricas verificadas del mapa.
- URL definitiva del dominio.
- Si la web se desplegará mediante Vercel.

## Repositorio y despliegue

Repositorio:

https://github.com/mobilitycommons/perulineras-web

Rama principal:

`main`

La autenticación Git está configurada mediante GitHub CLI. Nunca guardar contraseñas, tokens ni secretos dentro del repositorio.
