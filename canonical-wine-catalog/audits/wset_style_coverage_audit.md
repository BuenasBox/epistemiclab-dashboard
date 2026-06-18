# CWP-AUDIT-01B - Auditoria de cobertura WSET reextraida desde especificacion

Fecha: 2026-06-18  
Alcance: auditoria documental del Canonical Wine Catalog contra la especificacion WSET. No se agregaron ni modificaron perfiles de vino.

## Fuentes

- Fuente primaria obligatoria para extraccion: `C:\Dev\WSET-AI-System-push\knowledge\official-wset\specification\wset_l3wines_specification_es_highres_aug2023_issue201.md`
- Seccion exacta localizada: `Recomendaciones de Vinos para Catar`, lineas 1501-1951 del Markdown.
- Libro oficial WSET Nivel 3 en Vinos usado como contraste de contenido y del origen de los perfiles actuales: `D:\Descargas\Phone Link\WSET3_rebuilt.md`
- Catalogo actual comparado: `canonical-wine-catalog/profiles/`

## Evidencia de reextraccion

Se creo `canonical-wine-catalog/audits/wset_required_styles_from_spec.csv` como lista fuente estructurada, con un registro por estilo auditable extraido desde la especificacion. Cada registro contiene archivo fuente, seccion, linea o rango de lineas, estilo requerido, categoria, pais, region, appellation/estilo, variedad/mezcla, nivel de requisito y notas.

- Total real extraido desde especificacion: 100
- SHA-256 de `wset_required_styles_from_spec.csv`: `0d267fe1129509e1052455185fec4a37f44e9ed365a798cbe734e8cf2e177c34`
- SHA-256 de `wset_style_coverage_audit.csv`: `20cfd635123f214cea68124a84c1694c6abc4149c9100331a2daad4be6bc142f`
- La matriz de cobertura fue regenerada desde esa lista fuente y ahora incluye `source_line_or_heading` para trazabilidad directa.

## Resumen ejecutivo

- Total de estilos WSET auditados: 100
- Estilos WSET imprescindibles: 58
- Total CUBIERTO: 26
- Total DUPLICADO / SOLAPADO: 5
- Total PARCIALMENTE CUBIERTO: 16
- Total FALTANTE: 52
- Total FUERA DE ALCANCE: 1
- Cobertura efectiva, contando solapados como cubiertos: 31/100
- Imprescindibles faltantes: 24/58
- Cobertura efectiva de imprescindibles: 25/58

## Resultado de comparacion contra matriz anterior

La reextraccion efectiva desde la especificacion conserva los mismos resultados agregados que la auditoria anterior: 100 estilos auditables, 26 cubiertos, 16 parcialmente cubiertos, 52 faltantes, 5 duplicados/solapados y 1 fuera de alcance. La razon de la coincidencia es que la matriz anterior ya estaba basada en la seccion `Recomendaciones de Vinos para Catar`, pero no habia quedado materializada la extraccion fuente. En esta revision la evidencia queda separada en `wset_required_styles_from_spec.csv` y la matriz fue regenerada a partir de esa lista.

## Hallazgo principal

Los 70 perfiles actuales no son suficientes para cubrir la especificacion WSET si el catalogo pretende cubrir la lista oficial de estilos recomendados para catar y las categorias completas del programa. El catalogo actual cubre principalmente vinos tranquilos blancos y tintos. No contiene perfiles de vino espumoso, vino generoso, rosado, Tokaj, Canada, ni una parte importante de tintos de Nuevo Mundo.

## Lista exacta de faltantes

