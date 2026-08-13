# EpistemicLab Dashboard

Aplicación web estática de EpistemicLab. La interfaz se publica desde este
repositorio y usa Supabase para autenticación, datos y funciones de servidor.

## Estructura principal

- `index.html`, `platform-nav.*`: entrada y navegación compartida.
- `login/`, `profile/`, `dashboard/`, `admin/`: cuenta y seguimiento.
- `diagnostic-sba/`, `open-response-lab/`, `sat-lab/`: experiencias de práctica.
- `adaptive-session/`, `adaptive-review/`, `full-simulation-v2/`: aprendizaje y simulación.
- `shared/`: módulos reutilizados por varias páginas.
- `supabase/`: migraciones y funciones de servidor.
- `tests/`: pruebas automatizadas mantenidas.
- `docs/product/`, `docs/governance/`: definición vigente del producto y su gobierno.
- `contracts/`: contratos de datos estables.

## Validación local

```sh
npm install
npm test
npm run audit:dependencies
```

`npm test` regenera primero `system_state.json` usando evidencia real del
repositorio. Para comprobar que el archivo ya está actualizado sin modificarlo:

```sh
npm run state:check
```

El comando reúne las pruebas basadas en `node:test` y los validadores
deterministas del catálogo, perfiles, aprendizaje, mentor y simulación. Las
pruebas históricas que dependían de Jest, rutas retiradas o datos privados ya
no forman parte del repositorio.

## Fuentes vigentes

- `system_state.json`: inventario generado; no se edita manualmente.
- `docs/product/`: definición del producto y su identidad.
- Bottle Lab Pro + Label Lab Pro Generation 1: closed — see [docs/product/BOTTLE_LABEL_GENERATION_1_CLOSURE.md](docs/product/BOTTLE_LABEL_GENERATION_1_CLOSURE.md).
- `docs/governance/`: reglas de gobierno y cambio.
- `docs/ACCESS_MATRIX_V1.md` y `docs/ACCESS_SESSION_CONTRACT_V1.md`: contratos de acceso.
- `contracts/`: contratos de datos verificables.
- `canonical-wine-catalog/profiles/`: fuente canónica de vinos.

Los archivos dentro de `canonical-wine-catalog/exports/` son derivados. Sólo se
versionan los que consume directamente la aplicación estática.

## Publicación

El dominio de producción está definido en `CNAME`. Los secretos de Supabase no
deben almacenarse en el repositorio; las claves públicas del navegador viven en
`shared/supabase-public-config.js`.
