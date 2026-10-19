# Perulineras — Requisitos de producto y marketing

**Versión:** 0.2  
**Fecha:** 19 de octubre de 2026  
**Propósito:** orientar a Claude en la evolución del primer landing de Perulineras. Este documento define el posicionamiento y los requisitos funcionales; no presupone que las funcionalidades ya existan.

## 0. Objetivo inmediato: sitio sólido antes de contactar proveedores (P0 — bloqueante)

**La primera meta no es lanzar un marketplace:** es disponer de una web pública, creíble y funcional que pueda incluirse en correos de invitación a empresas del sector sin perjudicar la reputación de Perulineras.

### Condiciones mínimas antes del primer correo

- Dominio principal y `www` funcionando con HTTPS, redirección canónica y sin errores visibles.
- Identidad corporativa consistente: nombre Perulineras, propuesta de valor clara, contacto real y explicación honesta del estado del proyecto.
- Portada profesional y adaptable a móviles, con **mapa como protagonista**. Si los datos o funciones del mapa son parciales, mostrarlo claramente; nunca simular cobertura, disponibilidad o verificación.
- Sección **«Instala tu electrolinera»** que explique evaluación, ingeniería, integración e implementación, con un canal de contacto **realmente operativo**.
- Página **«Para proveedores»** que explique por qué participar, inscripción inicialmente gratuita, qué información se publicará, autorización requerida y eventual monetización futura sin comprometer tarifas o fechas.
- Canal funcional para **solicitar incorporación**: formulario probado de extremo a extremo o, como alternativa temporal explícita, correo comercial operativo. No presentar un formulario decorativo como funcional.
- Política de privacidad, aviso de tratamiento de datos y términos de publicación accesibles; textos sujetos a revisión legal antes de captar datos.
- Sin proveedores publicados como participantes sin autorización; sin logos, testimonios, alianzas, cifras o certificaciones inventadas.
- Metadatos básicos para compartir enlaces (título, descripción, favicon y vista previa), navegación sin enlaces rotos y página de error apropiada.
- Revisión manual en Android y escritorio: legibilidad, velocidad razonable, mapa usable, botones y envío de contactos.

### Secuencia de ejecución obligatoria para Claude

**Hito A — Auditoría:** inspeccionar el código y la web desplegada; registrar errores, contenidos irrelevantes, datos ficticios y funcionalidades aparentes. No rehacer todo sin justificación.

**Hito B — Sitio presentable:** corregir estructura, textos, identidad, mapa, sección de servicios y sección para proveedores. Dejar claros los estados «disponible» y «próximamente».

**Hito C — Captación comprobada:** configurar un canal de contacto y registro, validar consentimiento y probar que las solicitudes llegan y pueden atenderse. Si faltan credenciales, documentar exactamente el bloqueo y usar una alternativa funcional autorizada.

**Hito D — Control de calidad y despliegue:** probar rutas, formularios, enlaces, responsive, HTTPS y metadatos en producción; entregar lista de comprobación con evidencias y pendientes.

**Hito E — Difusión:** **solo después de aprobar A–D**, preparar el correo de invitación a proveedores. La difusión no debe preceder a una web confiable.

**Definición de terminado:** una empresa invitada puede abrir el enlace, comprender qué es Perulineras, explorar el mapa, conocer el beneficio del directorio gratuito y solicitar su incorporación sin encontrarse con información falsa, páginas vacías o acciones rotas.

---

## 1. Visión

Convertir **Perulineras** en la plataforma de consulta de referencia sobre infraestructura de recarga para vehículos eléctricos en Perú y, simultáneamente, en una empresa de **ingeniería e integración de soluciones de recarga**.

**Principio rector:** el **mapa de electrolineras es el producto digital principal y debe dominar visual y funcionalmente la página de inicio**. Los servicios comerciales complementan al mapa, no lo desplazan.

## 2. Propuesta de valor y mensajes

- **Mensaje principal de plataforma:** «Encuentra electrolineras en Perú».
- **Mensaje principal de servicios:** «Te ayudamos a instalar tu electrolinera».
- **Descripción corporativa:** «Perulineras conecta a usuarios, empresas y proveedores de infraestructura de recarga. Además, desarrolla soluciones de ingeniería, suministro, integración e instalación para hogares, negocios y flotas».
- No presentar a Perulineras únicamente como una tienda de cargadores, un instalador eléctrico o un directorio de terceros.
- No afirmar cobertura nacional exhaustiva, disponibilidad en tiempo real ni liderazgo de mercado sin datos verificables.