- WSET_STYLE_004: Sauternes o Barsac (France, dulce; spec line 1526)
- WSET_STYLE_006: Bordeaux AC genérico blanco seco (France, blanco; spec line 1536)
- WSET_STYLE_007: Graves o Pessac-Léognan blanco seco con roble (France, blanco; spec line 1537)
- WSET_STYLE_008: Cahors o Madiran (France, tinto; spec line 1544)
- WSET_STYLE_022: Cabernet Franc premium del Loire (France, tinto; spec line 1632)
- WSET_STYLE_023: Muscadet o Muscadet Sur Lie (France, blanco; spec line 1634)
- WSET_STYLE_026: Côtes du Rhône o Côtes du Rhône Villages (France, tinto; spec line 1638)
- WSET_STYLE_029: Corbières, Fitou o Minervois (France, tinto; spec line 1644)
- WSET_STYLE_030: IGP de variedad internacional del sur de Francia (France, blanco/tinto; spec line 1645)
- WSET_STYLE_031: Rosado Côtes de Provence o sur del Ródano (France, rosado; spec line 1647-1648)
- WSET_STYLE_037: Tokaji Aszú (Hungary, dulce; spec line 1714)
- WSET_STYLE_038: Naoussa o Nemea (Greece, tinto; spec line 1738)
- WSET_STYLE_045: Pinot Grigio del Veneto (Italy, blanco; spec line 1747)
- WSET_STYLE_052: Monastrell (p. ej. Jumilla) (Spain, tinto; spec line 1758)
- WSET_STYLE_054: California Cabernet Sauvignon o Merlot premium (USA, tinto; spec line 1762-1763)
- WSET_STYLE_055: California Zinfandel (USA, tinto; spec line 1764)
- WSET_STYLE_057: Willamette Valley Pinot Noir (USA, tinto; spec line 1769)
- WSET_STYLE_058: California Pinot Noir premium (USA, tinto; spec line 1770-1771)
- WSET_STYLE_059: White Zinfandel (USA, rosado; spec line 1775)
- WSET_STYLE_060: Icewine (Canada, dulce; spec line 1779)
- WSET_STYLE_061: Chile Carmenère premium (Chile, tinto; spec line 1799)
- WSET_STYLE_062: Chile tinto económico de volumen (Chile, tinto; spec line 1801)
- WSET_STYLE_063: Chile Cabernet Sauvignon premium (Chile, tinto; spec line 1802-1803)
- WSET_STYLE_065: Argentina Malbec de precio medio (Argentina, tinto; spec line 1807)
- WSET_STYLE_067: Argentina Cabernet Sauvignon o mezcla premium (Argentina, tinto; spec line 1811)
- WSET_STYLE_068: Argentina Malbec premium (Argentina, tinto; spec line 1812)
- WSET_STYLE_069: South Africa Pinotage premium (South Africa, tinto; spec line 1814)
- WSET_STYLE_071: South Africa Cabernet Sauvignon premium (South Africa, tinto; spec line 1818)
- WSET_STYLE_072: Marca económica tinto/blanco de volumen (South Africa, blanco/tinto; spec line 1822)
- WSET_STYLE_073: Australia Shiraz premium (Australia, tinto; spec line 1845)
- WSET_STYLE_074: Australia Cabernet Sauvignon o mezcla Cabernet premium (Australia, tinto; spec line 1846-1847)
- WSET_STYLE_075: Australia Grenache o mezcla Grenache premium (Australia, tinto; spec line 1848)
- WSET_STYLE_078: Australia Chardonnay premium (Australia, blanco; spec line 1852-1853)
- WSET_STYLE_079: Australia Shiraz de otro estilo o nivel (Australia, tinto; spec line 1855)
- WSET_STYLE_080: Australia Pinot Noir premium (Australia, tinto; spec line 1856-1857)
- WSET_STYLE_081: New Zealand Pinot Noir (New Zealand, tinto; spec line 1872)
- WSET_STYLE_083: Hawke’s Bay tinto estilo Burdeos o Syrah (New Zealand, tinto; spec line 1876-1877)
- WSET_STYLE_084: New Zealand Chardonnay premium (New Zealand, blanco; spec line 1879)
- WSET_STYLE_087: Champagne non-vintage (France, espumoso; spec line 1909)
- WSET_STYLE_088: Champagne vintage o prestige cuvée (France, espumoso; spec line 1911)
- WSET_STYLE_089: Crémant (France, espumoso; spec line 1913)
- WSET_STYLE_090: Asti (Italy, espumoso/dulce; spec line 1915)
- WSET_STYLE_091: Prosecco (Italy, espumoso; spec line 1915)
- WSET_STYLE_092: Cava (Spain, espumoso; spec line 1917)
- WSET_STYLE_093: Espumoso método tradicional de Australia/NZ/Sudáfrica/EE. UU. (Australia / New Zealand / South Africa / USA, espumoso; spec line 1922-1923)
- WSET_STYLE_094: Fino o Manzanilla (Spain, fortificado; spec line 1939)
- WSET_STYLE_095: Amontillado seco u Oloroso seco (Spain, fortificado; spec line 1940)
- WSET_STYLE_096: Jerez Medium o Cream (Spain, fortificado/dulce; spec line 1942)
- WSET_STYLE_097: Oporto LBV u Oporto Vintage (Portugal, fortificado/dulce; spec line 1944)
- WSET_STYLE_098: Porto Tawny con indicación de edad (Portugal, fortificado/dulce; spec line 1945)
- WSET_STYLE_099: Muscat de Beaumes-de-Venise (France, fortificado/dulce; spec line 1950)
- WSET_STYLE_100: Rutherglen Muscat (Australia, fortificado/dulce; spec line 1951)

