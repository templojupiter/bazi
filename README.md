# Soul Connection

Experiencia web inmersiva y cinematográfica para Soul Connection — una experiencia de movimiento y conexión humana (danza, yoga, constelaciones familiares, biodanza, arte, coaching y aventura, no solo un retiro de baile). HTML/CSS/JS puro (sin build step), Three.js para el sistema de partículas del hero, GSAP + ScrollTrigger para la narrativa de scroll.

## Cómo correrlo

El sitio usa `fetch()` para leer `data/retiro.json`, lo que requiere servirlo por HTTP (no `file://`):

```bash
npx serve .
# o
python3 -m http.server 8000
```

Si se abre directamente como archivo, el sitio sigue funcionando: cada dato muestra `[COMPLETAR]` como placeholder visible en el HTML.

## Arquitectura

```
/index.html
/css/
  main.css          brand system: variables, tipografía, botones
  animations.css     cursor, reveals, hilo de luz, sonido
  components.css      layout de cada sección
  responsive.css       mobile
/js/
  main.js             orquestación + carga de data/retiro.json
  scene.js             hero: Three.js, silueta de partículas, respiración
  particles.js          campo de partículas 2D reutilizable (connection, need-today)
  scroll.js              narrativa GSAP ScrollTrigger (escenas 01–04)
  cursor.js               cursor custom (desktop only)
  interactions.js          nav, day-rail, prácticas, guías, magnetic buttons
  form.js                   formulario íntimo paso a paso + WhatsApp
/data/retiro.json           fuente única de verdad
```

## Regla del proyecto: no inventar datos

`data/retiro.json` es la única fuente de contenido variable (fechas, precio, facilitadores, testimonios, WhatsApp, Instagram). Todo lo que aparece como `[COMPLETAR]` o como array vacío es un dato real que falta — nunca fue inventado y no debe reemplazarse por contenido ficticio. Para publicar el sitio con contenido real, completar ese archivo; el HTML se actualiza solo vía `main.js`.

Confirmado: `retiro.fecha` (15 de noviembre — falta el año), `duracion` (10:00–18:00), `ubicacion` (Quinta Don Patricio Eventos, Moreno), y el cronograma real del día en `programa[]`.

Campos pendientes clave:
- `contacto.whatsapp_numero`, `instagram_url`, `email`
- `retiro.lugar_descripcion`, año exacto de la fecha
- `facilitadores[].nombre` — ya confirmados los roles (anfitriona, guía de Yoga, guía de Constelaciones Familiares, guía de Biodanza), faltan los nombres
- `programa[2].descripcion` (almuerzo)
- `practicas[].descripcion` (Danza, Bienestar, Arte, Juego, Coaching, Aventura)
- `testimonios` (array vacío — solo testimonios reales, no hay ninguno todavía)
- `inversion.monto`, `sena`, `formas_de_pago`, `cupos`

## Fotografía

No hay fotografías reales del retiro disponibles todavía. Las secciones que las necesitan (`#retreat`, `#dance`, `#place`) usan `.photo-placeholder`, un bloque con degradado y una etiqueta visible ("Espacio para fotografía real") — nunca una imagen de stock haciéndose pasar por una foto real del retiro. Reemplazar esos `<div class="photo-placeholder">` por `<img>` reales cuando estén disponibles.

## Accesibilidad y rendimiento

- `prefers-reduced-motion`: desactiva el canvas WebGL del hero y las animaciones fuertes; el contenido sigue siendo completamente accesible.
- El conteo de partículas se adapta según `navigator.deviceMemory` / `hardwareConcurrency` y ancho de pantalla (`js/particles.js`, `js/scene.js`).
- Cursor custom desactivado en touch.
- Sonido ambiente: off por defecto, sin autoplay (agregar fuente real en el `<audio>` del `<body>`).
