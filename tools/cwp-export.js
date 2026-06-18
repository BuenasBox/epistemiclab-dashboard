const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SOURCE_FILE = 'D:\\Descargas\\Phone Link\\WSET3_rebuilt.md';
const SOURCE_HASH = '91B5D64859140AF5C98EDE988D2F55D52579B3C8DCD5004EE225A9B62569CC25';
const EXPORT_NAMES = {
  md: 'canonical_wines.md',
  csv: 'canonical_wines.csv',
  jsonl: 'canonical_wines.jsonl',
  sql: 'canonical_wines.sql',
  xlsx: 'canonical_wines.xlsx',
  renderBlind: 'render_profiles.blind.json',
  renderDebrief: 'render_profiles.debrief.json',
  renderTraining: 'render_profiles.training.json',
  renderMap: 'render_profile_map.json',
};

const COLUMNS = [
  'canonical_id',
  'wine_family',
  'wine_name',
  'wine_style',
  'display_name',
  'wine_type',
  'country',
  'region',
  'subregion',
  'appellation',
  'grape_varieties',
  'climate',
  'altitude',
  'soil',
  'viticulture',
  'winemaking',
  'oak',
  'sweetness',
  'body',
  'acidity',
  'alcohol',
  'tannin',
  'color',
  'aroma_profile',
  'flavour_profile',
  'finish',
  'quality_level',
  'ageing_potential',
  'expected_sat_observations',
  'common_exam_points',
  'common_student_errors',
  'mentor_hints',
  'descriptor_whitelist',
  'sat_constraints',
  'reasoning_notes',
  'display_label',
  'priority',
  'wset_importance',
  'practice_priority',
  'difficulty_score',
  'confidence_score',
  'knowledge_summary',
  'sat_fingerprint',
  'pedagogical_dna',
  'comparison_engine',
  'teaching_notes',
  'reusable_knowledge_refs',
  'field_metadata',
  'source',
  'canonical_source',
  'chapter',
  'section',
  'page_reference',
  'line_reference',
];

const CRITICAL_FIELDS = [
  'canonical_id',
  'wine_family',
  'wine_name',
  'wine_style',
  'display_name',
  'wine_type',
  'country',
  'region',
  'grape_varieties',
  'source',
  'canonical_source',
  'confidence_score',
  'difficulty_score',
  'field_metadata',
  'sat_fingerprint',
  'pedagogical_dna',
  'comparison_engine',
  'teaching_notes',
  'line_reference',
  'wset_importance',
  'practice_priority',
];