## Faltantes imprescindibles

- WSET_STYLE_004: Sauternes o Barsac (France, dulce; spec line 1526)
- WSET_STYLE_022: Cabernet Franc premium del Loire (France, tinto; spec line 1632)
- WSET_STYLE_026: Côtes du Rhône o Côtes du Rhône Villages (France, tinto; spec line 1638)
- WSET_STYLE_037: Tokaji Aszú (Hungary, dulce; spec line 1714)
- WSET_STYLE_054: California Cabernet Sauvignon o Merlot premium (USA, tinto; spec line 1762-1763)
- WSET_STYLE_055: California Zinfandel (USA, tinto; spec line 1764)
- WSET_STYLE_061: Chile Carmenère premium (Chile, tinto; spec line 1799)
- WSET_STYLE_062: Chile tinto económico de volumen (Chile, tinto; spec line 1801)
- WSET_STYLE_065: Argentina Malbec de precio medio (Argentina, tinto; spec line 1807)
- WSET_STYLE_069: South Africa Pinotage premium (South Africa, tinto; spec line 1814)
- WSET_STYLE_073: Australia Shiraz premium (Australia, tinto; spec line 1845)
- WSET_STYLE_074: Australia Cabernet Sauvignon o mezcla Cabernet premium (Australia, tinto; spec line 1846-1847)
- WSET_STYLE_075: Australia Grenache o mezcla Grenache premium (Australia, tinto; spec line 1848)
- WSET_STYLE_078: Australia Chardonnay premium (Australia, blanco; spec line 1852-1853)
- WSET_STYLE_081: New Zealand Pinot Noir (New Zealand, tinto; spec line 1872)
- WSET_STYLE_087: Champagne non-vintage (France, espumoso; spec line 1909)
- WSET_STYLE_090: Asti (Italy, espumoso/dulce; spec line 1915)
- WSET_STYLE_091: Prosecco (Italy, espumoso; spec line 1915)
- WSET_STYLE_092: Cava (Spain, espumoso; spec line 1917)
- WSET_STYLE_093: Espumoso método tradicional de Australia/NZ/Sudáfrica/EE. UU. (Australia / New Zealand / South Africa / USA, espumoso; spec line 1922-1923)
- WSET_STYLE_094: Fino o Manzanilla (Spain, fortificado; spec line 1939)
- WSET_STYLE_095: Amontillado seco u Oloroso seco (Spain, fortificado; spec line 1940)
- WSET_STYLE_097: Oporto LBV u Oporto Vintage (Portugal, fortificado/dulce; spec line 1944)
- WSET_STYLE_098: Porto Tawny con indicación de edad (Portugal, fortificado/dulce; spec line 1945)

## Cobertura parcial

- WSET_STYLE_001: Bordeaux AC genérico tinto (France, tinto; spec line 1520)
- WSET_STYLE_005: Saint-Émilion, Pomerol o Haut-Médoc de añada más antigua (France, tinto; spec line 1532)
- WSET_STYLE_009: Bourgogne Rouge AC (France, tinto; spec line 1562)
- WSET_STYLE_014: Otro vino de Beaujolais (France, tinto; spec line 1569)
- WSET_STYLE_019: Alsace Vendanges Tardives o Sélection de Grains Nobles (France, dulce; spec line 1585-1586)
- WSET_STYLE_020: Chenin Blanc seco premium del Loire (France, blanco; spec line 1629)
- WSET_STYLE_025: Châteauneuf-du-Pape o Gigondas (France, tinto; spec line 1637)
- WSET_STYLE_027: Syrah del Norte del Ródano de precio medio (France, tinto; spec line 1640)
- WSET_STYLE_033: Riesling seco VDP (Germany, blanco; spec line 1651)
- WSET_STYLE_042: Chianti (Italy, tinto; spec line 1743)
- WSET_STYLE_044: Tinto del sur de Italia (p. ej. Taurasi) (Italy, tinto; spec line 1745)
- WSET_STYLE_053: Douro, Dão o Alentejo tinto (Portugal, tinto; spec line 1760)
- WSET_STYLE_064: Chile Chardonnay o Sauvignon Blanc (Chile, blanco; spec line 1805)
- WSET_STYLE_070: South Africa Chenin Blanc con roble premium (South Africa, blanco; spec line 1816)
- WSET_STYLE_076: Eden Valley o Clare Valley Riesling (Australia, blanco; spec line 1850)
- WSET_STYLE_085: New Zealand Sauvignon Blanc con roble (New Zealand, blanco; spec line 1880)