## 3. Públicos objetivo

1. Conductores de vehículos eléctricos que buscan dónde recargar.
2. Propietarios que necesitan instalar un cargador en casa o cochera.
3. Hoteles, grifos, estacionamientos, comercios y otros establecimientos interesados en ofrecer recarga.
4. Empresas y operadores de flotas que necesitan infraestructura de carga.
5. Fabricantes, distribuidores, instaladores, especialistas e integradores que desean captar clientes.

## 4. Arquitectura de información

Navegación principal propuesta:

1. **Mapa de electrolineras** — consulta pública, prioridad máxima.
2. **Instala tu electrolinera** — diagnóstico, ingeniería, integración, instalación y solicitud de evaluación.
3. **Proveedores** — directorio de empresas registradas y autorizadas.
4. **Registra tu empresa** — incorporación gratuita inicial al directorio.
5. **Nosotros / Contacto** — identidad, alcance y contacto.

La portada debe mostrar el mapa de manera predominante, con buscador y acceso claro a «Instala tu electrolinera». Evitar secciones decorativas o textos genéricos que resten espacio al mapa.

## 5. Requisitos del mapa (prioridad P0)

- Mapa interactivo como elemento central de la página de inicio, usable en móvil y escritorio.
- Mostrar estaciones de recarga con marcadores y ficha al seleccionarlas.
- Búsqueda por ubicación o nombre; filtros previstos por tipo de conector, potencia y tipo de acceso, **solo cuando existan datos suficientes**.
- Ficha de estación: nombre, dirección/ubicación, conectores, potencia, condiciones de acceso y fuente/fecha de verificación, cuando estén disponibles.
- Diferenciar explícitamente información verificada, no verificada y datos desconocidos.
- No inventar estaciones, características, precios ni estados operativos.
- Preparar una estructura de datos mantenible que permita incorporar y actualizar estaciones posteriormente.
- Facilitar que usuarios o establecimientos reporten altas, cambios y errores, con revisión antes de publicar.

## 6. «Te ayudamos a instalar tu electrolinera» (P0)

El servicio debe abarcar, según el caso:

1. Evaluación de necesidad y condiciones eléctricas existentes.
2. Dimensionamiento y diseño de la solución.
3. Selección e integración de equipos y proveedores, sin exclusividad obligatoria de marca.
4. Suministro, coordinación de instalación, pruebas y puesta en servicio.
5. Consultoría y estudios de factibilidad para proyectos comerciales o de flotas.

**Captación comercial:** botón «Solicitar evaluación» con formulario breve: nombre, medio de contacto, ciudad, tipo de cliente, tipo de inmueble/proyecto y descripción de la necesidad. Solicitar solo datos necesarios e informar sobre su tratamiento.

No prometer instalación de cualquier potencia sin evaluación técnica previa.

## 7. Directorio de proveedores (P1)

**Objetivo:** conectar la demanda generada por la plataforma con fabricantes, distribuidores, instaladores y otros especialistas.

### Incorporación y autorización

- **Ningún proveedor debe publicarse como participante del directorio sin su autorización previa.**
- La inscripción será **gratuita en la etapa inicial**.
- Crear un formulario de registro con razón social, nombre comercial, categorías, cobertura, contacto comercial, sitio web (si existe), descripción y logotipo (si se autoriza su uso).
- Incorporar aceptación expresa de términos de publicación y tratamiento de datos, registrando fecha y versión de la autorización.
- Revisar y aprobar manualmente los perfiles antes de publicarlos.
- Permitir al proveedor solicitar corrección o retiro de su perfil.
- No copiar logotipos, fotografías ni descripciones de terceros sin autorización o licencia adecuada.

### Experiencia del directorio

- Listado público con filtros por categoría, ubicación/cobertura y tipo de servicio.
- Ficha individual por proveedor con datos autorizados y botón de contacto o solicitud de cotización.
- Distinguir con claridad perfiles propios de Perulineras, terceros, contenido patrocinado y resultados orgánicos.
- No presentar un proveedor como «certificado» o «recomendado» sin criterios comprobables.

