# CWP-BUILD-07 Batch 010 - Cobertura WSET imprescindible de vinos tranquilos

Fecha: 2026-06-18
Alcance: actualizacion documental de cobertura despues de crear Batch 010. Batch 010 incluye solo vinos tranquilos recomendados como Imprescindible por WSET que estaban FALTANTE o PARCIALMENTE CUBIERTO. No incluye espumosos, generosos ni opcionales.

## Fuentes

- Fuente primaria obligatoria: C:\Dev\WSET-AI-System-push\knowledge\official-wset\specification\wset_l3wines_specification_es_highres_aug2023_issue201.pdf.
- Apoyo: C:\Dev\WSET-AI-System-push\knowledge\official-wset\specification\wset_l3wines_specification_es_highres_aug2023_issue201.md y D:\Descargas\Phone Link\WSET3_rebuilt.md.
- Seccion fuente: Recomendaciones de Vinos para Catar, lineas 1501-1951 del Markdown de especificacion.
- Catalogo comparado: canonical-wine-catalog/profiles/.

## Evidencia

- Total real extraido desde especificacion: 100
- SHA-256 de wset_required_styles_from_spec.csv: 0d267fe1129509e1052455185fec4a37f44e9ed365a798cbe734e8cf2e177c34
- SHA-256 de wset_style_coverage_audit.csv: af252e0cd91dd11befcf571c6dfcab7eeb419de308221e16c2c39744020037f1
- Batch 010 agrega SAT_WINE_071 a SAT_WINE_093 en modo append-only.
- SAT_WINE_001 a SAT_WINE_070 se mantienen estables; no se renumeran IDs.

## Resumen antes/despues

| Metrica | Antes Batch 010 | Despues Batch 010 |
| --- | ---: | ---: |
| Total estilos WSET auditados | 100 | 100 |
| Total CUBIERTO | 26 | 50 |
| Total DUPLICADO / SOLAPADO | 5 | 5 |
| Total PARCIALMENTE CUBIERTO | 16 | 7 |
| Total FALTANTE | 52 | 37 |
| Total FUERA DE ALCANCE | 1 | 1 |
| Cobertura efectiva total | 31/100 | 55/100 |
| Imprescindibles faltantes | 24/58 | 9/58 |
| Cobertura efectiva de imprescindibles | 25/58 | 49/58 |

## Estilos cubiertos por Batch 010

- WSET_STYLE_001: Bordeaux AC genérico tinto -> SAT_WINE_071 (France, tinto; spec line 1520)
- WSET_STYLE_004: Sauternes o Barsac -> SAT_WINE_072 (France, dulce; spec line 1526)
- WSET_STYLE_009: Bourgogne Rouge AC -> SAT_WINE_073 (France, tinto; spec line 1562)
- WSET_STYLE_020: Chenin Blanc seco premium del Loire -> SAT_WINE_074 (France, blanco; spec line 1629)
- WSET_STYLE_022: Cabernet Franc premium del Loire -> SAT_WINE_075 (France, tinto; spec line 1632)
- WSET_STYLE_025: Châteauneuf-du-Pape o Gigondas -> SAT_WINE_057; SAT_WINE_076 (France, tinto; spec line 1637)
- WSET_STYLE_026: Côtes du Rhône o Côtes du Rhône Villages -> SAT_WINE_077 (France, tinto; spec line 1638)
- WSET_STYLE_033: Riesling seco VDP -> SAT_WINE_078 (Germany, blanco; spec line 1651)
- WSET_STYLE_037: Tokaji Aszú -> SAT_WINE_079 (Hungary, dulce; spec line 1714)
- WSET_STYLE_042: Chianti -> SAT_WINE_080 (Italy, tinto; spec line 1743)
- WSET_STYLE_054: California Cabernet Sauvignon o Merlot premium -> SAT_WINE_081 (USA, tinto; spec line 1762-1763)
- WSET_STYLE_055: California Zinfandel -> SAT_WINE_082 (USA, tinto; spec line 1764)
- WSET_STYLE_061: Chile Carmenère premium -> SAT_WINE_083 (Chile, tinto; spec line 1799)
- WSET_STYLE_062: Chile tinto económico de volumen -> SAT_WINE_084 (Chile, tinto; spec line 1801)
- WSET_STYLE_065: Argentina Malbec de precio medio -> SAT_WINE_085 (Argentina, tinto; spec line 1807)
- WSET_STYLE_069: South Africa Pinotage premium -> SAT_WINE_086 (South Africa, tinto; spec line 1814)
- WSET_STYLE_070: South Africa Chenin Blanc con roble premium -> SAT_WINE_087 (South Africa, blanco; spec line 1816)
- WSET_STYLE_073: Australia Shiraz premium -> SAT_WINE_088 (Australia, tinto; spec line 1845)
- WSET_STYLE_074: Australia Cabernet Sauvignon o mezcla Cabernet premium -> SAT_WINE_089 (Australia, tinto; spec line 1846-1847)
- WSET_STYLE_075: Australia Grenache o mezcla Grenache premium -> SAT_WINE_090 (Australia, tinto; spec line 1848)
- WSET_STYLE_076: Eden Valley o Clare Valley Riesling -> SAT_WINE_050; SAT_WINE_091 (Australia, blanco; spec line 1850)
- WSET_STYLE_078: Australia Chardonnay premium -> SAT_WINE_092 (Australia, blanco; spec line 1852-1853)
- WSET_STYLE_081: New Zealand Pinot Noir -> SAT_WINE_093 (New Zealand, tinto; spec line 1872)