## Duplicados / solapados detectados

- WSET_STYLE_036: Grüner Veltliner austríaco (Austria, blanco; spec line 1658)
- WSET_STYLE_039: Barolo o Barbaresco (Italy, tinto; spec line 1740)
- WSET_STYLE_043: Chianti Classico Riserva o Brunello di Montalcino (Italy, tinto; spec line 1744)
- WSET_STYLE_046: Pinot Grigio Alto Adige, Trentino o Friuli (Italy, blanco; spec line 1749)
- WSET_STYLE_051: Rías Baixas o Rueda (Spain, blanco; spec line 1756)

## Fuera de alcance

- WSET_STYLE_086: Vino naranja de cualquier país/región (Any, fuera_de_alcance; spec line 1887)

## Recomendaciones de nuevos batches

1. Batch 010 - Dulces y botrytizados: Sauternes/Barsac, Tokaji Aszu, Canada Icewine y Alsace VT/SGN dedicado.
2. Batch 011 - Loire, Bordeaux y sur de Francia faltantes: Bordeaux blanco seco, Graves/Pessac-Leognan blanco, Loire Cabernet Franc, Muscadet, Cotes du Rhone, Provence rose y Corbieres/Fitou/Minervois.
3. Batch 012 - Tintos de Nuevo Mundo I: California Cabernet/Merlot, Zinfandel, Oregon Pinot Noir, California Pinot Noir, Chile Carmenere, Chile Cabernet y Malbec argentino.
4. Batch 013 - Tintos de Nuevo Mundo II: Pinotage, South Africa Cabernet, Australia Shiraz, Australia Cabernet, Australia Grenache, Australia Pinot Noir, New Zealand Pinot Noir y Hawke's Bay red.
5. Batch 014 - Blancos de Nuevo Mundo faltantes: Chile Chardonnay, Australia Chardonnay, Eden Valley Riesling, New Zealand Chardonnay y Sauvignon Blanc con roble.
6. Batch 015 - Espumosos: Champagne NV, Champagne vintage/prestige, Cremant, Asti, Prosecco, Cava y metodo tradicional de Australia/NZ/Sudafrica/EE. UU.
7. Batch 016 - Generosos: Fino/Manzanilla, Amontillado/Oloroso seco, Medium/Cream Sherry, LBV/Vintage Port, aged Tawny Port, Muscat de Beaumes-de-Venise y Rutherglen Muscat.
8. Batch 017 - Iberia/Italia/Grecia opcionales: Monastrell/Jumilla, Alentejo tinto, Pinot Grigio Veneto, Naoussa/Nemea, y perfiles separados si se quiere reducir solapamiento en Chianti/Brunello o Barolo/Barbaresco.

## Impacto sobre IDs actuales

- Mantener estables `SAT_WINE_001` a `SAT_WINE_070`. No conviene renumerar porque las exportaciones, recomendaciones post-cata y mapas de render dependen de esos IDs.
- Los nuevos perfiles deberian agregarse append-only desde `SAT_WINE_071`.
- Los solapamientos actuales no requieren borrar perfiles; son utiles para practica regional. Se recomienda mantener la tabla de mapeo WSET-style -> perfiles CWP para evitar duplicar sin intencion.

## Mantener 70 o ampliar

Conviene ampliar. Mantener 70 solo seria defendible si el catalogo se declara explicitamente como subconjunto de vinos tranquilos blanco/tinto. Para cobertura WSET Nivel 3, el catalogo deberia crecer al menos a 115-125 perfiles, dependiendo de si los estilos opcionales agrupados se implementan como perfiles compuestos o separados.

## Tabla de comparacion fuente vs cobertura

