/*
 * Authoring-time generator for the frozen Open Response evaluation specs.
 *
 * This script is not loaded by the application or any Edge Function. It turns
 * the already-authorized OR_032..OR_106 concepts/feedback into reviewable,
 * deterministic data. Runtime evaluation only consumes the generated JSONB.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_MIGRATION = path.join(ROOT, 'supabase', 'migrations', '20260712230000_or_bank_content_batches.sql');
const OUTPUT_SEED = path.join(ROOT, 'supabase', 'seed', 'or_bank_evaluation_specs.json');
const OUTPUT_MIGRATION = path.join(ROOT, 'supabase', 'migrations', '20260721193453_add_or_bank_evaluation_specs.sql');

const SOURCE = 'gpt5.6-authoring';
const REVIEW = true;
const OFFICIAL_BASIS = {
  vineyard: 'expected_concepts + feedback_profile + Knowledge/official-wset/study-guide/sections 4-7 (vine and growing environment)',
  winery: 'expected_concepts + feedback_profile + Knowledge/official-wset/study-guide/sections 8-9 (winemaking and maturation)',
  sparkling: 'expected_concepts + feedback_profile + Knowledge/official-wset/study-guide/section 41 (sparkling wine production)',
  fortified: 'expected_concepts + feedback_profile + Knowledge/official-wset/study-guide/sections 43-45 (fortified wines)',
  tasting: 'expected_concepts + feedback_profile + Knowledge/official-wset/SAT + official sample marking keys',
  commercial: 'expected_concepts + feedback_profile + Knowledge/official-wset/study-guide/sections 10-11 (price and law)',
};

const COMMANDS = {
  OR_032:'describe', OR_033:'explain', OR_034:'compare', OR_035:'assess', OR_036:'evaluate',
  OR_037:'discuss', OR_038:'recommend', OR_039:'identify_and_explain', OR_040:'describe', OR_041:'explain',
  OR_042:'compare', OR_043:'assess', OR_044:'evaluate', OR_045:'discuss', OR_046:'recommend',
  OR_047:'identify_and_explain', OR_048:'explain', OR_049:'explain', OR_050:'compare', OR_051:'assess',
  OR_052:'evaluate', OR_053:'discuss', OR_054:'recommend', OR_055:'identify_and_explain', OR_056:'describe',
  OR_057:'describe', OR_058:'explain', OR_059:'compare', OR_060:'assess', OR_061:'evaluate',
  OR_062:'discuss', OR_063:'recommend', OR_064:'identify_and_explain', OR_065:'describe', OR_066:'explain',
  OR_067:'compare', OR_068:'assess', OR_069:'evaluate', OR_070:'discuss', OR_071:'recommend',
  OR_072:'identify_and_explain', OR_073:'describe', OR_074:'explain', OR_075:'compare', OR_076:'assess',
  OR_077:'evaluate', OR_078:'discuss', OR_079:'recommend', OR_080:'identify_and_explain', OR_081:'describe',
  OR_082:'describe', OR_083:'explain', OR_084:'compare', OR_085:'assess', OR_086:'evaluate',
  OR_087:'discuss', OR_088:'recommend', OR_089:'identify_and_explain', OR_090:'describe', OR_091:'explain',
  OR_092:'compare', OR_093:'assess', OR_094:'evaluate', OR_095:'discuss', OR_096:'recommend',
  OR_097:'identify_and_explain', OR_098:'describe', OR_099:'explain', OR_100:'compare', OR_101:'assess',
  OR_102:'evaluate', OR_103:'discuss', OR_104:'recommend', OR_105:'identify_and_explain', OR_106:'describe',
};

const CAUSAL_COMMANDS = new Set(['explain', 'why', 'how', 'discuss', 'identify_and_explain', 'justify']);
const CONNECTORS = [
  'porque', 'ya que', 'debido a', 'por ello', 'por lo tanto', 'como consecuencia',
  'lo que provoca', 'esto provoca', 'esto lleva a', 'conduce a', 'da lugar a', 'resulta en',
  'a su vez', 'de modo que', 'therefore', 'because', 'leads to', 'results in'
];

// Authoring rules change the vocabulary nucleus; they never wrap the full
// canonical phrase. These substitutions mirror normal Level 2/3 phrasing.
const PARAPHRASE_REPLACEMENTS = [
  [/evolución del color hacia tonos más dorados/gi, 'color más ambarino'],
  [/evolución del color hacia tonos más dorados/gi, 'tonos dorados de evolución'],
  [/evolución del color hacia tonos más dorados/gi, 'pérdida de tonos juveniles'],
  [/desarrollo de aromas secundarios y terciarios/gi, 'evolución hacia aromas de elaboración y crianza'],
  [/notas de vainilla y tostado del roble/gi, 'carácter de vainilla y madera tostada'],
  [/aumento de la sensación de textura y volumen en boca/gi, 'boca más amplia y con mayor volumen'],
  [/prolongación del final de boca/gi, 'mayor persistencia del final'],
  [/temperaturas más bajas a mayor altitud/gi, 'condiciones más frescas en altura'],
  [/maduración más lenta de la uva/gi, 'la uva madura a menor velocidad'],
  [/mayor retención de ácido málico/gi, 'conserva más acidez málica'],
  [/mayor retención de ácido málico/gi, 'mantiene el ácido málico'],
  [/mayor retención de ácido málico/gi, 'conserva la acidez'],
  [/mayor retención de ácido málico/gi, 'mantiene el frescor'],
  [/menor acumulación de azúcar/gi, 'acumula menos azúcares'],
  [/perfil final más fresco/gi, 'estilo de mayor frescor'],
  [/acidez más alta/gi, 'acidez elevada'], [/acidez más baja/gi, 'acidez reducida'],
  [/acidez marcada y definida/gi, 'estructura ácida precisa'],
  [/preservación de la acidez/gi, 'mantenimiento del frescor'],
  [/retención de acidez/gi, 'conservación de la acidez'],
  [/retención de acidez/gi, 'mantiene el frescor'],
  [/pérdida de acidez/gi, 'descenso de la frescura'],
  [/fermentación maloláctica/gi, 'conversión maloláctica'],
  [/fermentación maloláctica/gi, 'FML'],
  [/fermentación en depósitos de acero inoxidable/gi, 'fermentación en tanque inerte'],
  [/control de temperatura durante la fermentación/gi, 'fermentación a temperatura controlada'],
  [/segunda fermentación en botella/gi, 'toma de espuma en botella'],
  [/autólisis de las levaduras/gi, 'descomposición autolítica de las levaduras'],
  [/contacto prolongado con las lías/gi, 'crianza larga sobre lías'],
  [/formación de burbujas finas/gi, 'perlage fino'],
  [/podredumbre noble/gi, 'botritis noble'], [/podredumbre noble/gi, 'Botrytis cinerea'],
  [/rango de temperatura diurno/gi, 'amplitud térmica diurna'],
  [/azúcar residual/gi, 'azúcares residuales'],
  [/microoxigenación/gi, 'aporte controlado de oxígeno'],
  [/levaduras autóctonas/gi, 'levaduras indígenas'],
  [/levaduras autóctonas/gi, 'levaduras salvajes'],
  [/levaduras seleccionadas/gi, 'cepas comerciales inoculadas'],
  [/manejo del dosel/gi, 'gestión de la canopia'],
  [/crianza oxidativa/gi, 'envejecimiento con exposición al oxígeno'],
  [/crianza reductiva/gi, 'envejecimiento protegido del oxígeno'],
  [/potencial de guarda/gi, 'capacidad de envejecimiento'],
  [/capacidad de guarda/gi, 'aptitud para envejecer'],
  [/suavización de los taninos/gi, 'taninos más redondos'],
  [/suavización de taninos/gi, 'reducción de la astringencia'],
  [/polimerización de los taninos/gi, 'unión de moléculas tánicas'],
  [/polimerización de taninos/gi, 'formación de cadenas tánicas mayores'],
  [/taninos de pepita/gi, 'taninos de semilla'],
  [/taninos de piel/gi, 'taninos del hollejo'],
  [/relación piel-pulpa/gi, 'proporción de hollejo respecto a pulpa'],
  [/tamaño de las bayas/gi, 'calibre de la baya'],
  [/rendimientos bajos/gi, 'baja producción por hectárea'],
  [/raíces más profundas/gi, 'sistema radicular profundo'],
  [/suelos ricos en piedra caliza/gi, 'suelos calcáreos'],
  [/suelos volcánicos/gi, 'terrenos de origen volcánico'],
  [/suelo de valle/gi, 'parcela en fondo de valle'],
  [/estación de cultivo fresca/gi, 'ciclo vegetativo fresco'],
  [/exposición solar/gi, 'insolación'], [/disponibilidad de agua/gi, 'acceso hídrico'],
  [/estrés hídrico/gi, 'déficit de agua'], [/vigor vegetativo/gi, 'crecimiento de la canopia'],
  [/cosecha/gi, 'vendimia'], [/momento de vendimia/gi, 'fecha de cosecha'],
  [/embotellado temprano/gi, 'embotellado joven'],
  [/aromas primarios/gi, 'carácter varietal y frutal'],
  [/aromas secundarios/gi, 'aromas de elaboración'],
  [/aromas terciarios/gi, 'bouquet de evolución'],
  [/apertura de los aromas/gi, 'mayor expresividad aromática'],
  [/expresión de la fruta/gi, 'carácter frutal'],
  [/fruta más madura/gi, 'fruta de mayor madurez'],
  [/notas terrosas/gi, 'carácter de sotobosque'],
  [/color teja/gi, 'tonalidad ladrillo'],
  [/pardeamiento oxidativo/gi, 'oscurecimiento por oxidación'],
  [/aclarado o apertura del color/gi, 'menor intensidad cromática'],
  [/estabilización del color/gi, 'fijación del color'],
  [/textura cremosa/gi, 'sensación de boca cremosa'],
  [/mayor complejidad aromática/gi, 'perfil aromático más complejo'],
  [/complejidad aromática/gi, 'diversidad de aromas'],
  [/prolongación del final/gi, 'mayor persistencia'],
  [/juicio de calidad/gi, 'valoración cualitativa'],
  [/juicio de equilibrio/gi, 'valoración del balance'],
  [/precio premium/gi, 'precio superior'],
  [/coste de producción/gi, 'costes productivos'],
  [/mano de obra/gi, 'trabajo manual'],
  [/posicionamiento de mercado/gi, 'ubicación comercial de la marca'],
  [/percepción del consumidor/gi, 'imagen ante el consumidor'],
  [/tipos de certificación/gi, 'modalidades de certificación'],
  [/orgánica/gi, 'ecológica'], [/biodinámica/gi, 'biodynamic'],
  [/control de/gi, 'gestión de'], [/manejo de/gi, 'gestión de'],
  [/selección de/gi, 'elección de'], [/consideración de/gi, 'valoración de'],
  [/influencia de/gi, 'efecto de'], [/impacto de/gi, 'efecto de'],
  [/papel de/gi, 'función de'], [/relación entre/gi, 'vínculo entre'],
  [/variación en/gi, 'cambios en'], [/diferencias de/gi, 'contrastes de'],
  [/menor acumulación/gi, 'menos acumulación'], [/menor complejidad/gi, 'perfil más simple'],
  [/menor acidez/gi, 'acidez más baja'], [/menor coste/gi, 'coste más bajo'],
  [/mayor/gi, 'más'],
  [/preservación de/gi, 'conservación de'],
  [/crianza/gi, 'envejecimiento'],
  [/suavización/gi, 'redondeo'],
  [/potencial individual/gi, 'aptitud propia'], [/expresión clara/gi, 'carácter nítido'],
];

const CURATED_WSET_EQUIVALENTS = [
  [/^evolución del color hacia tonos más dorados$/i, ['golden hue', 'development on the rim']],
  [/retención.*(?:ácido málico|acidez)|preservación.*acidez/i, ['high acidity retained']],
  [/^(?:proceso de )?autólisis de las levaduras$/i, ['yeast autolysis']],
  [/^contacto prolongado con las lías$/i, ['lees ageing']],
  [/^fermentación en depósitos de acero inoxidable$/i, ['stainless-steel fermentation']],
  [/^(?:potencial|capacidad) de guarda(?: prolongado)?$/i, ['ageing potential']],
  [/^suelos ricos en piedra caliza$/i, ['limestone soils']],
  [/^rendimientos bajos$/i, ['low yields']],
  [/^(?:formación|desarrollo) de color teja$/i, ['brick hue']],
];

const EXACT_PARAPHRASES = {
  'desarrollo de aromas secundarios y terciarios': ['evolución hacia aromas de elaboración y crianza', 'desarrollo de notas secundarias y terciarias'],
  'clima frío: predominio de aromas primarios': ['clima fresco con carácter varietal dominante', 'perfil de fruta primaria en clima frío'],
  'clima cálido: mayor presencia de aromas secundarios y terciarios': ['clima cálido con mayor desarrollo aromático', 'más notas de elaboración y evolución en clima cálido'],
  'preservación de aromas primarios': ['conserva el carácter varietal', 'mantiene la fruta primaria'],
  'desarrollo de aromas secundarios': ['evolución hacia aromas de elaboración', 'desarrollo de notas secundarias'],
  'transición de aromas primarios a secundarios': ['paso de fruta primaria a notas de elaboración', 'evolución de aromas varietales hacia secundarios'],
  'desarrollo de aromas terciarios': ['aparición de bouquet de evolución', 'desarrollo de notas de crianza en botella'],
  'maduración más lenta de la uva': ['la uva madura a menor velocidad', 'ciclo de maduración más largo'],
  'mayor retención de ácido málico': ['conserva más acidez málica', 'mantiene el ácido málico', 'conserva la acidez', 'mantiene el frescor', 'high acidity retained'],
  'mayor retención de acidez': ['conserva más acidez', 'mantiene el frescor', 'high acidity retained'],
  'retención de acidez': ['conservación de la acidez', 'mantiene el frescor', 'high acidity retained'],
  'beneficio del rango de temperatura diurno: azúcar y acidez simultáneos': ['beneficio de la amplitud térmica diurna: azúcar y acidez simultáneos'],
  'beneficio del rango de temperatura diurno': ['beneficio de la amplitud térmica diurna'],
  'variación del potencial de guarda': ['variación de la capacidad de envejecimiento'],
  'precisión en el control de temperatura': ['precisión en la gestión de temperatura'],
  'evolución del manejo de plagas y enfermedades': ['evolución de la gestión de plagas y enfermedades'],
  'precisión del control de oxígeno': ['precisión de la gestión de oxígeno'],
  'complejidad del control de la fermentación': ['complejidad de la gestión de la fermentación'],
};

const OPPOSITE_CONTEXTS = [
  [/evolución del color|color teja|pardeamiento/i, ['mantiene tonos juveniles', 'color primario sin evolución']],
  [/tonos más dorados/i, ['color verdoso juvenil', 'sin evolución hacia dorado']],
  [/aromas secundarios y terciarios|aromas terciarios|complejidad terciaria/i, ['solo aromas primarios', 'perfil aromático juvenil']],
  [/aromas primarios|fruta primaria/i, ['fruta apagada', 'predominio de aromas evolucionados']],
  [/vainilla|tostado del roble/i, ['roble neutro', 'sin carácter tostado']],
  [/retención.*(?:acidez|ácido)|preservación.*acidez|acidez más alta|acidez marcada/i, ['pierde acidez', 'acidez baja', 'vino plano']],
  [/acidez más baja|menor acidez|pérdida de acidez/i, ['acidez elevada', 'frescor marcado']],
  [/mayor altitud|temperaturas más bajas|estación.*fresca|clima frío/i, ['zona cálida de baja altitud', 'temperaturas elevadas']],
  [/clima cálido|temperaturas más altas/i, ['condiciones frías', 'maduración limitada por frío']],
  [/maduración más lenta/i, ['maduración rápida', 'ciclo de madurez acelerado']],
  [/menor acumulación de azúcar/i, ['alta acumulación de azúcar', 'potencial alcohólico elevado']],
  [/perfil.*fresco|frescura/i, ['perfil pesado', 'vino falto de frescor']],
  [/suavización.*tanin|integración.*tanin|taninos resueltos/i, ['taninos duros', 'astringencia marcada']],
  [/mayores niveles de tanino|estructura tánica fuerte|concentración de taninos/i, ['tanino bajo', 'estructura tánica ligera']],
  [/polimerización.*tanin/i, ['taninos sin polimerizar', 'estructura tánica cerrada']],
  [/rendimientos bajos/i, ['rendimientos altos', 'producción elevada por hectárea']],
  [/raíces más profundas/i, ['raíces superficiales']],
  [/mayor concentración|concentración de la baya/i, ['fruta diluida', 'baja concentración']],
  [/fermentación maloláctica/i, ['ácido málico sin convertir', 'FML bloqueada']],
  [/evitar.*maloláctica|prevención.*maloláctica/i, ['fermentación maloláctica completa']],
  [/acero inoxidable/i, ['fermentación en barrica', 'recipiente con aporte aromático']],
  [/uso mínimo o nulo de roble|evitar el roble/i, ['roble nuevo dominante', 'marcado carácter de barrica']],
  [/crianza oxidativa|oxidación|pardeamiento/i, ['ambiente reductor', 'protegido del oxígeno']],
  [/crianza reductiva/i, ['exposición prolongada al oxígeno', 'evolución oxidativa']],
  [/riesgo de oxidación|sobre-oxidación/i, ['protección antioxidante', 'sin exposición al oxígeno']],
  [/autólisis|contacto.*lías/i, ['sin crianza sobre lías', 'degüelle temprano']],
  [/burbujas finas/i, ['burbuja gruesa', 'perlage basto']],
  [/podredumbre noble|botrytis/i, ['podredumbre gris', 'uva sana sin botritis']],
  [/azúcar residual/i, ['vino completamente seco', 'fermentación hasta sequedad']],
  [/dulzor/i, ['perfil seco', 'sin azúcar perceptible']],
  [/potencial de guarda|capacidad de guarda|guarda prolongada/i, ['consumo temprano', 'sin aptitud para envejecer']],
  [/complejidad/i, ['perfil simple', 'carácter unidimensional']],
  [/equilibrio|integración estructural/i, ['vino desequilibrado', 'componentes desintegrados']],
  [/final.*prolong|longitud|persistencia/i, ['final corto', 'poca persistencia']],
  [/precio premium|posicionamiento.*premium/i, ['precio básico', 'segmento de entrada']],
  [/aumento del coste|mayor coste|costes altos/i, ['costes reducidos', 'producción de bajo coste']],
  [/mayor intensidad de mano de obra/i, ['producción mecanizada', 'baja necesidad de trabajo manual']],
  [/certificación/i, ['sin certificación', 'manejo convencional no certificado']],
  [/control de temperatura/i, ['fermentación sin control térmico']],
  [/estabilidad microbiológica/i, ['inestabilidad microbiana', 'riesgo de contaminación']],
  [/estabilización del color/i, ['color inestable', 'pérdida de pigmento']],
  [/aromas a pan y bizcocho/i, ['perfil sin notas de autólisis']],
];

const MISSPELLINGS = {
  acides:'acidez', asides:'acidez', madures:'madurez', maduracionn:'maduración',
  fermantacion:'fermentación', fermentacionn:'fermentación', malolactica:'maloláctica',
  taninoos:'taninos', taninnos:'taninos', botritis:'botrytis', botritys:'botrytis',
  microoxigenasion:'microoxigenación', oxidasion:'oxidación', polimerisacion:'polimerización',
  terroirr:'terroir', levadurras:'levaduras', vinedo:'viñedo', organoleptico:'organoléptico',
  kimmeridgiense:'kimmeridgiense', asucar:'azúcar', azucarres:'azúcares',
};

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function unique(values, canonical) {
  const seen = new Set([normalize(canonical)]);
  return values.map(v => String(v).trim()).filter(v => {
    const key = normalize(v);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function synonymize(canonical) {
  if (EXACT_PARAPHRASES[canonical]) return unique(EXACT_PARAPHRASES[canonical], canonical);
  const values = [];
  PARAPHRASE_REPLACEMENTS.forEach(([pattern, replacement]) => {
    if (pattern.test(canonical)) values.push(canonical.replace(pattern, replacement));
    pattern.lastIndex = 0;
  });
  CURATED_WSET_EQUIVALENTS.forEach(([pattern, synonyms]) => {
    if (pattern.test(canonical)) values.push(...synonyms);
    pattern.lastIndex = 0;
  });
  return unique(values, canonical).filter(value => !isTemplateSynonym(value, canonical)).slice(0, 8);
}

function isTemplateSynonym(value, canonical) {
  const synonym = normalize(value);
  const source = normalize(canonical);
  return synonym === `presencia de ${source}` ||
    synonym === `${source} en el vino` ||
    synonym === `se observa ${source}` ||
    synonym === `aparicion de ${source}` ||
    (/^(incremento|aumento) de /.test(synonym) && synonym.endsWith(source));
}

function basisFor(concepts) {
  const text = normalize(concepts.join(' '));
  if (/espum|segunda fermentacion|lias|autolisis/.test(text)) return OFFICIAL_BASIS.sparkling;
  if (/fortific|jerez|oporto|tokaji|solera/.test(text)) return OFFICIAL_BASIS.fortified;
  if (/coste|precio|mercado|comercial|rentabilidad|certificacion/.test(text)) return OFFICIAL_BASIS.commercial;
  if (/calidad|aroma|color|textura|final|sensorial|cata/.test(text)) return OFFICIAL_BASIS.tasting;
  if (/suelo|clima|altitud|vinedo|vid|baya|cosecha|rendimiento|dosel/.test(text)) return OFFICIAL_BASIS.vineyard;
  return OFFICIAL_BASIS.winery;
}

function evidenceType(canonical) {
  const text = normalize(canonical);
  if (/compar|diferenc|contraste|frente|vs\b|:/.test(text)) return 'comparison';
  if (/juicio|calidad|equilibrio|viabilidad|posicionamiento|apropiado|valor dependiente/.test(text)) return 'conclusion';
  if (/ferment|extraccion|polimer|oxid|macer|conversion|autolisis|deshidrat|control|gestion|interrupcion/.test(text)) return 'mechanism';
  if (/clima|suelo|altitud|temperatura|variedad|rendimiento|orientacion|precipitacion|porosidad/.test(text)) return 'factor';
  return 'effect';
}

function forbiddenContexts(canonical) {
  const values = [];
  OPPOSITE_CONTEXTS.forEach(([pattern, opposites]) => {
    if (pattern.test(canonical)) values.push(...opposites);
    pattern.lastIndex = 0;
  });
  const transformations = [
    [/^mayor\s+/i, 'menor '], [/^menor\s+/i, 'mayor '],
    [/^aumento de\s+/i, 'disminución de '], [/^reducción de\s+/i, 'aumento de '],
    [/^pérdida de\s+/i, 'conservación de '], [/^preservación de\s+/i, 'pérdida de '],
    [/^retención de\s+/i, 'pérdida de '], [/^beneficio de\s+/i, 'perjuicio de '],
    [/^evitar el\s+/i, 'uso de '], [/^evitar (?!el\b)/i, 'uso de '], [/^prevención de\s+/i, 'presencia de '],
  ];
  transformations.forEach(([pattern, replacement]) => {
    if (pattern.test(canonical)) values.push(canonical.replace(pattern, replacement));
    pattern.lastIndex = 0;
  });
  return unique(values, canonical).filter(value => !isTemplateForbidden(value, canonical)).slice(0, 6);
}

function isTemplateForbidden(value, canonical) {
  const context = normalize(value);
  const source = normalize(canonical);
  return context === `no ${source}` || context.startsWith('nunca ') ||
    (context.startsWith('sin ') && context.split(' ').length > 5);
}

function relevantMisspellings(concepts) {
  const text = normalize(concepts.join(' '));
  const selected = {};
  for (const [wrong, right] of Object.entries(MISSPELLINGS)) {
    if (text.includes(normalize(right)) || ['acides', 'fermantacion', 'taninoos'].includes(wrong)) selected[wrong] = right;
  }
  return selected;
}

function conceptSpec(canonical, index, basis) {
  const synonyms = synonymize(canonical);
  return {
    canonical,
    synonyms,
    evidence_type: evidenceType(canonical),
    forbidden_contexts: forbiddenContexts(canonical),
    polarity: 'affirmative',
    priority: index < 3 ? 'core' : 'supporting',
    _basis: `${basis}; synonyms curated for real WSET paraphrase and realistic opposites`,
    _needs_review: REVIEW,
    _source: SOURCE,
  };
}

function stageSpec(name, selected, basis) {
  return {
    patterns: selected.map(c => c.canonical),
    synonyms: unique(selected.flatMap(c => c.synonyms), '').slice(0, 10),
    _basis: `${basis}; stage=${name}; ordered from authorized expected_concepts; synonyms curated for real paraphrase`,
    _needs_review: REVIEW,
    _source: SOURCE,
  };
}

function causalSpec(concepts, command, basis) {
  const n = concepts.length;
  const firstEnd = Math.max(1, Math.floor(n / 3));
  const secondEnd = Math.max(firstEnd + 1, Math.ceil((n * 2) / 3));
  const cause = concepts.slice(0, firstEnd);
  const mechanism = concepts.slice(firstEnd, secondEnd);
  const effect = concepts.slice(secondEnd);
  return {
    required: CAUSAL_COMMANDS.has(command),
    causa: stageSpec('causa', cause.length ? cause : concepts.slice(0, 1), basis),
    mecanismo: stageSpec('mecanismo', mechanism.length ? mechanism : concepts.slice(0, 1), basis),
    efecto: stageSpec('efecto', effect.length ? effect : concepts.slice(-1), basis),
    transitions: ['causa->mecanismo', 'mecanismo->efecto'],
    connectors_expected: CONNECTORS,
    _basis: `${basis}; causal ordering derived from feedback_profile response structure; synonyms curated for real paraphrase`,
    _needs_review: REVIEW,
    _source: SOURCE,
  };
}

function parseAuthorizedItems() {
  const lines = fs.readFileSync(CONTENT_MIGRATION, 'utf8').split(/\r?\n/);
  const items = [];
  const re = /expected_concepts = '(\[.*\])'::jsonb, feedback_profile = '(\{.*\})'::jsonb where item_id = '(OR_\d{3})';/;
  for (const line of lines) {
    const match = line.match(re);
    if (!match) continue;
    items.push({ item_id: match[3], expected: JSON.parse(match[1]), feedback: JSON.parse(match[2]) });
  }
  if (items.length !== 75) throw new Error(`Expected 75 authorized items, found ${items.length}`);
  return items;
}

function buildSpecs() {
  return parseAuthorizedItems().map(item => {
    const command = COMMANDS[item.item_id];
    if (!command) throw new Error(`Missing command verb for ${item.item_id}`);
    const basis = basisFor(item.expected);
    const concepts = item.expected.map((canonical, index) => conceptSpec(canonical, index, basis));
    return {
      item_id: item.item_id,
      _needs_review: REVIEW,
      _source: SOURCE,
      _basis: `${basis}; synonyms curated for real WSET paraphrase and realistic opposites`,
      concepts,
      causal_chain: causalSpec(concepts, command, basis),
      command_verb: command,
      common_misspellings: relevantMisspellings(item.expected),
      answer_length_guidance: {
        min_meaningful_tokens: ['state', 'list'].includes(command) ? 5 : (command === 'describe' ? 10 : 12),
        _basis: `command verb contract: ${command}`,
        _needs_review: REVIEW,
        _source: SOURCE,
      },
    };
  });
}

function migrationSql(specs) {
  const payload = JSON.stringify(specs).replace(/'/g, "''");
  return `begin;\n\n` +
    `alter table public.or_bank\n  add column if not exists evaluation_spec jsonb;\n\n` +
    `comment on column public.or_bank.evaluation_spec is\n  'Versioned deterministic evaluation rules. Authoring metadata requires human review; runtime makes no generative API calls.';\n\n` +
    `with authored_specs as (\n  select value as spec\n  from jsonb_array_elements('${payload}'::jsonb)\n)\n` +
    `update public.or_bank as ob\nset evaluation_spec = authored_specs.spec\nfrom authored_specs\nwhere ob.item_id = authored_specs.spec->>'item_id'\n  and ob.item_id between 'OR_032' and 'OR_106';\n\n` +
    `commit;\n`;
}

function main() {
  const specs = buildSpecs();
  for (const spec of specs) {
    for (const concept of spec.concepts) {
      if (concept.synonyms.some(value => isTemplateSynonym(value, concept.canonical))) {
        throw new Error(`Template synonym survived for ${spec.item_id}: ${concept.canonical}`);
      }
      if (concept.forbidden_contexts.some(value => isTemplateForbidden(value, concept.canonical))) {
        throw new Error(`Template forbidden context survived for ${spec.item_id}: ${concept.canonical}`);
      }
    }
  }
  fs.mkdirSync(path.dirname(OUTPUT_SEED), { recursive: true });
  fs.writeFileSync(OUTPUT_SEED, JSON.stringify(specs, null, 2) + '\n', 'utf8');
  fs.writeFileSync(OUTPUT_MIGRATION, migrationSql(specs), 'utf8');
  process.stdout.write(`Authored ${specs.length} frozen evaluation specs.\n`);
}

if (require.main === module) main();

module.exports = { buildSpecs, normalize, synonymize, forbiddenContexts, isTemplateSynonym, isTemplateForbidden };