## Faltantes imprescindibles restantes

- WSET_STYLE_087: Champagne non-vintage (France, espumoso; spec line 1909)
- WSET_STYLE_090: Asti (Italy, espumoso/dulce; spec line 1915)
- WSET_STYLE_091: Prosecco (Italy, espumoso; spec line 1915)
- WSET_STYLE_092: Cava (Spain, espumoso; spec line 1917)
- WSET_STYLE_093: Espumoso método tradicional de Australia/NZ/Sudáfrica/EE. UU. (Australia / New Zealand / South Africa / USA, espumoso; spec line 1922-1923)
- WSET_STYLE_094: Fino o Manzanilla (Spain, fortificado; spec line 1939)
- WSET_STYLE_095: Amontillado seco u Oloroso seco (Spain, fortificado; spec line 1940)
- WSET_STYLE_097: Oporto LBV u Oporto Vintage (Portugal, fortificado/dulce; spec line 1944)
- WSET_STYLE_098: Porto Tawny con indicación de edad (Portugal, fortificado/dulce; spec line 1945)

## Faltantes totales restantes

- WSET_STYLE_006: Bordeaux AC genérico blanco seco (France, blanco; spec line 1536)
- WSET_STYLE_007: Graves o Pessac-Léognan blanco seco con roble (France, blanco; spec line 1537)
- WSET_STYLE_008: Cahors o Madiran (France, tinto; spec line 1544)
- WSET_STYLE_023: Muscadet o Muscadet Sur Lie (France, blanco; spec line 1634)
- WSET_STYLE_029: Corbières, Fitou o Minervois (France, tinto; spec line 1644)
- WSET_STYLE_030: IGP de variedad internacional del sur de Francia (France, blanco/tinto; spec line 1645)
- WSET_STYLE_031: Rosado Côtes de Provence o sur del Ródano (France, rosado; spec line 1647-1648)
- WSET_STYLE_038: Naoussa o Nemea (Greece, tinto; spec line 1738)
- WSET_STYLE_045: Pinot Grigio del Veneto (Italy, blanco; spec line 1747)
- WSET_STYLE_052: Monastrell (p. ej. Jumilla) (Spain, tinto; spec line 1758)
- WSET_STYLE_057: Willamette Valley Pinot Noir (USA, tinto; spec line 1769)
- WSET_STYLE_058: California Pinot Noir premium (USA, tinto; spec line 1770-1771)
- WSET_STYLE_059: White Zinfandel (USA, rosado; spec line 1775)
- WSET_STYLE_060: Icewine (Canada, dulce; spec line 1779)
- WSET_STYLE_063: Chile Cabernet Sauvignon premium (Chile, tinto; spec line 1802-1803)
- WSET_STYLE_067: Argentina Cabernet Sauvignon o mezcla premium (Argentina, tinto; spec line 1811)
- WSET_STYLE_068: Argentina Malbec premium (Argentina, tinto; spec line 1812)
- WSET_STYLE_071: South Africa Cabernet Sauvignon premium (South Africa, tinto; spec line 1818)
- WSET_STYLE_072: Marca económica tinto/blanco de volumen (South Africa, blanco/tinto; spec line 1822)
- WSET_STYLE_079: Australia Shiraz de otro estilo o nivel (Australia, tinto; spec line 1855)
- WSET_STYLE_080: Australia Pinot Noir premium (Australia, tinto; spec line 1856-1857)
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

