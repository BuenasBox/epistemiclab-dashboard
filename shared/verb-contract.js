/**
 * Canonical command-verb contract used by every deterministic coaching layer.
 * UMD export: window.VerbContract in browsers, module.exports in Node tests.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VerbContract = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function entry(key, aliases, structure, options) {
    options = options || {};
    return {
      key: key,
      aliases: aliases,
      expected_structure: structure,
      causal_required: !!options.causal,
      balance_required: !!options.balance,
      comparison_required: !!options.compare,
      definition: options.definition || '',
      checklist: options.checklist || structure.map(function (step) { return '¿Incluiste ' + step.toLowerCase() + '?'; }),
      mentor_message: options.mentor || '',
      avoid: options.avoid || [],
      key_phrases: options.phrases || [],
      label: options.label || key.toUpperCase(),
    };
  }

  var VERBS = {
    describe: entry('describe', ['describe', 'describa', 'describir', 'caracteriza', 'characterize'], ['Qué es', 'Características', 'Datos relevantes'], {
      definition: 'Enuncia las características, rasgos o apariencia de algo. No expliques causas ni razones.',
      checklist: ['¿Observaste las características principales?', '¿Usaste vocabulario técnico?', '¿Cubriste múltiples dimensiones?'],
      mentor: 'Responde al qué con términos específicos y cubre todas las dimensiones relevantes.',
      avoid: ['Explicar por qué', 'Dar opiniones', 'Añadir causas no solicitadas'], phrases: ['presenta', 'muestra', 'se caracteriza por'], label: 'DESCRIBE'
    }),
    explain: entry('explain', ['explain', 'explica', 'explique', 'explicar', 'account for'], ['Factor', 'Mecanismo', 'Resultado', 'Impacto en calidad'], {
      causal: true, definition: 'Da razones o justifica un fenómeno mediante una relación causa-mecanismo-efecto.',
      checklist: ['¿Identificaste el factor inicial?', '¿Explicaste el mecanismo?', '¿Nombraste el resultado final?', '¿Usaste lenguaje causal?'],
      mentor: 'Recorre la cadena completa: factor → mecanismo → resultado en el vino.',
      avoid: ['Enumerar hechos sueltos', 'Omitir el mecanismo'], phrases: ['porque', 'debido a', 'provoca', 'conduce a'], label: 'EXPLICA'
    }),
    justify: entry('justify', ['justify', 'justifica', 'justifique', 'justificar', 'defend'], ['Juicio', 'Evidencia', 'Evidencia', 'Conclusión'], {
      causal: true, definition: 'Da razones o evidencia que respalden una posición o elección planteada.',
      checklist: ['¿Enunciaste tu posición?', '¿Diste tres o más razones?', '¿Conectaste cada razón con tu afirmación?'],
      mentor: 'Defiende la posición con evidencia específica y conecta cada razón directamente con ella.',
      avoid: ['Afirmar sin justificar', 'Repetir la misma idea'], phrases: ['porque', 'esto demuestra', 'la evidencia indica'], label: 'JUSTIFICA'
    }),
    assess: entry('assess', ['assess', 'valora', 'valore', 'evalúa la calidad', 'evaluate the quality', 'rate'], ['Juicio', 'Evidencia específica', 'Criterios de calidad', 'Conclusión'], {
      balance: true, definition: 'Emite un juicio fundamentado sobre calidad o valor según criterios establecidos.',
      checklist: ['¿Declaraste un juicio claro?', '¿Lo apoyaste con evidencia específica?', '¿Aplicaste criterios de calidad pertinentes?'],
      mentor: 'Declara el juicio y respáldalo con evidencia observable de balance, intensidad, complejidad y longitud.',
      avoid: ['Dar una opinión sin respaldo', 'Enumerar observaciones sin conclusión'], label: 'VALORA'
    }),
    evaluate: entry('evaluate', ['evaluate', 'evalúa', 'evalúe', 'evaluar', 'pondera', 'appraise'], ['Aspecto positivo', 'Importancia', 'Aspecto negativo', 'Importancia', 'Balance final'], {
      balance: true, definition: 'Sopesa evidencia y factores para emitir una conclusión crítica y matizada.',
      checklist: ['¿Identificaste tres o más factores?', '¿Valoraste su impacto relativo?', '¿Sintetizaste una conclusión?'],
      mentor: 'Sopesa beneficios, costes y relevancia relativa antes de concluir.',
      avoid: ['Listar factores sin ponderarlos', 'No llegar a una conclusión'], phrases: ['en conjunto', 'sin embargo', 'por otro lado'], label: 'EVALÚA'
    }),
    compare: entry('compare', ['compare', 'compara', 'compare', 'comparar', 'contrast', 'contrasta'], ['Factor', 'Elemento A', 'Elemento B', 'Impacto'], {
      compare: true, definition: 'Identifica semejanzas y diferencias entre dos o más elementos usando dimensiones compartidas.',
      checklist: ['¿Identificaste los elementos?', '¿Cubriste semejanzas?', '¿Cubriste diferencias?', '¿Organizaste por dimensiones?'],
      mentor: 'Compara factor a factor y cubre ambos elementos en estructura paralela.',
      avoid: ['Describir cada elemento por separado', 'Cubrir solo un elemento'], phrases: ['mientras que', 'en cambio', 'a diferencia de'], label: 'COMPARA'
    }),
    why: entry('why', ['why', 'por qué', 'porque motivo'], ['Causa directa', 'Mecanismo', 'Efecto'], {
      causal: true, definition: 'Identifica la causa directa y conéctala con el efecto observado.', mentor: 'Responde con una causa directa, precisa y explícita.', phrases: ['porque', 'debido a', 'ya que'], label: 'POR QUÉ'
    }),
    how: entry('how', ['how', 'cómo', 'de qué manera'], ['Punto de partida', 'Pasos intermedios', 'Resultado final'], {
      causal: true, definition: 'Expone un mecanismo o proceso en orden lógico.', mentor: 'Recorre el proceso paso a paso sin omitir el mecanismo.', phrases: ['primero', 'luego', 'finalmente'], label: 'CÓMO'
    }),
    discuss: entry('discuss', ['discuss', 'discute', 'discutir', 'analiza', 'analice', 'analizar', 'examine'], ['Factor', 'Qué provoca', 'Cómo afecta el estilo', 'Cómo afecta la calidad'], {
      causal: true, balance: true, definition: 'Examina perspectivas o factores, sus consecuencias y una conclusión razonada.',
      mentor: 'Analiza más de una perspectiva y conecta cada factor con estilo y calidad.', phrases: ['por un lado', 'sin embargo', 'por otro lado'], label: 'ANALIZA'
    }),
    recommend: entry('recommend', ['recommend', 'recomienda', 'recomiende', 'recomendar', 'suggest', 'sugiere'], ['Recomendación', 'Evidencia técnica', 'Ajuste al escenario', 'Conclusión'], {
      causal: true, definition: 'Propone una acción específica y la justifica según el escenario.', mentor: 'Da una recomendación concreta y explica por qué encaja en el contexto.', label: 'RECOMIENDA'
    }),
    outline: entry('outline', ['outline', 'esquematiza', 'delinea', 'resume los puntos'], ['Punto principal 1', 'Punto principal 2', 'Punto principal 3'], {
      definition: 'Presenta los puntos principales de forma breve y ordenada.', mentor: 'Prioriza los puntos clave sin desarrollo excesivo.', label: 'ESQUEMATIZA'
    }),
    state: entry('state', ['state', 'indica', 'indique', 'establece', 'menciona'], ['Respuesta breve y precisa'], {
      definition: 'Enuncia un hecho específico sin elaboración innecesaria.', mentor: 'Da el hecho solicitado de manera directa y precisa.', label: 'INDICA'
    }),
    list: entry('list', ['list', 'lista', 'enumera', 'enumerate', 'nombra'], ['Elementos solicitados'], {
      definition: 'Enumera los elementos pedidos sin explicación adicional.', mentor: 'Respeta el número solicitado y usa un formato claro.', label: 'ENUMERA'
    }),
    identify_and_explain: entry('identify_and_explain', ['identify and explain', 'identifica y explica', 'identify & explain'], ['Identificación', 'Mecanismo o razón', 'Consecuencia', 'Resultado'], {
      causal: true, definition: 'Identifica con precisión y explica el mecanismo o razón de esa identificación.',
      mentor: 'Une explícitamente la identificación con su explicación.', label: 'IDENTIFICA Y EXPLICA'
    }),
    summarize: entry('summarize', ['summarize', 'summarise', 'resume', 'resuma', 'sintetiza'], ['Idea central', 'Puntos esenciales', 'Síntesis breve'], {
      definition: 'Condensa las ideas esenciales sin añadir análisis nuevo.',
      checklist: ['¿Identificaste la idea central?', '¿Incluiste solo los puntos esenciales?', '¿La síntesis es breve y fiel?'],
      mentor: 'Conserva la idea central y elimina detalles secundarios.', label: 'RESUME'
    }),
  };

  var aliasIndex = [];
  Object.keys(VERBS).forEach(function (key) {
    VERBS[key].aliases.forEach(function (alias) { aliasIndex.push({ alias: normalize(alias), key: key }); });
  });
  aliasIndex.sort(function (a, b) { return b.alias.length - a.alias.length; });

  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  }

  function canonicalize(value) {
    var normalized = normalize(value).replace(/-/g, '_');
    if (VERBS[normalized]) return normalized;
    if (normalized === 'identify_explain') return 'identify_and_explain';
    for (var i = 0; i < aliasIndex.length; i++) if (normalized === aliasIndex[i].alias) return aliasIndex[i].key;
    return null;
  }

  function detect(text) {
    var normalized = normalize(text);
    for (var i = 0; i < aliasIndex.length; i++) {
      var alias = aliasIndex[i].alias;
      if (normalized === alias || normalized.indexOf(alias + ' ') === 0 || normalized.indexOf('¿' + alias) === 0) return aliasIndex[i].key;
    }
    return null;
  }

  function checklist(key) {
    var canonical = canonicalize(key);
    return canonical ? VERBS[canonical].checklist.slice() : ['¿Respondiste lo que se preguntó?', '¿Tu respuesta es clara?', '¿Incluiste evidencia específica?'];
  }

  function matrix() {
    var result = {};
    Object.keys(VERBS).forEach(function (key) {
      var v = VERBS[key];
      result[key] = { busca: v.definition, estructura: v.expected_structure.slice(), causal: v.causal_required, balance: v.balance_required, compare: v.comparison_required, frases: v.key_phrases.slice() };
    });
    result.identify_explain = result.identify_and_explain;
    return result;
  }

  function toCoachData() {
    var result = {};
    Object.keys(VERBS).forEach(function (key) {
      var v = VERBS[key];
      result[key] = { definition: v.definition, do: v.checklist.map(function (x) { return x.replace(/^¿|\?$/g, ''); }), do_not: v.avoid.slice(), mentor_hint: v.mentor_message };
    });
    return result;
  }

  function toMentorConfig() {
    var verbMentors = {}, prompts = {}, patterns = {}, checklists = {};
    Object.keys(VERBS).forEach(function (key) {
      var v = VERBS[key];
      verbMentors[key] = { verb: key, mentor_role: 'guía del verbo de comando', core_guidance: v.mentor_message, thinking_structure: v.expected_structure.slice(), key_phrases: v.key_phrases.slice(), avoid: v.avoid.slice() };
      prompts[key] = v.checklist.slice();
      checklists[key] = v.checklist.slice();
      patterns[key + '_answers'] = { title: 'Características de respuestas sólidas de ' + key, elements: v.expected_structure.slice(), common_weakness: v.avoid[0] || 'No seguir la estructura solicitada.' };
    });
    return { verb_mentors: verbMentors, thinking_prompts_by_verb: prompts, command_verb_checklists: checklists, distinction_patterns: patterns };
  }

  return { schema_version: 'verb_contract_v1', verbs: VERBS, normalize: normalize, canonicalize: canonicalize, detect: detect, checklist: checklist, matrix: matrix, toCoachData: toCoachData, toMentorConfig: toMentorConfig };
});
