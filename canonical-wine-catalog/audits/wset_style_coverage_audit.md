# CWP-AUDIT-01 - Auditoria de cobertura WSET

Fecha: 2026-06-18  
Alcance: solo auditoria documental del Canonical Wine Catalog. No se agregaron ni modificaron perfiles de vino.

## Fuentes

- Especificaciones oficiales WSET Nivel 3 en Vinos: `C:\Dev\WSET-AI-System-push\knowledge\official-wset\specification\wset_l3wines_specification_es_highres_aug2023_issue201.md`
- Libro oficial WSET Nivel 3 en Vinos: `D:\Descargas\Phone Link\WSET3_rebuilt.md`
- Catalogo actual: `canonical-wine-catalog/profiles/`

## Criterio de extraccion

Esta auditoria trata los dos documentos WSET como fuentes primarias separadas. Las especificaciones oficiales se usaron para extraer la lista obligatoria y recomendada de estilos, especialmente la seccion `Recomendaciones de Vinos para Catar` y los Bloques 1 de los Resultados de Aprendizaje 2, 3 y 4. El libro oficial `WSET3_rebuilt.md` se uso como fuente primaria complementaria para contrastar el contenido de regiones, variedades, estilos y los perfiles existentes del catalogo.

Cada estilo fue normalizado por pais, region, appellation, variedad y categoria: blanco, tinto, rosado, espumoso, dulce, fortificado o combinaciones cuando WSET define el estilo asi.

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

## Hallazgo principal

Los 70 perfiles actuales no son suficientes para cubrir la especificacion WSET si el catalogo pretende cubrir la lista oficial de estilos recomendados para catar y las categorias completas del programa. El catalogo actual cubre principalmente vinos tranquilos blancos y tintos. No contiene perfiles de vino espumoso, vino generoso, rosado, Tokaj, Canada, ni una parte importante de tintos de Nuevo Mundo.

## Lista exacta de faltantes