## Cobertura parcial restante

- WSET_STYLE_005: Saint-Émilion, Pomerol o Haut-Médoc de añada más antigua (France, tinto; perfiles: SAT_WINE_052; SAT_WINE_053)
- WSET_STYLE_014: Otro vino de Beaujolais (France, tinto; perfiles: SAT_WINE_055)
- WSET_STYLE_019: Alsace Vendanges Tardives o Sélection de Grains Nobles (France, dulce; perfiles: SAT_WINE_006; SAT_WINE_007; SAT_WINE_008)
- WSET_STYLE_027: Syrah del Norte del Ródano de precio medio (France, tinto; perfiles: SAT_WINE_056)
- WSET_STYLE_053: Douro, Dão o Alentejo tinto (Portugal, tinto; perfiles: SAT_WINE_069; SAT_WINE_070)
- WSET_STYLE_064: Chile Chardonnay o Sauvignon Blanc (Chile, blanco; perfiles: SAT_WINE_046)
- WSET_STYLE_085: New Zealand Sauvignon Blanc con roble (New Zealand, blanco; perfiles: SAT_WINE_051)

## Duplicados / solapados

- WSET_STYLE_036: Grüner Veltliner austríaco (Austria, blanco; perfiles: SAT_WINE_022; SAT_WINE_024; SAT_WINE_025; SAT_WINE_026)
- WSET_STYLE_039: Barolo o Barbaresco (Italy, tinto; perfiles: SAT_WINE_060; SAT_WINE_061)
- WSET_STYLE_043: Chianti Classico Riserva o Brunello di Montalcino (Italy, tinto; perfiles: SAT_WINE_063; SAT_WINE_064)
- WSET_STYLE_046: Pinot Grigio Alto Adige, Trentino o Friuli (Italy, blanco; perfiles: SAT_WINE_028; SAT_WINE_029; SAT_WINE_030)
- WSET_STYLE_051: Rías Baixas o Rueda (Spain, blanco; perfiles: SAT_WINE_038; SAT_WINE_039)

## Fuera de alcance

- WSET_STYLE_086: Vino naranja de cualquier país/región (fuera_de_alcance)

## Recomendaciones de nuevos batches

1. Batch 011 - Espumosos imprescindibles: Champagne non-vintage, Asti, Prosecco, Cava y metodo tradicional Australia/Nueva Zelanda/Sudafrica/EE. UU.
2. Batch 012 - Generosos imprescindibles: Fino/Manzanilla, Amontillado/Oloroso seco, LBV/Vintage Port y Tawny con indicacion de edad.
3. Batch 013 - Espumosos y generosos opcionales: Champagne vintage/prestige, Cremant, Jerez Medium/Cream, Muscat de Beaumes-de-Venise y Rutherglen Muscat.
4. Batch 014 - Tranquilos opcionales faltantes de Europa: Bordeaux blanco seco, Graves/Pessac-Leognan blanco, Cahors/Madiran, Muscadet, sur de Francia, Provence rose, Naoussa/Nemea, Pinot Grigio Veneto, Monastrell y Alentejo.
5. Batch 015 - Tranquilos opcionales de Nuevo Mundo: Oregon/California Pinot Noir, White Zinfandel, Canada Icewine, Chile Cabernet, Argentina Cabernet/Malbec premium, South Africa Cabernet, marca economica de volumen, Australia Shiraz/Pinot Noir alternativo, Hawke's Bay red y New Zealand Chardonnay/Sauvignon Blanc con roble.

## Impacto sobre IDs actuales

- IDs existentes SAT_WINE_001 a SAT_WINE_070: sin cambios y sin renumeracion.
- Nuevos IDs: SAT_WINE_071 a SAT_WINE_093, consecutivos.
- La matriz cambia estados de faltante/parcial a cubierto para los estilos imprescindibles tranquilos del batch. WSET_STYLE_044 tambien queda cubierto por evidencia de SAT_WINE_065, sin crear perfil duplicado.
- Conviene ampliar mas alla de 70 perfiles. Despues de Batch 010 el catalogo llega a 93 perfiles, pero aun faltan espumosos/generosos imprescindibles para estar completo en practicas y simulaciones WSET.

## Tabla de comparacion fuente vs cobertura

