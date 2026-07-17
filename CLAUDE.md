## Delegación a Codex por tamaño de tarea

Antes de escribir o modificar código, evalúa el alcance de la petición:

**Delega a Codex (usa /codex:rescue con un prompt autocontenido) cuando:**
- La tarea toca muchos archivos (más de ~5) o requiere un refactor extenso.
- Es un cambio mecánico y repetitivo (renombrar, extraer, mover patrones across files).
- El diff esperado es grande (cientos de líneas) y no requiere juicio fino de seguridad/lógica de negocio.

**Hazlo tú mismo (sin delegar) cuando:**
- Es un cambio pequeño o acotado a 1-2 archivos.
- Toca lógica sensible: seguridad, autenticación, pagos, permisos, o decisiones de arquitectura.
- Requiere entender contexto profundo del negocio antes de tocar código.

Si decides delegar, arma un prompt autocontenido para Codex (incluye contexto necesario,
sin asumir que Codex vio la conversación previa). Después, **siempre verifica el diff real
línea por línea** — no confíes en el "listo" que reporte Codex.

Si tienes duda de qué categoría aplica, pregúntame antes de decidir.