- WSET_STYLE_004: Sauternes o Barsac (France, dulce)
- WSET_STYLE_006: Bordeaux AC genérico blanco seco (France, blanco)
- WSET_STYLE_007: Graves o Pessac-Léognan blanco seco con roble (France, blanco)
- WSET_STYLE_008: Cahors o Madiran (France, tinto)
- WSET_STYLE_022: Cabernet Franc premium del Loire (France, tinto)
- WSET_STYLE_023: Muscadet o Muscadet Sur Lie (France, blanco)
- WSET_STYLE_026: Côtes du Rhône o Côtes du Rhône Villages (France, tinto)
- WSET_STYLE_029: Corbières, Fitou o Minervois (France, tinto)
- WSET_STYLE_030: IGP de variedad internacional del sur de Francia (France, blanco/tinto)
- WSET_STYLE_031: Rosado Côtes de Provence o sur del Ródano (France, rosado)
- WSET_STYLE_037: Tokaji Aszú (Hungary, dulce)
- WSET_STYLE_038: Naoussa o Nemea (Greece, tinto)
- WSET_STYLE_045: Pinot Grigio del Veneto (Italy, blanco)
- WSET_STYLE_052: Monastrell (p. ej. Jumilla) (Spain, tinto)
- WSET_STYLE_054: California Cabernet Sauvignon o Merlot premium (USA, tinto)
- WSET_STYLE_055: California Zinfandel (USA, tinto)
- WSET_STYLE_057: Willamette Valley Pinot Noir (USA, tinto)
- WSET_STYLE_058: California Pinot Noir premium (USA, tinto)
- WSET_STYLE_059: White Zinfandel (USA, rosado)
- WSET_STYLE_060: Icewine (Canada, dulce)
- WSET_STYLE_061: Chile Carmenère premium (Chile, tinto)
- WSET_STYLE_062: Chile tinto económico de volumen (Chile, tinto)
- WSET_STYLE_063: Chile Cabernet Sauvignon premium (Chile, tinto)
- WSET_STYLE_065: Argentina Malbec de precio medio (Argentina, tinto)
- WSET_STYLE_067: Argentina Cabernet Sauvignon o mezcla premium (Argentina, tinto)
- WSET_STYLE_068: Argentina Malbec premium (Argentina, tinto)
- WSET_STYLE_069: South Africa Pinotage premium (South Africa, tinto)
- WSET_STYLE_071: South Africa Cabernet Sauvignon premium (South Africa, tinto)
- WSET_STYLE_072: Marca económica tinto/blanco de volumen (South Africa, blanco/tinto)
- WSET_STYLE_073: Australia Shiraz premium (Australia, tinto)
- WSET_STYLE_074: Australia Cabernet Sauvignon o mezcla Cabernet premium (Australia, tinto)
- WSET_STYLE_075: Australia Grenache o mezcla Grenache premium (Australia, tinto)
- WSET_STYLE_078: Australia Chardonnay premium (Australia, blanco)
- WSET_STYLE_079: Australia Shiraz de otro estilo o nivel (Australia, tinto)
- WSET_STYLE_080: Australia Pinot Noir premium (Australia, tinto)
- WSET_STYLE_081: New Zealand Pinot Noir (New Zealand, tinto)
- WSET_STYLE_083: Hawke’s Bay tinto estilo Burdeos o Syrah (New Zealand, tinto)
- WSET_STYLE_084: New Zealand Chardonnay premium (New Zealand, blanco)
- WSET_STYLE_087: Champagne non-vintage (France, espumoso)
- WSET_STYLE_088: Champagne vintage o prestige cuvée (France, espumoso)
- WSET_STYLE_089: Crémant (France, espumoso)
- WSET_STYLE_090: Asti (Italy, espumoso/dulce)
- WSET_STYLE_091: Prosecco (Italy, espumoso)
- WSET_STYLE_092: Cava (Spain, espumoso)
- WSET_STYLE_093: Espumoso método tradicional de Australia/NZ/Sudáfrica/EE. UU. (Australia / New Zealand / South Africa / USA, espumoso)
- WSET_STYLE_094: Fino o Manzanilla (Spain, fortificado)
- WSET_STYLE_095: Amontillado seco u Oloroso seco (Spain, fortificado)
- WSET_STYLE_096: Jerez Medium o Cream (Spain, fortificado/dulce)
- WSET_STYLE_097: Oporto LBV u Oporto Vintage (Portugal, fortificado/dulce)
- WSET_STYLE_098: Porto Tawny con indicación de edad (Portugal, fortificado/dulce)
- WSET_STYLE_099: Muscat de Beaumes-de-Venise (France, fortificado/dulce)
- WSET_STYLE_100: Rutherglen Muscat (Australia, fortificado/dulce)

## Faltantes imprescindibles

- WSET_STYLE_004: Sauternes o Barsac (France, dulce)
- WSET_STYLE_022: Cabernet Franc premium del Loire (France, tinto)
- WSET_STYLE_026: Côtes du Rhône o Côtes du Rhône Villages (France, tinto)
- WSET_STYLE_037: Tokaji Aszú (Hungary, dulce)
- WSET_STYLE_054: California Cabernet Sauvignon o Merlot premium (USA, tinto)
- WSET_STYLE_055: California Zinfandel (USA, tinto)
- WSET_STYLE_061: Chile Carmenère premium (Chile, tinto)
- WSET_STYLE_062: Chile tinto económico de volumen (Chile, tinto)
- WSET_STYLE_065: Argentina Malbec de precio medio (Argentina, tinto)
- WSET_STYLE_069: South Africa Pinotage premium (South Africa, tinto)
- WSET_STYLE_073: Australia Shiraz premium (Australia, tinto)
- WSET_STYLE_074: Australia Cabernet Sauvignon o mezcla Cabernet premium (Australia, tinto)
- WSET_STYLE_075: Australia Grenache o mezcla Grenache premium (Australia, tinto)
- WSET_STYLE_078: Australia Chardonnay premium (Australia, blanco)
- WSET_STYLE_081: New Zealand Pinot Noir (New Zealand, tinto)
- WSET_STYLE_087: Champagne non-vintage (France, espumoso)
- WSET_STYLE_090: Asti (Italy, espumoso/dulce)
- WSET_STYLE_091: Prosecco (Italy, espumoso)
- WSET_STYLE_092: Cava (Spain, espumoso)
- WSET_STYLE_093: Espumoso método tradicional de Australia/NZ/Sudáfrica/EE. UU. (Australia / New Zealand / South Africa / USA, espumoso)
- WSET_STYLE_094: Fino o Manzanilla (Spain, fortificado)
- WSET_STYLE_095: Amontillado seco u Oloroso seco (Spain, fortificado)
- WSET_STYLE_097: Oporto LBV u Oporto Vintage (Portugal, fortificado/dulce)
- WSET_STYLE_098: Porto Tawny con indicación de edad (Portugal, fortificado/dulce)