| ID | Prioridad | Estilo WSET extraido | Pais | Region | Categoria | Estado | Perfiles CWP | Linea spec |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WSET_STYLE_001 | Imprescindible | Bordeaux AC genérico tinto | France | Bordeaux | tinto | CUBIERTO | SAT_WINE_071 | 1520 |
| WSET_STYLE_002 | Imprescindible | Cru Bourgeois o Haut-Médoc Cru Classé | France | Bordeaux | tinto | CUBIERTO | SAT_WINE_052 | 1521 |
| WSET_STYLE_003 | Imprescindible | Saint-Émilion Grand Cru o Pomerol | France | Bordeaux | tinto | CUBIERTO | SAT_WINE_053 | 1522 |
| WSET_STYLE_004 | Imprescindible | Sauternes o Barsac | France | Bordeaux | dulce | CUBIERTO | SAT_WINE_072 | 1526 |
| WSET_STYLE_005 | Opcional | Saint-Émilion, Pomerol o Haut-Médoc de añada más antigua | France | Bordeaux | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_052; SAT_WINE_053 | 1532 |
| WSET_STYLE_006 | Opcional | Bordeaux AC genérico blanco seco | France | Bordeaux | blanco | FALTANTE | - | 1536 |
| WSET_STYLE_007 | Opcional | Graves o Pessac-Léognan blanco seco con roble | France | Bordeaux | blanco | FALTANTE | - | 1537 |
| WSET_STYLE_008 | Opcional | Cahors o Madiran | France | Dordogne / South West France | tinto | FALTANTE | - | 1544 |
| WSET_STYLE_009 | Imprescindible | Bourgogne Rouge AC | France | Burgundy | tinto | CUBIERTO | SAT_WINE_073 | 1562 |
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
| WSET_STYLE_020 | Imprescindible | Chenin Blanc seco premium del Loire | France | Loire Valley | blanco | CUBIERTO | SAT_WINE_074 | 1629 |
| WSET_STYLE_021 | Imprescindible | Sancerre o Pouilly-Fumé | France | Loire Valley | blanco | CUBIERTO | SAT_WINE_009 | 1630 |
| WSET_STYLE_022 | Imprescindible | Cabernet Franc premium del Loire | France | Loire Valley | tinto | CUBIERTO | SAT_WINE_075 | 1632 |
| WSET_STYLE_023 | Opcional | Muscadet o Muscadet Sur Lie | France | Loire Valley | blanco | FALTANTE | - | 1634 |
| WSET_STYLE_024 | Imprescindible | Syrah premium del Norte del Ródano | France | Northern Rhône | tinto | CUBIERTO | SAT_WINE_056 | 1636 |
| WSET_STYLE_025 | Imprescindible | Châteauneuf-du-Pape o Gigondas | France | Southern Rhône | tinto | CUBIERTO | SAT_WINE_057; SAT_WINE_076 | 1637 |
| WSET_STYLE_026 | Imprescindible | Côtes du Rhône o Côtes du Rhône Villages | France | Southern Rhône | tinto | CUBIERTO | SAT_WINE_077 | 1638 |
| WSET_STYLE_027 | Opcional | Syrah del Norte del Ródano de precio medio | France | Northern Rhône | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_056 | 1640 |
| WSET_STYLE_028 | Opcional | Condrieu | France | Northern Rhône | blanco | CUBIERTO | SAT_WINE_011 | 1642 |
| WSET_STYLE_029 | Opcional | Corbières, Fitou o Minervois | France | South of France | tinto | FALTANTE | - | 1644 |
| WSET_STYLE_030 | Opcional | IGP de variedad internacional del sur de Francia | France | South of France | blanco/tinto | FALTANTE | - | 1645 |
| WSET_STYLE_031 | Opcional | Rosado Côtes de Provence o sur del Ródano | France | Provence / Southern Rhône | rosado | FALTANTE | - | 1647-1648 |
| WSET_STYLE_032 | Imprescindible | Riesling alemán con azúcar residual (Kabinett o Spätlese) | Germany | Germany | blanco/dulce | CUBIERTO | SAT_WINE_016; SAT_WINE_017 | 1650 |
| WSET_STYLE_033 | Imprescindible | Riesling seco VDP | Germany | Mosel / Rheingau / Pfalz / Rheinhessen | blanco | CUBIERTO | SAT_WINE_078 | 1651 |
| WSET_STYLE_034 | Opcional | Riesling Auslese o Beerenauslese botrytizado | Germany | Germany | dulce | CUBIERTO | SAT_WINE_018; SAT_WINE_019 | 1653 |
| WSET_STYLE_035 | Opcional | Eiswein | Germany | Germany | dulce | CUBIERTO | SAT_WINE_021 | 1654 |
| WSET_STYLE_036 | Imprescindible | Grüner Veltliner austríaco | Austria | Niederösterreich | blanco | DUPLICADO / SOLAPADO | SAT_WINE_022; SAT_WINE_024; SAT_WINE_025; SAT_WINE_026 | 1658 |
| WSET_STYLE_037 | Imprescindible | Tokaji Aszú | Hungary | Tokaj | dulce | CUBIERTO | SAT_WINE_079 | 1714 |
| WSET_STYLE_038 | Opcional | Naoussa o Nemea | Greece | Naoussa / Nemea | tinto | FALTANTE | - | 1738 |
| WSET_STYLE_039 | Imprescindible | Barolo o Barbaresco | Italy | Piemonte | tinto | DUPLICADO / SOLAPADO | SAT_WINE_060; SAT_WINE_061 | 1740 |
| WSET_STYLE_040 | Imprescindible | Valpolicella o Valpolicella Classico | Italy | Veneto | tinto | CUBIERTO | SAT_WINE_058 | 1741 |
| WSET_STYLE_041 | Imprescindible | Amarone della Valpolicella | Italy | Veneto | tinto | CUBIERTO | SAT_WINE_059 | 1742 |
| WSET_STYLE_042 | Imprescindible | Chianti | Italy | Tuscany | tinto | CUBIERTO | SAT_WINE_080 | 1743 |
| WSET_STYLE_043 | Imprescindible | Chianti Classico Riserva o Brunello di Montalcino | Italy | Tuscany | tinto | DUPLICADO / SOLAPADO | SAT_WINE_063; SAT_WINE_064 | 1744 |
| WSET_STYLE_044 | Imprescindible | Tinto del sur de Italia (p. ej. Taurasi) | Italy | Southern Italy | tinto | CUBIERTO | SAT_WINE_065 | 1745 |
| WSET_STYLE_045 | Opcional | Pinot Grigio del Veneto | Italy | Veneto | blanco | FALTANTE | - | 1747 |
| WSET_STYLE_046 | Opcional | Pinot Grigio Alto Adige, Trentino o Friuli | Italy | North-East Italy | blanco | DUPLICADO / SOLAPADO | SAT_WINE_028; SAT_WINE_029; SAT_WINE_030 | 1749 |
| WSET_STYLE_047 | Opcional | Soave o Soave Classico | Italy | Veneto | blanco | CUBIERTO | SAT_WINE_031 | 1750 |
| WSET_STYLE_048 | Imprescindible | Rioja Reserva o Gran Reserva | Spain | Rioja | tinto | CUBIERTO | SAT_WINE_066 | 1752 |
| WSET_STYLE_049 | Imprescindible | Ribera del Duero | Spain | Ribera del Duero | tinto | CUBIERTO | SAT_WINE_067 | 1753 |
| WSET_STYLE_050 | Imprescindible | Priorat | Spain | Priorat | tinto | CUBIERTO | SAT_WINE_068 | 1754 |
| WSET_STYLE_051 | Imprescindible | Rías Baixas o Rueda | Spain | Rías Baixas / Rueda | blanco | DUPLICADO / SOLAPADO | SAT_WINE_038; SAT_WINE_039 | 1756 |
| WSET_STYLE_052 | Opcional | Monastrell (p. ej. Jumilla) | Spain | Levante | tinto | FALTANTE | - | 1758 |
| WSET_STYLE_053 | Opcional | Douro, Dão o Alentejo tinto | Portugal | Douro / Dão / Alentejo | tinto | PARCIALMENTE CUBIERTO | SAT_WINE_069; SAT_WINE_070 | 1760 |
| WSET_STYLE_054 | Imprescindible | California Cabernet Sauvignon o Merlot premium | USA | California | tinto | CUBIERTO | SAT_WINE_081 | 1762-1763 |
| WSET_STYLE_055 | Imprescindible | California Zinfandel | USA | California | tinto | CUBIERTO | SAT_WINE_082 | 1764 |
| WSET_STYLE_056 | Imprescindible | California Chardonnay premium | USA | California | blanco | CUBIERTO | SAT_WINE_044; SAT_WINE_045 | 1766-1767 |
| WSET_STYLE_057 | Opcional | Willamette Valley Pinot Noir | USA | Oregon | tinto | FALTANTE | - | 1769 |
| WSET_STYLE_058 | Opcional | California Pinot Noir premium | USA | California | tinto | FALTANTE | - | 1770-1771 |
| WSET_STYLE_059 | Opcional | White Zinfandel | USA | California | rosado | FALTANTE | - | 1775 |
| WSET_STYLE_060 | Opcional | Icewine | Canada | Ontario / British Columbia | dulce | FALTANTE | - | 1779 |
| WSET_STYLE_061 | Imprescindible | Chile Carmenère premium | Chile | Cachapoal / Colchagua | tinto | CUBIERTO | SAT_WINE_083 | 1799 |
| WSET_STYLE_062 | Imprescindible | Chile tinto económico de volumen | Chile | Central Valley | tinto | CUBIERTO | SAT_WINE_084 | 1801 |
| WSET_STYLE_063 | Opcional | Chile Cabernet Sauvignon premium | Chile | Maipo / Cachapoal / Colchagua | tinto | FALTANTE | - | 1802-1803 |
| WSET_STYLE_064 | Opcional | Chile Chardonnay o Sauvignon Blanc | Chile | Casablanca / San Antonio | blanco | PARCIALMENTE CUBIERTO | SAT_WINE_046 | 1805 |
| WSET_STYLE_065 | Imprescindible | Argentina Malbec de precio medio | Argentina | Mendoza | tinto | CUBIERTO | SAT_WINE_085 | 1807 |
| WSET_STYLE_066 | Imprescindible | Argentina Torrontés premium | Argentina | Salta | blanco | CUBIERTO | SAT_WINE_047 | 1809 |
| WSET_STYLE_067 | Opcional | Argentina Cabernet Sauvignon o mezcla premium | Argentina | Mendoza | tinto | FALTANTE | - | 1811 |
| WSET_STYLE_068 | Opcional | Argentina Malbec premium | Argentina | Uco / Luján de Cuyo | tinto | FALTANTE | - | 1812 |
| WSET_STYLE_069 | Imprescindible | South Africa Pinotage premium | South Africa | Western Cape | tinto | CUBIERTO | SAT_WINE_086 | 1814 |
| WSET_STYLE_070 | Imprescindible | South Africa Chenin Blanc con roble premium | South Africa | Western Cape | blanco | CUBIERTO | SAT_WINE_087 | 1816 |
| WSET_STYLE_071 | Opcional | South Africa Cabernet Sauvignon premium | South Africa | Western Cape | tinto | FALTANTE | - | 1818 |
| WSET_STYLE_072 | Opcional | Marca económica tinto/blanco de volumen | South Africa | Western Cape | blanco/tinto | FALTANTE | - | 1822 |
| WSET_STYLE_073 | Imprescindible | Australia Shiraz premium | Australia | South Australia | tinto | CUBIERTO | SAT_WINE_088 | 1845 |
| WSET_STYLE_074 | Imprescindible | Australia Cabernet Sauvignon o mezcla Cabernet premium | Australia | Coonawarra / Margaret River | tinto | CUBIERTO | SAT_WINE_089 | 1846-1847 |
| WSET_STYLE_075 | Imprescindible | Australia Grenache o mezcla Grenache premium | Australia | McLaren Vale | tinto | CUBIERTO | SAT_WINE_090 | 1848 |
| WSET_STYLE_076 | Imprescindible | Eden Valley o Clare Valley Riesling | Australia | Eden Valley / Clare Valley | blanco | CUBIERTO | SAT_WINE_050; SAT_WINE_091 | 1850 |
| WSET_STYLE_077 | Imprescindible | Hunter Valley Semillon | Australia | Hunter Valley | blanco | CUBIERTO | SAT_WINE_049 | 1851 |
| WSET_STYLE_078 | Imprescindible | Australia Chardonnay premium | Australia | Yarra / Mornington / Tasmania | blanco | CUBIERTO | SAT_WINE_092 | 1852-1853 |
| WSET_STYLE_079 | Opcional | Australia Shiraz de otro estilo o nivel | Australia | Australia | tinto | FALTANTE | - | 1855 |
| WSET_STYLE_080 | Opcional | Australia Pinot Noir premium | Australia | Yarra / Mornington / Tasmania | tinto | FALTANTE | - | 1856-1857 |
| WSET_STYLE_081 | Imprescindible | New Zealand Pinot Noir | New Zealand | Central Otago / Martinborough / Marlborough | tinto | CUBIERTO | SAT_WINE_093 | 1872 |
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