## 8. Marketplace: evolución gradual (P2)

**Fase 1 — Directorio:** perfiles gratuitos autorizados y contactos comerciales.

**Fase 2 — Solicitudes de cotización:** usuarios envían requerimientos y proveedores participantes pueden responder. Definir consentimiento para compartir datos de contacto con proveedores.

**Fase 3 — Marketplace transaccional:** evaluar catálogos, comparación de ofertas, comisiones y pagos **solo tras validar demanda y capacidad operativa**.

No desarrollar todavía pagos, carritos ni comisiones automatizadas como requisito del primer lanzamiento.

## 9. Monetización

- **Inicio:** registro y perfil básico gratuitos para captar oferta.
- **Cuando exista tracción demostrable:** planes profesionales voluntarios, perfiles destacados, publicidad claramente identificada y herramientas de generación de oportunidades comerciales.
- Mantener preferentemente una ficha básica gratuita para no vaciar el directorio.
- No activar cobros retroactivos ni convertir perfiles gratuitos en pagados sin comunicación y aceptación explícita.
- Evaluar ingresos adicionales por ingeniería, integración, instalación y consultoría.

**Indicadores para decidir monetización:** visitas al mapa, usuarios que consultan fichas, proveedores activos, solicitudes de evaluación, solicitudes de cotización y contactos comerciales generados.

## 10. Experiencia, confianza y cumplimiento

- Diseño limpio, técnico, accesible, rápido y adaptable a móviles.
- Llamadas a la acción diferenciadas: «Buscar electrolinera», «Instalar mi electrolinera» y «Registrar mi empresa».
- Formularios con validación, protección antispam y confirmación de envío.
- Política de privacidad y términos apropiados al tratamiento de datos personales en Perú; validar su redacción antes de operar los formularios.
- Indicar que las características y disponibilidad de las estaciones deben confirmarse con su operador cuando no haya verificación actualizada.
- Evitar afirmaciones comerciales o técnicas que no estén sustentadas.

## 11. Priorización de implementación

| Prioridad | Entregable | Alcance |
|---|---|---|
| **P0** | Portada centrada en el mapa | Mapa prominente, navegación clara y fichas según datos disponibles |
| **P0** | Página de instalación | Servicios, propuesta de valor y formulario de evaluación |
| **P1** | Directorio de proveedores | Registro gratuito, autorización, revisión y perfiles públicos |
| **P1** | Gestión de datos | Actualización de estaciones y proveedores; reportes de corrección |
| **P2** | Solicitudes de cotización | Captación y distribución consentida de oportunidades |
| **P2** | Planes comerciales | Destacados, suscripciones y analítica para proveedores |
| **P3** | Marketplace transaccional | Catálogos, operaciones y pagos, sujeto a validación |

## 12. Instrucciones para Claude

1. **Audita primero el repositorio y el landing existente.** Identifica qué se puede conservar y qué contenido no responde a esta visión.
2. Presenta una propuesta breve de estructura y cambios antes de introducir dependencias o servicios externos.
3. **No elimines ni sustituyas datos reales del mapa sin respaldo.** No uses estaciones ni proveedores ficticios en producción.
4. Prioriza la portada con mapa y el embudo «Instala tu electrolinera»; deja el marketplace transaccional fuera del alcance inicial.
5. Diseña el directorio para registro gratuito con autorización y aprobación previa a publicación.
6. Mantén componentes y modelos de datos reutilizables para futuras fases.
7. Explica qué quedó implementado, qué necesita credenciales/datos y qué sigue pendiente.
8. Evita textos de relleno, promesas de liderazgo no demostradas y funciones que aparenten operar sin estar conectadas.

## 13. Criterio de aceptación del primer lanzamiento

Una persona debe poder entrar a Perulineras y comprender inmediatamente **dónde consultar puntos de recarga** y **cómo solicitar ayuda para instalar uno**. Un proveedor debe entender que podrá incorporarse gratuitamente al directorio, sujeto a autorización y revisión, aunque esa funcionalidad se publique en una fase posterior.

**Puerta de salida comercial:** no iniciar envíos masivos ni individuales de invitación hasta superar la lista de condiciones del apartado 0 y comprobar el contacto/registro en producción.