## Cobertura parcial

- WSET_STYLE_001: Bordeaux AC genérico tinto (France, tinto)
- WSET_STYLE_005: Saint-Émilion, Pomerol o Haut-Médoc de añada más antigua (France, tinto)
- WSET_STYLE_009: Bourgogne Rouge AC (France, tinto)
- WSET_STYLE_014: Otro vino de Beaujolais (France, tinto)
- WSET_STYLE_019: Alsace Vendanges Tardives o Sélection de Grains Nobles (France, dulce)
- WSET_STYLE_020: Chenin Blanc seco premium del Loire (France, blanco)
- WSET_STYLE_025: Châteauneuf-du-Pape o Gigondas (France, tinto)
- WSET_STYLE_027: Syrah del Norte del Ródano de precio medio (France, tinto)
- WSET_STYLE_033: Riesling seco VDP (Germany, blanco)
- WSET_STYLE_042: Chianti (Italy, tinto)
- WSET_STYLE_044: Tinto del sur de Italia (p. ej. Taurasi) (Italy, tinto)
- WSET_STYLE_053: Douro, Dão o Alentejo tinto (Portugal, tinto)
- WSET_STYLE_064: Chile Chardonnay o Sauvignon Blanc (Chile, blanco)
- WSET_STYLE_070: South Africa Chenin Blanc con roble premium (South Africa, blanco)
- WSET_STYLE_076: Eden Valley o Clare Valley Riesling (Australia, blanco)
- WSET_STYLE_085: New Zealand Sauvignon Blanc con roble (New Zealand, blanco)

## Duplicados / solapados detectados

- WSET_STYLE_036: Grüner Veltliner austríaco (Austria, blanco)
- WSET_STYLE_039: Barolo o Barbaresco (Italy, tinto)
- WSET_STYLE_043: Chianti Classico Riserva o Brunello di Montalcino (Italy, tinto)
- WSET_STYLE_046: Pinot Grigio Alto Adige, Trentino o Friuli (Italy, blanco)
- WSET_STYLE_051: Rías Baixas o Rueda (Spain, blanco)

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
- Los solapamientos actuales no requieren borrar perfiles; son utiles para practica regional. Se recomienda marcar los nuevos batches con una tabla de mapeo WSET-style -> perfiles CWP para evitar duplicar sin intencion.

## Mantener 70 o ampliar

Conviene ampliar. Mantener 70 solo seria defendible si el catalogo se declara explicitamente como subconjunto de vinos tranquilos blanco/tinto. Para cobertura WSET Nivel 3, el catalogo deberia crecer al menos a 115-125 perfiles, dependiendo de si los estilos opcionales agrupados se implementan como perfiles compuestos o separados.

## Matriz completa