function collectProfiles(profileDir) {
  if (!fs.existsSync(profileDir)) return [];
  return fs.readdirSync(profileDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .flatMap((file) => {
      const fullPath = path.join(profileDir, file);
      const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      if (!Array.isArray(parsed)) throw new Error(`${fullPath} must contain a JSON array`);
      return parsed;
    })
    .sort((a, b) => a.canonical_id.localeCompare(b.canonical_id));
}

function isEmpty(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function validateProfiles(profiles) {
  const errors = [];
  const ids = new Set();
  const styleKeys = new Set();
  const reusableRefs = loadReusableRefs();
  const allowedImportance = new Set(['CORE', 'HIGH', 'MEDIUM', 'LOW']);
  const allowedOrigins = new Set(['WSET_PRIMARY', 'STANDARD_WINE_KNOWLEDGE', 'DERIVED_FROM_STYLE', 'INFERRED_HIGH_CONFIDENCE']);
  const allowedVisibility = new Set(['PUBLIC', 'TRAINING', 'SERVER_ONLY']);
  const requiredFingerprint = ['appearance', 'nose', 'palate', 'quality', 'ageing', 'diagnostic_features'];
  const requiredPedagogy = ['core_concepts', 'learning_objectives', 'typical_misconceptions', 'mentor_focus', 'exam_traps', 'memory_hooks', 'comparison_styles'];
  const requiredComparison = ['similar_profiles', 'frequently_confused_with', 'distinguishing_features'];
  const requiredTeaching = ['common_exam_points', 'mentor_hints', 'student_traps', 'revision_priority'];

  let actualSourceHash = null;
  if (fs.existsSync(SOURCE_FILE)) {
    actualSourceHash = crypto.createHash('sha256').update(fs.readFileSync(SOURCE_FILE)).digest('hex').toUpperCase();
  }

  profiles.forEach((profile, index) => {
    const label = profile.canonical_id || `profile[${index}]`;

    for (const field of CRITICAL_FIELDS) {
      if (isEmpty(profile[field])) errors.push(`${label}: missing critical field ${field}`);
    }

    for (const field of COLUMNS) {
      if (!(field in profile)) errors.push(`${label}: missing required field ${field}`);
    }

    if (profile.canonical_id && ids.has(profile.canonical_id)) {
      errors.push(`${label}: duplicate canonical_id`);
    }
    ids.add(profile.canonical_id);

    if (profile.canonical_id && !/^SAT_WINE_\d{3}$/.test(profile.canonical_id)) {
      errors.push(`${label}: invalid canonical_id format`);
    }
    if ('confidence' in profile) {
      errors.push(`${label}: legacy confidence field is not allowed; use confidence_score`);
    }
    if (!Number.isInteger(profile.difficulty_score) || profile.difficulty_score < 1 || profile.difficulty_score > 10) {
      errors.push(`${label}: difficulty_score must be an integer from 1 to 10`);
    }
    if (typeof profile.confidence_score !== 'number' || profile.confidence_score < 0 || profile.confidence_score > 1) {
      errors.push(`${label}: confidence_score must be a number from 0 to 1`);
    }
    if (!Array.isArray(profile.line_reference) || profile.line_reference.length === 0) {
      errors.push(`${label}: missing top-level line_reference`);
    }
    if (!Array.isArray(profile.reusable_knowledge_refs) || profile.reusable_knowledge_refs.length === 0) {
      errors.push(`${label}: missing reusable_knowledge_refs`);
    } else {
      for (const ref of profile.reusable_knowledge_refs) {
        if (!reusableRefs.has(ref)) errors.push(`${label}: unknown reusable_knowledge_refs entry ${ref}`);
      }
    }
    if (JSON.stringify(profile).includes('not_stated_in_source')) {
      errors.push(`${label}: not_stated_in_source marker is not allowed in CWP-02 profiles`);
    }
    if (!profile.sat_fingerprint || typeof profile.sat_fingerprint !== 'object') {
      errors.push(`${label}: missing sat_fingerprint`);
    } else {
      for (const field of requiredFingerprint) {
        if (isEmpty(profile.sat_fingerprint[field])) errors.push(`${label}: missing sat_fingerprint.${field}`);
      }
    }
    if (!profile.pedagogical_dna || typeof profile.pedagogical_dna !== 'object') {
      errors.push(`${label}: missing pedagogical_dna`);
    } else {
      for (const field of requiredPedagogy) {
        if (!Array.isArray(profile.pedagogical_dna[field]) || profile.pedagogical_dna[field].length === 0) {
          errors.push(`${label}: missing pedagogical_dna.${field}`);
        }
      }
    }
    if (!profile.comparison_engine || typeof profile.comparison_engine !== 'object') {
      errors.push(`${label}: missing comparison_engine`);
    } else {
      for (const field of requiredComparison) {
        if (!Array.isArray(profile.comparison_engine[field])) errors.push(`${label}: missing comparison_engine.${field}`);
      }
    }
    if (!profile.teaching_notes || typeof profile.teaching_notes !== 'object') {
      errors.push(`${label}: missing teaching_notes`);
    } else {
      for (const field of requiredTeaching) {
        if (isEmpty(profile.teaching_notes[field])) errors.push(`${label}: missing teaching_notes.${field}`);
      }
    }
    if (!profile.field_metadata || typeof profile.field_metadata !== 'object') {
      errors.push(`${label}: missing field_metadata`);
    } else {
      for (const field of Object.keys(profile).filter((key) => key !== 'field_metadata')) {
        const metadata = profile.field_metadata[field];
        if (!metadata) {
          errors.push(`${label}: missing field_metadata.${field}`);
          continue;
        }
        if (!allowedOrigins.has(metadata.knowledge_origin)) {
          errors.push(`${label}: invalid knowledge_origin for ${field}`);
        }
        if (!allowedVisibility.has(metadata.visibility_level)) {
          errors.push(`${label}: invalid visibility_level for ${field}`);
        }
      }
    }

    const styleKey = [
      normalizeText(profile.country),
      normalizeText(profile.region),
      normalizeText(profile.appellation),
      normalizeText(profile.wine_style),
    ].join('|').toUpperCase();
    if (styleKeys.has(styleKey)) errors.push(`${label}: duplicate style key ${styleKey}`);
    styleKeys.add(styleKey);

    if (profile.source?.file !== SOURCE_FILE) {
      errors.push(`${label}: source file is not WSET3_rebuilt.md`);
    }
    if (!Array.isArray(profile.source?.line_references) || profile.source.line_references.length === 0) {
      errors.push(`${label}: missing source line references`);
    }
    for (const lineRef of [...(profile.source?.line_references || []), ...(profile.line_reference || [])]) {
      const match = String(lineRef).match(/^(\d+)-(\d+)$/);
      if (!match || Number(match[1]) > Number(match[2])) {
        errors.push(`${label}: invalid line reference ${lineRef}`);
      }
    }
    if (profile.canonical_source?.sha256 !== SOURCE_HASH) {
      errors.push(`${label}: canonical source hash mismatch`);
    }
    if (actualSourceHash && profile.canonical_source?.sha256 !== actualSourceHash) {
      errors.push(`${label}: canonical source hash does not match local book`);
    }
    if (!allowedImportance.has(profile.wset_importance)) {
      errors.push(`${label}: invalid wset_importance`);
    }
    if (!Number.isInteger(profile.practice_priority) || profile.practice_priority < 1 || profile.practice_priority > 5) {
      errors.push(`${label}: practice_priority must be an integer from 1 to 5`);
    }
    if (!Array.isArray(profile.grape_varieties) || profile.grape_varieties.some((g) => normalizeText(g) !== g)) {
      errors.push(`${label}: grape varieties must be normalized`);
    }
    if (normalizeText(profile.region) !== profile.region) {
      errors.push(`${label}: region must be normalized`);
    }
  });

  return { ok: errors.length === 0, errors };
}

function loadReusableRefs() {
  const reusablePath = path.resolve(__dirname, '..', 'canonical-wine-catalog', 'shared', 'reusable-knowledge.json');
  if (!fs.existsSync(reusablePath)) return new Set();
  const reusable = JSON.parse(fs.readFileSync(reusablePath, 'utf8'));
  return new Set(Object.keys(reusable.descriptor_packs || {}));
}

function scalar(value) {
  if (Array.isArray(value) || (value && typeof value === 'object')) return JSON.stringify(value);
  return value === undefined || value === null ? '' : String(value);
}

function csvEscape(value) {
  const text = scalar(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function jsonSql(value) {
  return sqlString(JSON.stringify(value));
}

function exportProfiles(profiles, exportDir) {
  const validation = validateProfiles(profiles);
  if (!validation.ok) {
    throw new Error(`CWP validation failed:\n${validation.errors.join('\n')}`);
  }

  fs.mkdirSync(exportDir, { recursive: true });
  fs.writeFileSync(path.join(exportDir, EXPORT_NAMES.md), toMarkdown(profiles), 'utf8');
  fs.writeFileSync(path.join(exportDir, EXPORT_NAMES.csv), toCsv(profiles), 'utf8');
  fs.writeFileSync(path.join(exportDir, EXPORT_NAMES.jsonl), toJsonl(profiles), 'utf8');
  fs.writeFileSync(path.join(exportDir, EXPORT_NAMES.sql), toSql(profiles), 'utf8');
  fs.writeFileSync(path.join(exportDir, EXPORT_NAMES.xlsx), toXlsx(profiles));
  fs.writeFileSync(path.join(exportDir, EXPORT_NAMES.renderBlind), toPrettyJson(toBlindRenderProfiles(profiles)), 'utf8');
  fs.writeFileSync(path.join(exportDir, EXPORT_NAMES.renderDebrief), toPrettyJson(toDebriefRenderProfiles(profiles, 'debrief')), 'utf8');
  fs.writeFileSync(path.join(exportDir, EXPORT_NAMES.renderTraining), toPrettyJson(toDebriefRenderProfiles(profiles, 'training')), 'utf8');
  fs.writeFileSync(path.join(exportDir, EXPORT_NAMES.renderMap), toPrettyJson(toRenderProfileMap(profiles)), 'utf8');
}

function toPrettyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function toBlindRenderProfiles(profiles) {
  return profiles.map((profile, index) => ({
    canonical_id: profile.canonical_id,
    render_id: `BLIND_${String(index + 1).padStart(3, '0')}`,
    mode: 'blind',
    identity: {
      display_label: genericWineLabel(profile.wine_type),
      wine_type: profile.wine_type,
      practice_mode: 'blind_tasting',
      difficulty_score: profile.difficulty_score,
      difficulty_band: difficultyBand(profile.difficulty_score),
      wset_importance: profile.wset_importance,
      practice_priority: profile.practice_priority,
      confidence_score: profile.confidence_score,
    },
    glass: {
      wine_type: profile.wine_type,
    },
    sat_prompt: {
      workflow: 'sat_blind',
      sections: ['appearance', 'nose', 'palate', 'quality', 'readiness'],
      reveal_policy: 'identity_hidden_until_commitment',
    },
  }));
}

function toDebriefRenderProfiles(profiles, mode) {
  const prefix = mode === 'training' ? 'TRAINING' : 'DEBRIEF';
  return profiles.map((profile, index) => ({
    canonical_id: profile.canonical_id,
    render_id: `${prefix}_${String(index + 1).padStart(3, '0')}`,
    mode,
    identity: {
      display_name: profile.display_name,
      wine_name: profile.wine_name,
      wine_family: profile.wine_family,
      wine_style: profile.wine_style,
      wine_type: profile.wine_type,
      country: profile.country,
      region: profile.region,
      subregion: profile.subregion,
      appellation: profile.appellation,
      grape_varieties: profile.grape_varieties,
      display_label: profile.display_label,
      difficulty_score: profile.difficulty_score,
      difficulty_band: difficultyBand(profile.difficulty_score),
      wset_importance: profile.wset_importance,
      practice_priority: profile.practice_priority,
      confidence_score: profile.confidence_score,
    },
    style_markers: {
      climate: profile.climate,
      altitude: profile.altitude,
      soil: profile.soil,
      viticulture: profile.viticulture,
      winemaking: profile.winemaking,
      oak: profile.oak,
      sweetness: profile.sweetness,
      body: profile.body,
      acidity: profile.acidity,
      alcohol: profile.alcohol,
      tannin: profile.tannin,
      color: profile.color,
      aroma_profile: profile.aroma_profile,
      flavour_profile: profile.flavour_profile,
      finish: profile.finish,
      quality_level: profile.quality_level,
      ageing_potential: profile.ageing_potential,
    },
    pedagogy: {
      core_concepts: profile.pedagogical_dna.core_concepts,
      learning_objectives: profile.pedagogical_dna.learning_objectives,
      typical_misconceptions: profile.pedagogical_dna.typical_misconceptions,
      mentor_focus: profile.pedagogical_dna.mentor_focus,
      exam_traps: profile.pedagogical_dna.exam_traps,
      memory_hooks: profile.pedagogical_dna.memory_hooks,
      comparison_styles: profile.pedagogical_dna.comparison_styles,
    },
    comparison: {
      similar_profiles: profile.comparison_engine.similar_profiles,
      frequently_confused_with: profile.comparison_engine.frequently_confused_with,
      distinguishing_features: profile.comparison_engine.distinguishing_features,
    },
    teaching: {
      common_exam_points: profile.teaching_notes.common_exam_points,
      student_traps: profile.teaching_notes.student_traps,
      revision_priority: profile.teaching_notes.revision_priority,
    },
    reusable_knowledge_refs: profile.reusable_knowledge_refs,
  }));
}

function toRenderProfileMap(profiles) {
  return profiles.reduce((map, profile, index) => {
    const serial = String(index + 1).padStart(3, '0');
    map[profile.canonical_id] = {
      blind: `BLIND_${serial}`,
      debrief: `DEBRIEF_${serial}`,
      training: `TRAINING_${serial}`,
    };
    return map;
  }, {});
}

function genericWineLabel(wineType) {
  const type = String(wineType || '').toUpperCase();
  if (type === 'TINTO') return 'Vino tinto - practica a ciegas';
  if (type === 'ROSADO') return 'Vino rosado - practica a ciegas';
  if (type === 'ESPUMOSO') return 'Vino espumoso - practica a ciegas';
  if (type === 'DULCE') return 'Vino dulce - practica a ciegas';
  if (type === 'FORTIFICADO') return 'Vino fortificado - practica a ciegas';
  return 'Vino blanco - practica a ciegas';
}

function difficultyBand(score) {
  if (score >= 8) return 'advanced';
  if (score >= 5) return 'intermediate';
  return 'foundation';
}

function toMarkdown(profiles) {
  const lines = [
    '# Master Canonical Wine Catalog',
    '',
    `Source: ${SOURCE_FILE}`,
    `Source SHA256: ${SOURCE_HASH}`,
    '',
    `Profiles: ${profiles.length}`,
    '',
  ];

  for (const profile of profiles) {
    lines.push(`## ${profile.canonical_id} - ${profile.display_name}`);
    for (const column of COLUMNS) {
      lines.push(`- **${column}:** ${scalar(profile[column])}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

function toCsv(profiles) {
  const rows = [COLUMNS.join(',')];
  for (const profile of profiles) {
    rows.push(COLUMNS.map((column) => csvEscape(profile[column])).join(','));
  }
  return `${rows.join('\n')}\n`;
}

function toJsonl(profiles) {
  return `${profiles.map((profile) => JSON.stringify(profile)).join('\n')}\n`;
}

function toSql(profiles) {
  const lines = [
    '-- CWP-01 Master Canonical Wine Catalog seed',
    `-- Source: ${SOURCE_FILE}`,
    `-- Source SHA256: ${SOURCE_HASH}`,
    'create table if not exists public.canonical_wines (',
    '  canonical_id text primary key,',
    '  wine_family text not null,',
    '  wine_style text not null,',
    '  display_name text not null,',
    '  wine_name text not null,',
    '  wine_type text not null,',
    '  country text not null,',
    '  region text not null,',
    '  subregion text,',
    '  appellation text,',
    '  priority integer not null,',
    '  wset_importance text not null,',
    '  practice_priority integer not null,',
    '  difficulty_score integer not null,',
    '  confidence_score numeric not null,',
    '  display_label text not null,',
    '  source jsonb not null,',
    '  canonical_source jsonb not null,',
    '  canonical jsonb not null',
    ');',
    '',
    'insert into public.canonical_wines (canonical_id,wine_family,wine_style,display_name,wine_name,wine_type,country,region,subregion,appellation,priority,wset_importance,practice_priority,difficulty_score,confidence_score,display_label,source,canonical_source,canonical) values',
  ];

  const values = profiles.map((profile) => {
    const tuple = [
      sqlString(profile.canonical_id),
      sqlString(profile.wine_family),
      sqlString(profile.wine_style),
      sqlString(profile.display_name),
      sqlString(profile.wine_name),
      sqlString(profile.wine_type),
      sqlString(profile.country),
      sqlString(profile.region),
      sqlString(profile.subregion),
      sqlString(profile.appellation),
      String(profile.priority),
      sqlString(profile.wset_importance),
      String(profile.practice_priority),
      String(profile.difficulty_score),
      String(profile.confidence_score),
      sqlString(profile.display_label),
      `${jsonSql(profile.source)}::jsonb`,
      `${jsonSql(profile.canonical_source)}::jsonb`,
      `${jsonSql(profile)}::jsonb`,
    ];
    return `(${tuple.join(',')})`;
  });

  lines.push(`${values.join(',\n')}\nON CONFLICT (canonical_id) DO UPDATE SET`);
  lines.push('  wine_family = excluded.wine_family,');
  lines.push('  wine_style = excluded.wine_style,');
  lines.push('  display_name = excluded.display_name,');
  lines.push('  wine_name = excluded.wine_name,');
  lines.push('  wine_type = excluded.wine_type,');
  lines.push('  country = excluded.country,');
  lines.push('  region = excluded.region,');
  lines.push('  subregion = excluded.subregion,');
  lines.push('  appellation = excluded.appellation,');
  lines.push('  priority = excluded.priority,');
  lines.push('  wset_importance = excluded.wset_importance,');
  lines.push('  practice_priority = excluded.practice_priority,');
  lines.push('  difficulty_score = excluded.difficulty_score,');
  lines.push('  confidence_score = excluded.confidence_score,');
  lines.push('  display_label = excluded.display_label,');
  lines.push('  source = excluded.source,');
  lines.push('  canonical_source = excluded.canonical_source,');
  lines.push('  canonical = excluded.canonical;');
  return `${lines.join('\n')}\n`;
}

function xmlEscape(value) {
  return scalar(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toXlsx(profiles) {
  const rows = [COLUMNS, ...profiles.map((profile) => COLUMNS.map((column) => scalar(profile[column])))];
  const sheetData = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => {
      const ref = `${columnName(columnIndex + 1)}${rowIndex + 1}`;
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
    }).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');

  const files = {
    '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="canonical_wines" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetData}</sheetData></worksheet>`,
  };

  return zipStore(files);
}

function columnName(index) {
  let name = '';
  while (index > 0) {
    const modulo = (index - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    index = Math.floor((index - modulo) / 26);
  }
  return name;
}

function zipStore(files) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const [name, content] of Object.entries(files)) {
    const nameBuffer = Buffer.from(name, 'utf8');
    const data = Buffer.from(content, 'utf8');
    const crc = crc32(data);
    const local = Buffer.concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBuffer.length), u16(0), nameBuffer, data,
    ]);
    localParts.push(local);

    centralParts.push(Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(nameBuffer.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBuffer,
    ]));
    offset += local.length;
  }

  const central = Buffer.concat(centralParts);
  const end = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(centralParts.length), u16(centralParts.length), u32(central.length), u32(offset), u16(0),
  ]);
  return Buffer.concat([...localParts, central, end]);
}

function u16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

if (require.main === module) {
  const repoRoot = path.resolve(__dirname, '..');
  const profiles = collectProfiles(path.join(repoRoot, 'canonical-wine-catalog', 'profiles'));
  const validation = validateProfiles(profiles);
  if (!validation.ok) {
    console.error(validation.errors.join('\n'));
    process.exit(1);
  }
  exportProfiles(profiles, path.join(repoRoot, 'canonical-wine-catalog', 'exports'));
  console.log(`CWP export complete: ${profiles.length} profiles`);
}

module.exports = {
  COLUMNS,
  collectProfiles,
  validateProfiles,
  exportProfiles,
};
