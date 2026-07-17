# Estrategia de caché y carga de EpistemicLab

## Diagnóstico medido — 17 de julio de 2026

- Producción está servida por GitHub Pages (`Server: GitHub.com`), no por Vercel.
- GitHub Pages entrega HTML, CSS, JavaScript y `sw.js` con `Cache-Control: max-age=600`.
- El Service Worker anterior aplicaba `stale-while-revalidate` a todo recurso estático del mismo origen. Eso podía ejecutar JavaScript antiguo durante la primera visita posterior a un despliegue.
- El sitio generado contiene 130 archivos y aproximadamente 2.1 MB. Cinco exportaciones JSON representan más de la mitad del peso total.
- `diagnostic-sba` esperaba en silencio mientras resolvía acceso, sesión y la función `get-sba-bank`.
- Varias capas creaban su propio cliente Supabase con la misma clave de almacenamiento.

## Objetivos

1. Nunca ejecutar HTML, JavaScript o CSS incompatible con el despliegue actual.
2. Mostrar contenido útil o un estado de carga en menos de 1 segundo.
3. Reutilizar agresivamente recursos inmutables.
4. No almacenar respuestas, rúbricas ni datos personales en cachés públicas.
5. Poder invalidar un despliegue sin pedir al usuario que limpie manualmente el navegador.

## Política por tipo de recurso

| Recurso | Estrategia | Vigencia | Motivo |
| --- | --- | --- | --- |
| Navegaciones HTML | Network-first, `cache: no-store`, fallback offline | Solo respaldo offline | El HTML decide qué versiones de assets cargar. |
| JS/CSS con `?v=` o nombre con hash | Cache-first | Hasta que cambie la URL | Son inmutables por definición. |
| JS/CSS sin versión | Network-first, revalidación obligatoria | Temporal | Evita ejecutar código antiguo mientras se completa el versionado. |
| Iconos, imágenes y fuentes | Cache-first | 30–365 días lógicos | Cambian poco y no contienen estado de usuario. |
| JSON estático grande | Stale-while-revalidate, carga bajo demanda | Según versión del catálogo | No debe retrasar rutas que no lo necesitan. |
| Supabase Auth y datos de usuario | Network-only | Sin caché compartida | Son privados y sensibles a cambios de sesión. |
| Banco SBA seguro | Memoria o `sessionStorage`, máximo 5–10 min | Por usuario y versión | Solo después de retirar respuestas y rúbricas del payload. |

## Fase 0 — aplicada con la corrección actual

- Nuevo namespace del Service Worker: `epistemiclab-v3`.
- Navegaciones fuerzan red y conservan fallback offline.
- JS/CSS sin versión usan network-first.
- Assets versionados usan cache-first.
- `diagnostic-sba` usa URLs versionadas para su runtime, estilos y autenticación.
- Un único cliente Supabase se comparte entre acceso, sincronización y token.
- El selector muestra `Validando tu acceso…` y `Cargando preguntas…`; también presenta un error recuperable.

## Fase 1 — assets con hash de contenido

Actualizar `tools/build-static.js` para:

1. Generar nombres como `diagnostic-sba.a1b2c3d4.js` y `diagnostic-sba.91ef2230.css`.
2. Reescribir automáticamente las referencias de cada HTML.
3. Emitir `asset-manifest.json` para auditoría y precache.
4. Precachear únicamente el shell mínimo y sus archivos con hash.
5. Eliminar los parámetros `?v=` manuales cuando todo recurso crítico tenga hash.

Resultado esperado: carga instantánea desde caché y actualización atómica porque cada despliegue usa URLs nuevas.

## Fase 2 — reducir JavaScript bloqueante por ruta

- Cargar con `defer` los scripts que mantienen dependencia por orden.
- Separar el runtime mínimo de acceso/render del conjunto de analítica, coaching y sincronización.
- Inicializar analítica y sincronización después de mostrar la primera pantalla o mediante `requestIdleCallback` con fallback.
- Importar los módulos pedagógicos únicamente cuando comienza una sesión.
- No descargar los JSON del catálogo hasta entrar en SAT o simulación.

Presupuesto propuesto por ruta antes de interacción:

- HTML comprimido: menos de 20 KB.
- JavaScript inicial comprimido: menos de 100 KB.
- CSS inicial comprimido: menos de 30 KB.
- Máximo una llamada de autenticación y una instancia Supabase.

## Fase 3 — aplicada en Supabase

La función selecciona en servidor solo la cantidad solicitada por el modo: 5, 10, 25 o 50 elementos. La selección es aleatoria y excluye, por usuario, las preguntas ya validadas durante el ciclo actual. Una pregunta no se consume por abrirla: se registra al validar la respuesta. El ciclo aumenta únicamente cuando el usuario completó todo el banco disponible.

El simulacro conserva la distribución RA1/RA2/RA3/RA4/RA5 y rellena desde otras áreas si un bloque está temporalmente agotado al final del ciclo. Si quedan menos preguntas inéditas que el tamaño solicitado, entrega solamente las restantes para no saltarse ninguna.

Antes de permitir caché de sesión, el payload debe excluir de forma verificable:

- respuesta correcta o `gold`;
- cadenas causales completas;
- retroalimentación por modo;
- rúbricas y micro-drills que revelen la solución.

La función puede recibir modo, identificadores recientes y una semilla de sesión; debe devolver únicamente la proyección segura. Añadir `Server-Timing` permitirá separar duración de autenticación, consulta y serialización.

## Fase 4 — observabilidad y presupuestos

- Registrar `navigationStart → selector visible → preguntas visibles`.
- Enviar a Sentry solo tiempos y códigos de error, nunca contenido de preguntas o respuestas.
- Hacer obligatorios en CI los límites de Lighthouse actualmente informativos.
- Probar cada despliegue con dos perfiles: navegador limpio y navegador con Service Worker/caché del despliegue anterior.
- Fallar CI si un HTML referencia un asset inexistente o si dos páginas crean más de un cliente Supabase.

## Criterios de aceptación

- Un usuario con la versión anterior abre la versión nueva sin recarga manual.
- El selector aparece en menos de 1 segundo en una conexión móvil razonable.
- La carga de preguntas siempre muestra progreso y termina en contenido o error accionable.
- Ningún 404 de assets en las 19 rutas.
- Ninguna advertencia `Multiple GoTrueClient instances`.
- Los flujos offline siguen abriendo el shell, sin cachear Auth ni respuestas privadas.