| ID | Prioridad | Estilo WSET | Pais | Region | Categoria | Estado | Perfiles CWP |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WSET_STYLE_001 | Imprescindible | Bordeaux AC genérico tinto | France | Bordeaux | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_052; SAT_WINE_053 |
| WSET_STYLE_002 | Imprescindible | Cru Bourgeois o Haut-Médoc Cru Classé | France | Bordeaux | tinto | CUBIERTO | SAT_WINE_052 |
| WSET_STYLE_003 | Imprescindible | Saint-Émilion Grand Cru o Pomerol | France | Bordeaux | tinto | CUBIERTO | SAT_WINE_053 |
| WSET_STYLE_004 | Imprescindible | Sauternes o Barsac | France | Bordeaux | dulce | FALTANTE | - |
| WSET_STYLE_005 | Opcional | Saint-Émilion, Pomerol o Haut-Médoc de añada más antigua | France | Bordeaux | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_052; SAT_WINE_053 |
| WSET_STYLE_006 | Opcional | Bordeaux AC genérico blanco seco | France | Bordeaux | blanco | FALTANTE | - |
| WSET_STYLE_007 | Opcional | Graves o Pessac-Léognan blanco seco con roble | France | Bordeaux | blanco | FALTANTE | - |
| WSET_STYLE_008 | Opcional | Cahors o Madiran | France | Dordogne / South West France | tinto | FALTANTE | - |
| WSET_STYLE_009 | Imprescindible | Bourgogne Rouge AC | France | Burgundy | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_054 |
| WSET_STYLE_010 | Imprescindible | Côte d’Or Village o Premier Cru tinto | France | Burgundy | tinto | CUBIERTO | SAT_WINE_054 |
| WSET_STYLE_011 | Imprescindible | Beaujolais AC, Beaujolais Villages o Cru | France | Beaujolais | tinto | CUBIERTO | SAT_WINE_055 |
| WSET_STYLE_012 | Imprescindible | Chablis Village o Premier Cru | France | Burgundy | blanco | CUBIERTO | SAT_WINE_001 |
| WSET_STYLE_013 | Imprescindible | Côte d’Or Village o Premier Cru blanco | France | Burgundy | blanco | CUBIERTO | SAT_WINE_002 |
| WSET_STYLE_014 | Opcional | Otro vino de Beaujolais | France | Beaujolais | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_055 |
| WSET_STYLE_015 | Opcional | Mâcon o Mâcon Villages | France | Burgundy | blanco | CUBIERTO | SAT_WINE_003 |
| WSET_STYLE_016 | Imprescindible | Alsace Riesling seco o casi seco | France | Alsace | blanco | CUBIERTO | SAT_WINE_005 |
| WSET_STYLE_017 | Imprescindible | Alsace Gewurztraminer seco o casi seco | France | Alsace | blanco | CUBIERTO | SAT_WINE_006 |
| WSET_STYLE_018 | Imprescindible | Alsace Pinot Gris seco o casi seco | France | Alsace | blanco | CUBIERTO | SAT_WINE_007 |
| WSET_STYLE_019 | Opcional | Alsace Vendanges Tardives o Sélection de Grains Nobles | France | Alsace | dulce | PARCIALMENTE CUBIERTO | SAT_WINE_006; SAT_WINE_007; SAT_WINE_008 |
| WSET_STYLE_020 | Imprescindible | Chenin Blanc seco premium del Loire | France | Loire Valley | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_010 |
| WSET_STYLE_021 | Imprescindible | Sancerre o Pouilly-Fumé | France | Loire Valley | blanco | CUBIERTO | SAT_WINE_009 |
| WSET_STYLE_022 | Imprescindible | Cabernet Franc premium del Loire | France | Loire Valley | tinto | FALTANTE | - |
| WSET_STYLE_023 | Opcional | Muscadet o Muscadet Sur Lie | France | Loire Valley | blanco | FALTANTE | - |
| WSET_STYLE_024 | Imprescindible | Syrah premium del Norte del Ródano | France | Northern Rhône | tinto | CUBIERTO | SAT_WINE_056 |
| WSET_STYLE_025 | Imprescindible | Châteauneuf-du-Pape o Gigondas | France | Southern Rhône | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_057 |
| WSET_STYLE_026 | Imprescindible | Côtes du Rhône o Côtes du Rhône Villages | France | Southern Rhône | tinto | FALTANTE | - |
| WSET_STYLE_027 | Opcional | Syrah del Norte del Ródano de precio medio | France | Northern Rhône | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_056 |
| WSET_STYLE_028 | Opcional | Condrieu | France | Northern Rhône | blanco | CUBIERTO | SAT_WINE_011 |
| WSET_STYLE_029 | Opcional | Corbières, Fitou o Minervois | France | South of France | tinto | FALTANTE | - |
| WSET_STYLE_030 | Opcional | IGP de variedad internacional del sur de Francia | France | South of France | blanco/tinto | FALTANTE | - |
| WSET_STYLE_031 | Opcional | Rosado Côtes de Provence o sur del Ródano | France | Provence / Southern Rhône | rosado | FALTANTE | - |
| WSET_STYLE_032 | Imprescindible | Riesling alemán con azúcar residual (Kabinett o Spätlese) | Germany | Germany | blanco/dulce | CUBIERTO | SAT_WINE_016; SAT_WINE_017 |
| WSET_STYLE_033 | Imprescindible | Riesling seco VDP | Germany | Mosel / Rheingau / Pfalz / Rheinhessen | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_012; SAT_WINE_013; SAT_WINE_014; SAT_WINE_015 |
| WSET_STYLE_034 | Opcional | Riesling Auslese o Beerenauslese botrytizado | Germany | Germany | dulce | CUBIERTO | SAT_WINE_018; SAT_WINE_019 |
| WSET_STYLE_035 | Opcional | Eiswein | Germany | Germany | dulce | CUBIERTO | SAT_WINE_021 |
| WSET_STYLE_036 | Imprescindible | Grüner Veltliner austríaco | Austria | Niederösterreich | blanco | DUPLICADO / SOLAPADO | SAT_WINE_022; SAT_WINE_024; SAT_WINE_025; SAT_WINE_026 |
| WSET_STYLE_037 | Imprescindible | Tokaji Aszú | Hungary | Tokaj | dulce | FALTANTE | - |
| WSET_STYLE_038 | Opcional | Naoussa o Nemea | Greece | Naoussa / Nemea | tinto | FALTANTE | - |
| WSET_STYLE_039 | Imprescindible | Barolo o Barbaresco | Italy | Piemonte | tinto | DUPLICADO / SOLAPADO | SAT_WINE_060; SAT_WINE_061 |
| WSET_STYLE_040 | Imprescindible | Valpolicella o Valpolicella Classico | Italy | Veneto | tinto | CUBIERTO | SAT_WINE_058 |
| WSET_STYLE_041 | Imprescindible | Amarone della Valpolicella | Italy | Veneto | tinto | CUBIERTO | SAT_WINE_059 |
| WSET_STYLE_042 | Imprescindible | Chianti | Italy | Tuscany | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_063 |
| WSET_STYLE_043 | Imprescindible | Chianti Classico Riserva o Brunello di Montalcino | Italy | Tuscany | tinto | DUPLICADO / SOLAPADO | SAT_WINE_063; SAT_WINE_064 |
| WSET_STYLE_044 | Imprescindible | Tinto del sur de Italia (p. ej. Taurasi) | Italy | Southern Italy | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_065 |
| WSET_STYLE_045 | Opcional | Pinot Grigio del Veneto | Italy | Veneto | blanco | FALTANTE | - |
| WSET_STYLE_046 | Opcional | Pinot Grigio Alto Adige, Trentino o Friuli | Italy | North-East Italy | blanco | DUPLICADO / SOLAPADO | SAT_WINE_028; SAT_WINE_029; SAT_WINE_030 |
| WSET_STYLE_047 | Opcional | Soave o Soave Classico | Italy | Veneto | blanco | CUBIERTO | SAT_WINE_031 |
| WSET_STYLE_048 | Imprescindible | Rioja Reserva o Gran Reserva | Spain | Rioja | tinto | CUBIERTO | SAT_WINE_066 |
| WSET_STYLE_049 | Imprescindible | Ribera del Duero | Spain | Ribera del Duero | tinto | CUBIERTO | SAT_WINE_067 |
| WSET_STYLE_050 | Imprescindible | Priorat | Spain | Priorat | tinto | CUBIERTO | SAT_WINE_068 |
| WSET_STYLE_051 | Imprescindible | Rías Baixas o Rueda | Spain | Rías Baixas / Rueda | blanco | DUPLICADO / SOLAPADO | SAT_WINE_038; SAT_WINE_039 |
| WSET_STYLE_052 | Opcional | Monastrell (p. ej. Jumilla) | Spain | Levante | tinto | FALTANTE | - |
| WSET_STYLE_053 | Opcional | Douro, Dão o Alentejo tinto | Portugal | Douro / Dão / Alentejo | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_069; SAT_WINE_070 |
| WSET_STYLE_054 | Imprescindible | California Cabernet Sauvignon o Merlot premium | USA | California | tinto | FALTANTE | - |
| WSET_STYLE_055 | Imprescindible | California Zinfandel | USA | California | tinto | FALTANTE | - |
| WSET_STYLE_056 | Imprescindible | California Chardonnay premium | USA | California | blanco | CUBIERTO | SAT_WINE_044; SAT_WINE_045 |
| WSET_STYLE_057 | Opcional | Willamette Valley Pinot Noir | USA | Oregon | tinto | FALTANTE | - |
| WSET_STYLE_058 | Opcional | California Pinot Noir premium | USA | California | tinto | FALTANTE | - |
| WSET_STYLE_059 | Opcional | White Zinfandel | USA | California | rosado | FALTANTE | - |
| WSET_STYLE_060 | Opcional | Icewine | Canada | Ontario / British Columbia | dulce | FALTANTE | - |
| WSET_STYLE_061 | Imprescindible | Chile Carmenère premium | Chile | Cachapoal / Colchagua | tinto | FALTANTE | - |
| WSET_STYLE_062 | Imprescindible | Chile tinto económico de volumen | Chile | Central Valley | tinto | FALTANTE | - |
| WSET_STYLE_063 | Opcional | Chile Cabernet Sauvignon premium | Chile | Maipo / Cachapoal / Colchagua | tinto | FALTANTE | - |
| WSET_STYLE_064 | Opcional | Chile Chardonnay o Sauvignon Blanc | Chile | Casablanca / San Antonio | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_046 |
| WSET_STYLE_065 | Imprescindible | Argentina Malbec de precio medio | Argentina | Mendoza | tinto | FALTANTE | - |
| WSET_STYLE_066 | Imprescindible | Argentina Torrontés premium | Argentina | Salta | blanco | CUBIERTO | SAT_WINE_047 |
| WSET_STYLE_067 | Opcional | Argentina Cabernet Sauvignon o mezcla premium | Argentina | Mendoza | tinto | FALTANTE | - |
| WSET_STYLE_068 | Opcional | Argentina Malbec premium | Argentina | Uco / Luján de Cuyo | tinto | FALTANTE | - |
| WSET_STYLE_069 | Imprescindible | South Africa Pinotage premium | South Africa | Western Cape | tinto | FALTANTE | - |
| WSET_STYLE_070 | Imprescindible | South Africa Chenin Blanc con roble premium | South Africa | Western Cape | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_048 |
| WSET_STYLE_071 | Opcional | South Africa Cabernet Sauvignon premium | South Africa | Western Cape | tinto | FALTANTE | - |
| WSET_STYLE_072 | Opcional | Marca económica tinto/blanco de volumen | South Africa | Western Cape | blanco/tinto | FALTANTE | - |
| WSET_STYLE_073 | Imprescindible | Australia Shiraz premium | Australia | South Australia | tinto | FALTANTE | - |
| WSET_STYLE_074 | Imprescindible | Australia Cabernet Sauvignon o mezcla Cabernet premium | Australia | Coonawarra / Margaret River | tinto | FALTANTE | - |
| WSET_STYLE_075 | Imprescindible | Australia Grenache o mezcla Grenache premium | Australia | McLaren Vale | tinto | FALTANTE | - |
| WSET_STYLE_076 | Imprescindible | Eden Valley o Clare Valley Riesling | Australia | Eden Valley / Clare Valley | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_050 |
| WSET_STYLE_077 | Imprescindible | Hunter Valley Semillon | Australia | Hunter Valley | blanco | CUBIERTO | SAT_WINE_049 |
| WSET_STYLE_078 | Imprescindible | Australia Chardonnay premium | Australia | Yarra / Mornington / Tasmania | blanco | FALTANTE | - |
| WSET_STYLE_079 | Opcional | Australia Shiraz de otro estilo o nivel | Australia | Australia | tinto | FALTANTE | - |
| WSET_STYLE_080 | Opcional | Australia Pinot Noir premium | Australia | Yarra / Mornington / Tasmania | tinto | FALTANTE | - |
| WSET_STYLE_081 | Imprescindible | New Zealand Pinot Noir | New Zealand | Central Otago / Martinborough / Marlborough | tinto | FALTANTE | - |
| WSET_STYLE_082 | Imprescindible | New Zealand Sauvignon Blanc premium | New Zealand | Marlborough | blanco | CUBIERTO | SAT_WINE_051 |
| WSET_STYLE_083 | Opcional | Hawke’s Bay tinto estilo Burdeos o Syrah | New Zealand | Hawke’s Bay | tinto | FALTANTE | - |
| WSET_STYLE_084 | Opcional | New Zealand Chardonnay premium | New Zealand | Marlborough / Gisborne | blanco | FALTANTE | - |
| WSET_STYLE_085 | Opcional | New Zealand Sauvignon Blanc con roble | New Zealand | Marlborough | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_051 |
| WSET_STYLE_086 | Opcional | Vino naranja de cualquier país/región | Any | Any | fuera_de_alcance | FUERA DE ALCANCE | - |
| WSET_STYLE_087 | Imprescindible | Champagne non-vintage | France | Champagne | espumoso | FALTANTE | - |
| WSET_STYLE_088 | Opcional | Champagne vintage o prestige cuvée | France | Champagne | espumoso | FALTANTE | - |
| WSET_STYLE_089 | Opcional | Crémant | France | Alsace / Burgundy / Loire | espumoso | FALTANTE | - |
| WSET_STYLE_090 | Imprescindible | Asti | Italy | Piemonte | espumoso/dulce | FALTANTE | - |
| WSET_STYLE_091 | Imprescindible | Prosecco | Italy | Veneto / Friuli | espumoso | FALTANTE | - |
| WSET_STYLE_092 | Imprescindible | Cava | Spain | Catalonia / Spain | espumoso | FALTANTE | - |
| WSET_STYLE_093 | Imprescindible | Espumoso método tradicional de Australia/NZ/Sudáfrica/EE. UU. | Australia / New Zealand / South Africa / USA | Tasmania / Marlborough / Cap Classique / California | espumoso | FALTANTE | - |
| WSET_STYLE_094 | Imprescindible | Fino o Manzanilla | Spain | Jerez | fortificado | FALTANTE | - |
| WSET_STYLE_095 | Imprescindible | Amontillado seco u Oloroso seco | Spain | Jerez | fortificado | FALTANTE | - |
| WSET_STYLE_096 | Opcional | Jerez Medium o Cream | Spain | Jerez | fortificado/dulce | FALTANTE | - |
| WSET_STYLE_097 | Imprescindible | Oporto LBV u Oporto Vintage | Portugal | Douro | fortificado/dulce | FALTANTE | - |
| WSET_STYLE_098 | Imprescindible | Porto Tawny con indicación de edad | Portugal | Douro | fortificado/dulce | FALTANTE | - |
| WSET_STYLE_099 | Opcional | Muscat de Beaumes-de-Venise | France | Southern Rhône | fortificado/dulce | FALTANTE | - |
| WSET_STYLE_100 | Opcional | Rutherglen Muscat | Australia | Rutherglen | fortificado/dulce | FALTANTE | - |
