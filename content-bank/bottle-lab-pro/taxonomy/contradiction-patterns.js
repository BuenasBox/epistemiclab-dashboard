'use strict';

/**
 * Catálogo de patrones de contradicción de Bottle Lab Pro — contrato:
 * bottle-lab-pro.contradiction-patterns.v1 (Loop 5)
 *
 * Más rico que el de Label: Bottle trabaja con señales físicas simultáneas (no solo datos
 * documentales), así que las contradicciones ocurren tanto entre dos señales del envase como
 * entre una señal real y un estereotipo previo del estudiante. Cada patrón es una PLANTILLA
 * reutilizable; las entradas `contradictions[]` de `bank/items.js` (Loop 4) son INSTANCIAS
 * concretas de estos patrones y referencian su `pattern_code` para trazabilidad.
 *
 * Los 6 tipos de escenario son los exigidos explícitamente por la especificación editorial:
 * (1) una señal visual contradice la narrativa que construye otra; (2) varias señales débiles
 * parecen converger pero una señal más fuerte las contradice; (3) el marketing sugiere
 * prestigio pero la evidencia técnica no lo respalda; (4) el cierre contradice el estereotipo
 * de precio; (5) el formato sugiere guarda pero el resto no permite concluirla; (6) la botella
 * parece regionalmente típica pero eso no permite inferir origen.
 */

const { EVIDENCE_STRENGTH } = require('../schema/enums.js');

