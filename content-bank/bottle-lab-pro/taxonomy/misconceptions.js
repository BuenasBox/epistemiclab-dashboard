'use strict';

const CODES = [
  'bottle.weight_equals_quality', 'bottle.punt_equals_quality', 'bottle.cork_equals_quality',
  'bottle.screwcap_equals_cheap', 'bottle.dark_glass_equals_old', 'bottle.shape_equals_origin',
  'bottle.shape_equals_variety', 'bottle.design_equals_quality', 'bottle.large_format_always_better',
  'bottle.low_fill_equals_fault', 'bottle.premium_packaging_equals_intrinsic_quality',
];

const MISCONCEPTIONS_BY_CODE = Object.fromEntries(CODES.map((code) => [code, {
  code,
  mentor_feedback: `Revisa el peso de la evidencia: ${code.replace('bottle.', '').replaceAll('_', ' ')} no demuestra por sí solo la identidad ni la calidad.`,
} ]));

module.exports = { CODES, MISCONCEPTIONS_BY_CODE };