| ID | Prioridad | Estilo WSET extraido | Pais | Region | Categoria | Estado | Perfiles CWP | Linea spec |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WSET_STYLE_001 | Imprescindible | Bordeaux AC genérico tinto | France | Bordeaux | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_052; SAT_WINE_053 | 1520 |
| WSET_STYLE_002 | Imprescindible | Cru Bourgeois o Haut-Médoc Cru Classé | France | Bordeaux | tinto | CUBIERTO | SAT_WINE_052 | 1521 |
| WSET_STYLE_003 | Imprescindible | Saint-Émilion Grand Cru o Pomerol | France | Bordeaux | tinto | CUBIERTO | SAT_WINE_053 | 1522 |
| WSET_STYLE_004 | Imprescindible | Sauternes o Barsac | France | Bordeaux | dulce | FALTANTE | - | 1526 |
| WSET_STYLE_005 | Opcional | Saint-Émilion, Pomerol o Haut-Médoc de añada más antigua | France | Bordeaux | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_052; SAT_WINE_053 | 1532 |
| WSET_STYLE_006 | Opcional | Bordeaux AC genérico blanco seco | France | Bordeaux | blanco | FALTANTE | - | 1536 |
| WSET_STYLE_007 | Opcional | Graves o Pessac-Léognan blanco seco con roble | France | Bordeaux | blanco | FALTANTE | - | 1537 |
| WSET_STYLE_008 | Opcional | Cahors o Madiran | France | Dordogne / South West France | tinto | FALTANTE | - | 1544 |
| WSET_STYLE_009 | Imprescindible | Bourgogne Rouge AC | France | Burgundy | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_054 | 1562 |
| WSET_STYLE_010 | Imprescindible | Côte d’Or Village o Premier Cru tinto | France | Burgundy | tinto | CUBIERTO | SAT_WINE_054 | 1563 |
| WSET_STYLE_011 | Imprescindible | Beaujolais AC, Beaujolais Villages o Cru | France | Beaujolais | tinto | CUBIERTO | SAT_WINE_055 | 1564 |
| WSET_STYLE_012 | Imprescindible | Chablis Village o Premier Cru | France | Burgundy | blanco | CUBIERTO | SAT_WINE_001 | 1566 |
| WSET_STYLE_013 | Imprescindible | Côte d’Or Village o Premier Cru blanco | France | Burgundy | blanco | CUBIERTO | SAT_WINE_002 | 1567 |
| WSET_STYLE_014 | Opcional | Otro vino de Beaujolais | France | Beaujolais | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_055 | 1569 |
| WSET_STYLE_015 | Opcional | Mâcon o Mâcon Villages | France | Burgundy | blanco | CUBIERTO | SAT_WINE_003 | 1571 |
| WSET_STYLE_016 | Imprescindible | Alsace Riesling seco o casi seco | France | Alsace | blanco | CUBIERTO | SAT_WINE_005 | 1576-1577 |
| WSET_STYLE_017 | Imprescindible | Alsace Gewurztraminer seco o casi seco | France | Alsace | blanco | CUBIERTO | SAT_WINE_006 | 1576-1578 |
| WSET_STYLE_018 | Imprescindible | Alsace Pinot Gris seco o casi seco | France | Alsace | blanco | CUBIERTO | SAT_WINE_007 | 1576-1579 |
| WSET_STYLE_019 | Opcional | Alsace Vendanges Tardives o Sélection de Grains Nobles | France | Alsace | dulce | PARCIALMENTE CUBIERTO | SAT_WINE_006; SAT_WINE_007; SAT_WINE_008 | 1585-1586 |
| WSET_STYLE_020 | Imprescindible | Chenin Blanc seco premium del Loire | France | Loire Valley | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_010 | 1629 |
| WSET_STYLE_021 | Imprescindible | Sancerre o Pouilly-Fumé | France | Loire Valley | blanco | CUBIERTO | SAT_WINE_009 | 1630 |
| WSET_STYLE_022 | Imprescindible | Cabernet Franc premium del Loire | France | Loire Valley | tinto | FALTANTE | - | 1632 |
| WSET_STYLE_023 | Opcional | Muscadet o Muscadet Sur Lie | France | Loire Valley | blanco | FALTANTE | - | 1634 |
| WSET_STYLE_024 | Imprescindible | Syrah premium del Norte del Ródano | France | Northern Rhône | tinto | CUBIERTO | SAT_WINE_056 | 1636 |
| WSET_STYLE_025 | Imprescindible | Châteauneuf-du-Pape o Gigondas | France | Southern Rhône | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_057 | 1637 |
| WSET_STYLE_026 | Imprescindible | Côtes du Rhône o Côtes du Rhône Villages | France | Southern Rhône | tinto | FALTANTE | - | 1638 |
| WSET_STYLE_027 | Opcional | Syrah del Norte del Ródano de precio medio | France | Northern Rhône | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_056 | 1640 |
| WSET_STYLE_028 | Opcional | Condrieu | France | Northern Rhône | blanco | CUBIERTO | SAT_WINE_011 | 1642 |
| WSET_STYLE_029 | Opcional | Corbières, Fitou o Minervois | France | South of France | tinto | FALTANTE | - | 1644 |
| WSET_STYLE_030 | Opcional | IGP de variedad internacional del sur de Francia | France | South of France | blanco/tinto | FALTANTE | - | 1645 |
| WSET_STYLE_031 | Opcional | Rosado Côtes de Provence o sur del Ródano | France | Provence / Southern Rhône | rosado | FALTANTE | - | 1647-1648 |
| WSET_STYLE_032 | Imprescindible | Riesling alemán con azúcar residual (Kabinett o Spätlese) | Germany | Germany | blanco/dulce | CUBIERTO | SAT_WINE_016; SAT_WINE_017 | 1650 |
| WSET_STYLE_033 | Imprescindible | Riesling seco VDP | Germany | Mosel / Rheingau / Pfalz / Rheinhessen | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_012; SAT_WINE_013; SAT_WINE_014; SAT_WINE_015 | 1651 |
| WSET_STYLE_034 | Opcional | Riesling Auslese o Beerenauslese botrytizado | Germany | Germany | dulce | CUBIERTO | SAT_WINE_018; SAT_WINE_019 | 1653 |
| WSET_STYLE_035 | Opcional | Eiswein | Germany | Germany | dulce | CUBIERTO | SAT_WINE_021 | 1654 |
| WSET_STYLE_036 | Imprescindible | Grüner Veltliner austríaco | Austria | Niederösterreich | blanco | DUPLICADO / SOLAPADO | SAT_WINE_022; SAT_WINE_024; SAT_WINE_025; SAT_WINE_026 | 1658 |
| WSET_STYLE_037 | Imprescindible | Tokaji Aszú | Hungary | Tokaj | dulce | FALTANTE | - | 1714 |
| WSET_STYLE_038 | Opcional | Naoussa o Nemea | Greece | Naoussa / Nemea | tinto | FALTANTE | - | 1738 |
| WSET_STYLE_039 | Imprescindible | Barolo o Barbaresco | Italy | Piemonte | tinto | DUPLICADO / SOLAPADO | SAT_WINE_060; SAT_WINE_061 | 1740 |
| WSET_STYLE_040 | Imprescindible | Valpolicella o Valpolicella Classico | Italy | Veneto | tinto | CUBIERTO | SAT_WINE_058 | 1741 |
| WSET_STYLE_041 | Imprescindible | Amarone della Valpolicella | Italy | Veneto | tinto | CUBIERTO | SAT_WINE_059 | 1742 |
| WSET_STYLE_042 | Imprescindible | Chianti | Italy | Tuscany | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_063 | 1743 |
| WSET_STYLE_043 | Imprescindible | Chianti Classico Riserva o Brunello di Montalcino | Italy | Tuscany | tinto | DUPLICADO / SOLAPADO | SAT_WINE_063; SAT_WINE_064 | 1744 |
| WSET_STYLE_044 | Imprescindible | Tinto del sur de Italia (p. ej. Taurasi) | Italy | Southern Italy | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_065 | 1745 |
| WSET_STYLE_045 | Opcional | Pinot Grigio del Veneto | Italy | Veneto | blanco | FALTANTE | - | 1747 |
| WSET_STYLE_046 | Opcional | Pinot Grigio Alto Adige, Trentino o Friuli | Italy | North-East Italy | blanco | DUPLICADO / SOLAPADO | SAT_WINE_028; SAT_WINE_029; SAT_WINE_030 | 1749 |
| WSET_STYLE_047 | Opcional | Soave o Soave Classico | Italy | Veneto | blanco | CUBIERTO | SAT_WINE_031 | 1750 |
| WSET_STYLE_048 | Imprescindible | Rioja Reserva o Gran Reserva | Spain | Rioja | tinto | CUBIERTO | SAT_WINE_066 | 1752 |
| WSET_STYLE_049 | Imprescindible | Ribera del Duero | Spain | Ribera del Duero | tinto | CUBIERTO | SAT_WINE_067 | 1753 |
| WSET_STYLE_050 | Imprescindible | Priorat | Spain | Priorat | tinto | CUBIERTO | SAT_WINE_068 | 1754 |
| WSET_STYLE_051 | Imprescindible | Rías Baixas o Rueda | Spain | Rías Baixas / Rueda | blanco | DUPLICADO / SOLAPADO | SAT_WINE_038; SAT_WINE_039 | 1756 |
| WSET_STYLE_052 | Opcional | Monastrell (p. ej. Jumilla) | Spain | Levante | tinto | FALTANTE | - | 1758 |
| WSET_STYLE_053 | Opcional | Douro, Dão o Alentejo tinto | Portugal | Douro / Dão / Alentejo | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_069; SAT_WINE_070 | 1760 |
| WSET_STYLE_054 | Imprescindible | California Cabernet Sauvignon o Merlot premium | USA | California | tinto | FALTANTE | - | 1762-1763 |
| WSET_STYLE_055 | Imprescindible | California Zinfandel | USA | California | tinto | FALTANTE | - | 1764 |
| WSET_STYLE_056 | Imprescindible | California Chardonnay premium | USA | California | blanco | CUBIERTO | SAT_WINE_044; SAT_WINE_045 | 1766-1767 |
| WSET_STYLE_057 | Opcional | Willamette Valley Pinot Noir | USA | Oregon | tinto | FALTANTE | - | 1769 |
| WSET_STYLE_058 | Opcional | California Pinot Noir premium | USA | California | tinto | FALTANTE | - | 1770-1771 |
| WSET_STYLE_059 | Opcional | White Zinfandel | USA | California | rosado | FALTANTE | - | 1775 |
| WSET_STYLE_060 | Opcional | Icewine | Canada | Ontario / British Columbia | dulce | FALTANTE | - | 1779 |
| WSET_STYLE_061 | Imprescindible | Chile Carmenère premium | Chile | Cachapoal / Colchagua | tinto | FALTANTE | - | 1799 |
| WSET_STYLE_062 | Imprescindible | Chile tinto económico de volumen | Chile | Central Valley | tinto | FALTANTE | - | 1801 |
| WSET_STYLE_063 | Opcional | Chile Cabernet Sauvignon premium | Chile | Maipo / Cachapoal / Colchagua | tinto | FALTANTE | - | 1802-1803 |
| WSET_STYLE_064 | Opcional | Chile Chardonnay o Sauvignon Blanc | Chile | Casablanca / San Antonio | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_046 | 1805 |
| WSET_STYLE_065 | Imprescindible | Argentina Malbec de precio medio | Argentina | Mendoza | tinto | FALTANTE | - | 1807 |
| WSET_STYLE_066 | Imprescindible | Argentina Torrontés premium | Argentina | Salta | blanco | CUBIERTO | SAT_WINE_047 | 1809 |
| WSET_STYLE_067 | Opcional | Argentina Cabernet Sauvignon o mezcla premium | Argentina | Mendoza | tinto | FALTANTE | - | 1811 |
| WSET_STYLE_068 | Opcional | Argentina Malbec premium | Argentina | Uco / Luján de Cuyo | tinto | FALTANTE | - | 1812 |
| WSET_STYLE_069 | Imprescindible | South Africa Pinotage premium | South Africa | Western Cape | tinto | FALTANTE | - | 1814 |
| WSET_STYLE_070 | Imprescindible | South Africa Chenin Blanc con roble premium | South Africa | Western Cape | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_048 | 1816 |
| WSET_STYLE_071 | Opcional | South Africa Cabernet Sauvignon premium | South Africa | Western Cape | tinto | FALTANTE | - | 1818 |
| WSET_STYLE_072 | Opcional | Marca económica tinto/blanco de volumen | South Africa | Western Cape | blanco/tinto | FALTANTE | - | 1822 |
| WSET_STYLE_073 | Imprescindible | Australia Shiraz premium | Australia | South Australia | tinto | FALTANTE | - | 1845 |
| WSET_STYLE_074 | Imprescindible | Australia Cabernet Sauvignon o mezcla Cabernet premium | Australia | Coonawarra / Margaret River | tinto | FALTANTE | - | 1846-1847 |
| WSET_STYLE_075 | Imprescindible | Australia Grenache o mezcla Grenache premium | Australia | McLaren Vale | tinto | FALTANTE | - | 1848 |
| WSET_STYLE_076 | Imprescindible | Eden Valley o Clare Valley Riesling | Australia | Eden Valley / Clare Valley | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_050 | 1850 |
| WSET_STYLE_077 | Imprescindible | Hunter Valley Semillon | Australia | Hunter Valley | blanco | CUBIERTO | SAT_WINE_049 | 1851 |
| WSET_STYLE_078 | Imprescindible | Australia Chardonnay premium | Australia | Yarra / Mornington / Tasmania | blanco | FALTANTE | - | 1852-1853 |
| WSET_STYLE_079 | Opcional | Australia Shiraz de otro estilo o nivel | Australia | Australia | tinto | FALTANTE | - | 1855 |
| WSET_STYLE_080 | Opcional | Australia Pinot Noir premium | Australia | Yarra / Mornington / Tasmania | tinto | FALTANTE | - | 1856-1857 |
| WSET_STYLE_081 | Imprescindible | New Zealand Pinot Noir | New Zealand | Central Otago / Martinborough / Marlborough | tinto | FALTANTE | - | 1872 |
| WSET_STYLE_082 | Imprescindible | New Zealand Sauvignon Blanc premium | New Zealand | Marlborough | blanco | CUBIERTO | SAT_WINE_051 | 1874 |
| WSET_STYLE_083 | Opcional | Hawke’s Bay tinto estilo Burdeos o Syrah | New Zealand | Hawke’s Bay | tinto | FALTANTE | - | 1876-1877 |
| WSET_STYLE_084 | Opcional | New Zealand Chardonnay premium | New Zealand | Marlborough / Gisborne | blanco | FALTANTE | - | 1879 |
| WSET_STYLE_085 | Opcional | New Zealand Sauvignon Blanc con roble | New Zealand | Marlborough | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_051 | 1880 |
| WSET_STYLE_086 | Opcional | Vino naranja de cualquier país/región | Any | Any | fuera_de_alcance | FUERA DE ALCANCE | - | 1887 |
| WSET_STYLE_087 | Imprescindible | Champagne non-vintage | France | Champagne | espumoso | FALTANTE | - | 1909 |
| WSET_STYLE_088 | Opcional | Champagne vintage o prestige cuvée | France | Champagne | espumoso | FALTANTE | - | 1911 |
| WSET_STYLE_089 | Opcional | Crémant | France | Alsace / Burgundy / Loire | espumoso | FALTANTE | - | 1913 |
| WSET_STYLE_090 | Imprescindible | Asti | Italy | Piemonte | espumoso/dulce | FALTANTE | - | 1915 |
| WSET_STYLE_091 | Imprescindible | Prosecco | Italy | Veneto / Friuli | espumoso | FALTANTE | - | 1915 |
| WSET_STYLE_092 | Imprescindible | Cava | Spain | Catalonia / Spain | espumoso | FALTANTE | - | 1917 |
| WSET_STYLE_093 | Imprescindible | Espumoso método tradicional de Australia/NZ/Sudáfrica/EE. UU. | Australia / New Zealand / South Africa / USA | Tasmania / Marlborough / Cap Classique / California | espumoso | FALTANTE | - | 1922-1923 |
| WSET_STYLE_094 | Imprescindible | Fino o Manzanilla | Spain | Jerez | fortificado | FALTANTE | - | 1939 |
| WSET_STYLE_095 | Imprescindible | Amontillado seco u Oloroso seco | Spain | Jerez | fortificado | FALTANTE | - | 1940 |
| WSET_STYLE_096 | Opcional | Jerez Medium o Cream | Spain | Jerez | fortificado/dulce | FALTANTE | - | 1942 |
| WSET_STYLE_097 | Imprescindible | Oporto LBV u Oporto Vintage | Portugal | Douro | fortificado/dulce | FALTANTE | - | 1944 |
| WSET_STYLE_098 | Imprescindible | Porto Tawny con indicación de edad | Portugal | Douro | fortificado/dulce | FALTANTE | - | 1945 |
| WSET_STYLE_099 | Opcional | Muscat de Beaumes-de-Venise | France | Southern Rhône | fortificado/dulce | FALTANTE | - | 1950 |
| WSET_STYLE_100 | Opcional | Rutherglen Muscat | Australia | Rutherglen | fortificado/dulce | FALTANTE | - | 1951 |