const CONTRADICTION_PATTERNS = Object.freeze([
  {
    code: 'visual_contradicts_narrative',
    name: 'Una señal visual contradice la narrativa que construye otra',
    description: 'Una señal física objetiva (no necesariamente de marketing) no encaja con la historia que construyen una o varias señales de presentación -- p. ej. un dato de manufactura industrial frente a un diseño que evoca producción artesanal pequeña.',
    expected_signal: 'Una o varias señales de presentación (diseño, relieve, cápsula) que construyen una narrativa coherente sobre el productor o el proceso.',
    conflicting_signal: 'Un dato físico objetivo (p. ej. un código de lote, un tipo de codificación de línea de embotellado) que no encaja con esa narrativa.',
    breaks_inference: 'La hipótesis de que la narrativa construida por las señales de presentación describe la realidad de producción del vino.',
    strength_level: 'moderate',
    mentor_response: 'Dos señales que parecen contar historias distintas no significan que una de las dos "esté mal" -- significa que una de ellas (normalmente la de presentación) no estaba diseñada para informar, sino para persuadir.',
    expected_revision: 'Bajar la confianza en cualquier hipótesis sobre escala o carácter de producción que dependa solo de señales de presentación, y priorizar el dato físico objetivo.',
    example_item_ids: ['BOTTLE_PRO_000'],
    related_misconceptions: ['bottle.expensive_packaging_equals_quality'],
  },
  {
    code: 'weak_convergence_vs_strong_signal',
    name: 'Varias señales débiles convergen, pero una señal más fuerte las contradice',
    description: 'Múltiples señales weak/non_diagnostic apuntan en la misma dirección, generando una falsa sensación de solidez por acumulación, mientras una única señal moderate (o superior) apunta en sentido contrario.',
    expected_signal: 'La convergencia acumulada de varias señales weak/non_diagnostic (p. ej. peso, punt, relieve, diseño) que parecen reforzarse entre sí.',
    conflicting_signal: 'Una señal moderate o superior, aislada, que contradice la lectura conjunta (p. ej. nivel de llenado incoherente con la narrativa de guarda).',
    breaks_inference: 'La creencia de que sumar varias señales débiles equivale a tener una señal fuerte.',
    strength_level: 'moderate',
    mentor_response: 'Varias señales débiles apuntando en la misma dirección no equivalen a una señal fuerte -- y cuando además hay una señal moderate o superior que apunta en sentido contrario, esa pesa más que todas las demás juntas.',
    expected_revision: 'Abandonar la conclusión sostenida solo por convergencia de señales débiles; priorizar la señal individual más fuerte disponible.',
    example_item_ids: ['BOTTLE_PRO_010'],
    related_misconceptions: ['bottle.weight_equals_quality', 'bottle.punt_equals_quality'],
  },
  {
    code: 'marketing_prestige_vs_technical_evidence',
    name: 'El marketing sugiere prestigio, pero la evidencia técnica no lo respalda',
    description: 'Un discurso de marca coherente y persuasivo (texto, diseño, relieve, cápsula) construye una imagen de prestigio o tradición que un dato técnico de producción real contradice directamente.',
    expected_signal: 'Un conjunto de señales de marketing/presentación que construyen deliberadamente una imagen de prestigio, tradición o escala reducida.',
    conflicting_signal: 'Un dato técnico de producción verificable (p. ej. tipo de línea de embotellado) que contradice esa imagen.',
    breaks_inference: 'La hipótesis de que el discurso de marca refleja fielmente el proceso de producción real.',
    strength_level: 'strong',
    mentor_response: 'Cuanto más coherente y persuasiva es una narrativa de marketing, más importa buscar activamente un dato técnico que pueda contradecirla -- la coherencia interna de un discurso no es evidencia de que sea cierto.',
    expected_revision: 'Rechazar la narrativa de marketing como evidencia de proceso real; declarar que la evidencia técnica disponible, si contradice esa narrativa, pesa más.',
    example_item_ids: ['BOTTLE_PRO_011'],
    related_misconceptions: ['bottle.expensive_packaging_equals_quality', 'bottle.minimal_design_equals_premium'],
  },
  {
    code: 'closure_contradicts_price_stereotype',
    name: 'El cierre contradice el estereotipo popular de precio',
    description: 'Un cierre de rosca aparece junto a señales de presentación de gama alta (o un corcho junto a señales de gama económica), chocando con la creencia popular "corcho = caro, rosca = barato" sin que exista una contradicción real entre las evidencias.',
    expected_signal: 'Señales de presentación (diseño, relieve, cápsula) que comunican un posicionamiento de gama alta.',
    conflicting_signal: 'Un cierre de rosca, documentado como elección técnica deliberada en la gama alta de ciertas tradiciones regionales.',
    breaks_inference: 'La expectativa popular de que el tipo de cierre determina la categoría de precio del vino.',
    strength_level: 'moderate',
    mentor_response: 'No hay contradicción real aquí -- solo choca con un estereotipo. El diseño premium y la rosca pueden convivir perfectamente: la rosca es cada vez más una elección deliberada en la gama alta.',
    expected_revision: 'Actualizar el estereotipo "corcho = caro, rosca = barato" en vez de forzar una de las dos señales a encajar con la otra.',
    example_item_ids: ['BOTTLE_PRO_008'],
    related_misconceptions: ['bottle.cork_equals_quality', 'bottle.screwcap_equals_cheap'],
  },
  {
    code: 'format_suggests_aging_but_insufficient',
    name: 'El formato sugiere vocación de guarda, pero el resto de evidencia no permite concluirla',
    description: 'Un formato grande (magnum o mayor) activa la expectativa de que el vino está pensado para guardarse, mientras otra evidencia (nivel de llenado, declaración explícita del productor) indica lo contrario.',
    expected_signal: 'Un formato especial grande (special_format, moderate) que en teoría ralentiza la evolución del vino si hay vocación de guarda.',
    conflicting_signal: 'Evidencia directa de que el vino está pensado para consumo inmediato (declaración del productor, nivel de llenado propio de embotellado joven).',
    breaks_inference: 'La hipótesis de que el formato grande, por sí solo, implica que el vino está pensado para guardarse.',
    strength_level: 'moderate',
    mentor_response: 'La física del formato es correcta -- pero solo importa si hay una guarda planeada. Cuando hay evidencia directa de lo contrario, esa evidencia pesa más que la regla general.',
    expected_revision: 'Tratar el beneficio del formato como neutro o inexistente para este caso concreto; priorizar la evidencia directa sobre el destino real del vino.',
    example_item_ids: ['BOTTLE_PRO_007', 'BOTTLE_PRO_012'],
    related_misconceptions: ['bottle.large_format_always_better'],
  },
  {
    code: 'regional_typicality_vs_origin_inference',
    name: 'La botella parece regionalmente típica, pero eso no permite inferir origen real',
    description: 'La forma, el color y/o el cierre coinciden con el perfil típico de una región o tradición conocida, generando la tentación de concluir origen o variedad sin que exista ninguna fuente documental (etiqueta, denominación) que lo confirme.',
    expected_signal: 'Un conjunto de señales weak (forma, hombros, color) que coinciden con el arquetipo estético de una región o tradición conocida.',
    conflicting_signal: 'La ausencia de cualquier fuente documental independiente (etiqueta, denominación) que confirme esa región o tradición.',
    breaks_inference: 'La hipótesis de que la tipicidad estética confirma origen, denominación o variedad reales.',
    strength_level: 'weak',
    mentor_response: 'La forma es una convención de estilo que viajó por el mundo -- no es un sello de origen. Eso solo lo certifica una fuente independiente, como la etiqueta.',
    expected_revision: 'Declarar "no puede determinarse" sobre origen/variedad en vez de aceptar la tipicidad estética como confirmación.',
    example_item_ids: ['BOTTLE_PRO_005', 'BOTTLE_PRO_012'],
    related_misconceptions: ['bottle.shape_equals_origin', 'bottle.shape_equals_variety'],
  },
]);

const PATTERNS_BY_CODE = Object.freeze(
  Object.fromEntries(CONTRADICTION_PATTERNS.map((p) => [p.code, p]))
);

function getPattern(code) {
  return PATTERNS_BY_CODE[code] || null;
}

module.exports = { EVIDENCE_STRENGTH, CONTRADICTION_PATTERNS, PATTERNS_BY_CODE, getPattern };
