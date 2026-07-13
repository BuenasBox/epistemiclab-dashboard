begin;

-- Language consistency sweep: 72 or_bank items had English-language content
-- (either a leading English command verb like 'Compare'/'Assess'/'Discuss' on an
-- otherwise-Spanish stem, or a fully English question_text with no Spanish at
-- all — OR_057 through OR_106, the 50 most advanced/distinction-level items,
-- were entirely untranslated). The platform's UI, the other ~34 or_bank items,
-- and the Mentor system are all Spanish-language; these were the only
-- inconsistent ones. Translated to natural, technically precise Spanish,
-- preserving WSET/enology terminology already established elsewhere in the
-- bank (maceración, levaduras autóctonas/seleccionadas, fermentación
-- maloláctica, podredumbre noble, crianza, taninos, manejo del dosel, estrés
-- hídrico, etc.). command_verb values are untouched — they are the internal
-- taxonomy key consumed by mentor-engine.js/evaluate-or, not display text.
-- OR_049 additionally had a stray English technical phrase ('diurnal
-- temperature range (DTR)') cleaned up to Spanish in the same pass.

update public.or_bank as ob
set question_text = v.question_text
from (values
  ('OR_008', 'Compara cómo la elección de roble americano o francés puede afectar los aromas, el tanino y la integración del roble en el vino.'),
  ('OR_012', 'Compara el uso de levaduras seleccionadas y levaduras autóctonas en fermentación, considerando control, consistencia, complejidad y riesgo.'),
  ('OR_020', 'Compara cómo suelos arenosos y arcillosos pueden afectar la disponibilidad de agua, el vigor de la vid y el estilo del vino.'),
  ('OR_034', 'Compara los estilos de vino blanco producidos en climas fríos vs. cálidos, destacando las diferencias en perfil aromático y estructura.'),
  ('OR_035', 'Evalúa la calidad de un vino blanco criado en acero inoxidable basándote en su fruta y estructura ácida, considerando el estilo esperado.'),
  ('OR_036', 'Evalúa el impacto de la fermentación maloláctica en un vino blanco, considerando tanto beneficios como compromisos estilísticos.'),
  ('OR_037', 'Analiza la sostenibilidad en la viticultura moderna y cómo las prácticas certificadas impactan tanto el coste como la percepción del consumidor.'),
  ('OR_038', 'Recomienda un enfoque de vinificación para un Riesling seco de clima frío que busca máxima expresión de terroir.'),
  ('OR_039', 'Identifica y explica los factores que hacen que la Borgoña sea una región de vinos finos, conectando terroir con estilo.'),
  ('OR_042', 'Compara el potencial de envejecimiento entre un Barolo de uvas de viña vieja vs. viña joven, explicando las razones.'),
  ('OR_043', 'Evalúa la calidad de un vino tinto que muestra estructura tánica fuerte pero aroma de frutas difuso, considerando edad probable.'),
  ('OR_044', 'Evalúa la influencia del corcho natural vs. alternativas de cierre en la evolución a largo plazo de un Burdeos tinto de guarda.'),
  ('OR_045', 'Analiza la relevancia de los taninos en la estructura y evolución de vinos tintos, y cómo el enólogo puede gestionarlos.'),
  ('OR_046', 'Recomienda una estrategia de mezcla (blend) para un vino tinto que busca equilibrio entre estructura, fruta y elegancia.'),
  ('OR_047', 'Identifica y explica las características que permiten diferenciar un vino tinto de Napa Valley de uno similar de Sonoma, basándote en clima y suelo.'),
  ('OR_049', 'Explica cómo el rango de temperatura diurno (RTD) en los viñedos afecta la frescura y la complejidad aromática del vino final.'),
  ('OR_050', 'Compara la elegancia y potencial de envejecimiento de vinos dulces elaborados por podredumbre noble (botrytis) vs. deshidratación de uvas.'),
  ('OR_051', 'Evalúa la calidad de un vino fortificado que muestra balance entre alcohol, dulzor y complejidad aromática.'),
  ('OR_052', 'Evalúa los beneficios y riesgos de utilizar microoxigenación durante la crianza de un vino tinto para suavizar taninos.'),
  ('OR_053', 'Analiza la importancia del pH y su interacción con acidez, taninos y color en la estabilidad y evolución del vino.'),
  ('OR_054', 'Recomienda un calendario de cosecha para un viñedo de Chardonnay que busca elaborar un espumoso de alta elegancia.'),
  ('OR_055', 'Identifica y explica los mecanismos por los cuales el manejo del dosel (canopy management) impacta la composición de la uva.'),
  ('OR_057', 'Describe el papel de la porosidad del corcho en permitir la oxidación lenta que le permite a un vino tinto fino envejecer con elegancia en botella.'),
  ('OR_058', 'Explica por qué un vino de una añada cálida en Burdeos puede tener mayor alcohol pero menor acidez que una añada fría del mismo viñedo.'),
  ('OR_059', 'Compara el impacto sensorial y estructural de la fermentación maloláctica en el Chardonnay frente al Sauvignon Blanc, explicando por qué los productores eligen de forma diferente para cada varietal.'),
  ('OR_060', 'Evalúa la calidad de un Pinot Noir de 5 años que muestra aromas de fruta roja brillante, taninos sedosos y buen equilibrio de acidez, determinando si aún conserva su carácter primario o se acerca a una evolución de madurez.'),
  ('OR_061', 'Evalúa las ventajas y desventajas de usar fermentación en acero inoxidable con control de temperatura (para retener aromas) frente a la fermentación en depósito abierto (para la extracción y el contacto con taninos) en la vinificación de tintos.'),
  ('OR_062', 'Analiza las implicaciones del azúcar residual en un vino de apariencia seca (por debajo del umbral de dulzor perceptible de 1 g/L) y por qué algunos productores dejan azúcar residual deliberadamente mientras otros trabajan para eliminarla por completo.'),
  ('OR_063', 'Recomienda un protocolo completo de vinificación para un Riesling de clima frío que busque un estilo seco y mineral con la máxima expresión del terroir y del carácter específico del viñedo.'),
  ('OR_064', 'Identifica y explica los factores clave del viñedo que hacen que la región del Mosela en Alemania esté estructuralmente adaptada para producir vinos ultrafrescos, de bajo alcohol y alta acidez.'),
  ('OR_065', 'Describe los cambios físicos y químicos que ocurren cuando un vino fortificado (Oporto, Jerez) envejece de forma oxidativa frente a reductiva, y cómo cada estilo de crianza influye en el carácter final.'),
  ('OR_066', 'Explica la relación entre el tipo de suelo, la disponibilidad de agua durante el envero y la concentración final de taninos y la madurez fenólica en uvas tintas.'),
  ('OR_067', 'Compara el desarrollo de la podredumbre noble (Botrytis cinerea) en Sauternes frente a Tokaji, explicando cómo el clima, la humedad, la niebla matutina y el manejo del viñedo generan expresiones distintas de complejidad dulce.'),
  ('OR_068', 'Evalúa la calidad y la consistencia de estilo de un Chardonnay fermentado en barrica que muestra tanto fruta de hueso primaria como especias desarrolladas por el roble, determinando si la integración del roble está equilibrada o es dominante.'),
  ('OR_069', 'Evalúa los riesgos y beneficios de usar tratamientos enzimáticos para aumentar la extracción y la liberación de aromas durante la maceración de uvas tintas, considerando tanto los resultados sensoriales como los objetivos de producción.'),
  ('OR_070', 'Analiza cómo el cambio climático está alterando la capacidad de las regiones vinícolas tradicionales para producir sus estilos característicos, y qué adaptaciones vitícolas y enológicas están implementando los productores para mantener su carácter.'),
  ('OR_071', 'Recomienda un protocolo de cata estructurado para evaluar 6 regímenes de roble distintos (nuevo frente a usado, distintos orígenes, distintos niveles de tostado) aplicados al mismo vino base, para aislar el impacto específico del roble.'),
  ('OR_072', 'Identifica y explica cómo los suelos volcánicos (particularmente en regiones como Alsacia, Tokaji y Nueva Zelanda) influyen en la estructura del vino, la expresión mineral y el potencial de guarda.'),
  ('OR_073', 'Describe la evolución sensorial de un vino espumoso durante la segunda fermentación en botella y la crianza posterior al degüelle, destacando cómo el contacto autolítico con las levaduras genera complejidad.'),
  ('OR_074', 'Explica por qué un vino de Nebbiolo de 10 años, a pesar de tener un alcohol moderado (14%), puede seguir mostrando taninos intensos y astringentes, mientras que un Pinot Noir de la misma edad se siente sedoso.'),
  ('OR_075', 'Compara dos lotes de cosecha idénticos divididos en distintas condiciones de bodega (con control de temperatura frente a sin control, roble frente a acero inoxidable, depósito sellado frente a ventilado), prediciendo cómo divergirá el carácter de cada uno.'),
  ('OR_076', 'Evalúa la calidad y el estado de madurez de un ensamblaje bordelés que muestra fruta deshidratada, taninos resueltos y sutiles aromas secundarios minerales, determinando si es óptimo el consumo inmediato o continuar su guarda.'),
  ('OR_077', 'Evalúa si la vendimia manual frente a la mecánica afecta la calidad de un Pinot Noir delicado, considerando el daño a la uva, la exposición a la oxidación, la separación de bayas y el resultado final del vino.'),
  ('OR_078', 'Analiza el papel de la forma y el tamaño de la copa en liberar y concentrar los aromas, dirigir el flujo hacia la nariz, y cómo distintos estilos de copa se adaptan a distintos tipos de vino.'),
  ('OR_079', 'Recomienda un protocolo completo para evaluar si un vino de 8 años se acerca a su ventana óptima de consumo o todavía tiene un potencial de guarda significativo, incluyendo referencias sensoriales y analíticas.'),
  ('OR_080', 'Identifica y explica las prácticas vitícolas que definen el sistema tradicional de clasificación de Borgoña (Grand Cru frente a Premier Cru frente a Village), conectando el suelo, el microclima y la jerarquía de parcelas con la expresión de calidad.'),
  ('OR_081', 'Describe la evolución completa de un vino dulce elaborado con uvas botritizadas a lo largo de 20 años en botella, desde la concentración inicial y los aromas a miel hasta la complejidad e integración de la madurez.'),
  ('OR_082', 'Describe el recorrido sensorial de una cata horizontal del mismo vino en 5 añadas consecutivas (por ejemplo, Pauillac 2014-2018), identificando qué añada muestra el equilibrio de madurez óptimo.'),
  ('OR_083', 'Explica la bioquímica de por qué los vinos espumosos criados sobre lías durante 3 años desarrollan aromas más ricos y complejos que los criados durante solo 1 año, a pesar de usar la misma cepa de levadura.'),
  ('OR_084', 'Compara la viabilidad comercial y el potencial de calidad de una bodega pequeña y artesanal en clima frío frente a una operación mecanizada a gran escala en clima cálido, evaluando cuál puede alcanzar precios premium.'),
  ('OR_085', 'Evalúa la calidad de un Cabernet Sauvignon que muestra aromas maduros de cuero, tabaco y fruta deshidratada pero con una estructura tánica sorprendentemente cerrada, determinando si esto indica un problema o representa un vino con gran potencial de guarda.'),
  ('OR_086', 'Evalúa el impacto ambiental de convertir a la biodinámica un viñedo ya establecido, considerando el tiempo de recuperación del suelo, los retos de la transición en el manejo de plagas y los posibles cambios de calidad.'),
  ('OR_087', 'Analiza cómo las zonas climáticas (frío, moderado, cálido, caluroso) en las regiones vinícolas generan estrategias de vinificación fundamentalmente distintas, desde el momento de la cosecha hasta las decisiones de fermentación y la filosofía de crianza en roble.'),
  ('OR_088', 'Recomienda una estrategia completa de ensamblaje y un protocolo de pruebas para un enólogo que busca crear un ensamblaje tinto de 3 varietales que combine accesibilidad inmediata y un potencial de guarda de 20 años.'),
  ('OR_089', 'Identifica y explica los componentes del terroir (suelo, orientación, altitud, microclima) que hacen que el Valle de Barossa sea estructuralmente distinto de las Adelaide Hills, a solo 60 km de distancia, dando lugar a estilos de vino radicalmente diferentes.'),
  ('OR_090', 'Describe la curva completa de oxidación de un Jerez Oloroso fino a lo largo de 50 años de crianza en solera, siguiendo los cambios de color, aroma, textura y estructura en intervalos clave.'),
  ('OR_091', 'Explica cómo el origen geográfico (mineralogía del suelo, altitud, orientación, precipitación) de un viñedo de Pinot Noir influye directamente en si el vino final mostrará un carácter terroso y mineral o una expresividad frutal predominante.'),
  ('OR_092', 'Compara el desarrollo estructural y aromático de dos vinos Riesling de la misma añada pero de distintos viñedos, una ladera empinada de pizarra y una llanura aluvial plana, siguiendo sus trayectorias de guarda a 10 años.'),
  ('OR_093', 'Evalúa la calidad de un Chardonnay de una añada cálida que muestra marcadores de madurez plena (14,5% de alcohol, fruta tropical) pero cuya nota del enólogo indica una técnica de vinificación propia de clima frío, determinando la consistencia de calidad.'),
  ('OR_094', 'Evalúa las implicaciones comerciales y cualitativas de usar fermentación con levaduras autóctonas frente a cepas comerciales seleccionadas para un Pinot Noir de alto valor estilo Borgoña, considerando la consistencia, la expresividad y la percepción del mercado.'),
  ('OR_095', 'Analiza las ventajas y desventajas entre las certificaciones modernas de sostenibilidad (orgánico, biodinámico, natural) y la viticultura convencional tradicional en términos de rendimiento, calidad, coste y beneficio ambiental real.'),
  ('OR_096', 'Recomienda un protocolo completo para realizar una cata comparativa de 10 vinos que evalúe el impacto de distintos tipos de cierre (corcho natural, técnico, sintético, tapón de rosca) en un Burdeos con 10 años de guarda.'),
  ('OR_097', 'Identifica y explica cómo las tres zonas de suelo distintas dentro de la región de Chablis (caliza Kimmeridgiense, caliza Portlandiense, arcilla jurásica) producen cada una estilos característicos de vino blanco mineral.'),
  ('OR_098', 'Describe el proceso completo de decisión de cosecha en 3 fases para un viticultor que maneja múltiples parcelas en una añada donde algunos bloques maduran antes y otros se retrasan, optimizando la calidad en condiciones diversas.'),
  ('OR_099', 'Explica el efecto en cascada por el cual el azúcar residual en un vino de menor graduación alcohólica (por debajo del 12,5%) modifica no solo la percepción de dulzor, sino también la expresión de los taninos, el equilibrio de acidez y la aptitud para el maridaje.'),
  ('OR_100', 'Compara la economía de mercado y los retos de producción de vinos de edición limitada y lote pequeño frente a las marcas insignia de alto volumen de la misma bodega, evaluando la rentabilidad y las estrategias de posicionamiento de marca.'),
  ('OR_101', 'Evalúa la calidad de un Sauvignon Blanc de una región cálida que muestra una acidez más alta de lo esperado (9,5 g/L de acidez total) y aromas herbáceos normalmente asociados a estilos de clima frío, determinando si se trata de una anomalía o de una expresión válida.'),
  ('OR_102', 'Evalúa si la maceración prolongada (30 días o más) con hollejos en un vino blanco (por ejemplo, estilo naranja/natural) produce una mejora legítima de complejidad o representa un riesgo excesivo de oxidación y de alteración microbiológica.'),
  ('OR_103', 'Analiza las implicaciones de usar cierres sintéticos o alternativos (tapón de rosca, tapón de vidrio, corcho de plástico) sobre la crianza del vino, la calidad percibida, la tradición, la sostenibilidad y su adopción a largo plazo en el mercado.'),
  ('OR_104', 'Recomienda un plan completo de manejo de viñedo para convertir un viñedo convencional de 20 hectáreas a certificación orgánica en 5 años, incluyendo el manejo de plagas, la recuperación del suelo y el manejo de las añadas de transición.'),
  ('OR_105', 'Identifica y explica cómo la herencia glacial de la Isla Sur de Nueva Zelanda (Marlborough, Central Otago) genera composiciones de suelo y microclimas distintivos que definen los estilos de vino regionales.'),
  ('OR_106', 'Describe la evolución completa de un vino Tokaji Aszú desde la vendimia (concentración por podredumbre noble), pasando por la interrupción de la fermentación, la crianza en toneles de madera y una maduración en botella de 10 años o más, siguiendo la transformación de su calidad y carácter.')
) as v(item_id, question_text)
where ob.item_id = v.item_id;

commit;
