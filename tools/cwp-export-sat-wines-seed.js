const fs = require('fs');
const path = require('path');
const { collectProfiles, validateProfiles } = require('./cwp-export');

const MIGRATION_NAME = '20260618_cwp_sat_db_01_seed_sat_wines_from_canonical.sql';

const WINE_TYPE_LABELS = {
  BLANCO: 'blanco',
  ROSADO: 'rosado',
  TINTO: 'tinto',
  ESPUMOSO: 'espumoso',
  FORTIFICADO: 'fortificado',
};

function blindDisplayLabel(profile, index) {
  const label = WINE_TYPE_LABELS[profile.wine_type];
  if (!label) {
    throw new Error(`Unsupported wine_type for sat_wines seed: ${profile.canonical_id} ${profile.wine_type}`);
  }
  return `Vino ${label} — práctica ${index + 1}`;
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function satPriority(profile, index) {
  const priority = Number(profile.priority);
  if (Number.isFinite(priority)) return priority;

  const practicePriority = Number(profile.practice_priority);
  if (Number.isFinite(practicePriority)) return practicePriority;

  return index + 1;
}

function toSatWinesSeedSql(profiles) {
  const validation = validateProfiles(profiles);
  if (!validation.ok) {
    throw new Error(validation.errors.join('\n'));
  }
  if (profiles.length !== 107) {
    throw new Error(`Expected 107 canonical profiles for sat_wines seed, found ${profiles.length}`);
  }

  const rows = profiles.map((profile, index) => {
    const canonical = JSON.stringify(profile);
    const values = [
      sqlString(profile.canonical_id),
      sqlString(profile.wine_type),
      satPriority(profile, index),
      sqlString(blindDisplayLabel(profile, index)),
      sqlString('canonical_wine'),
      `${sqlString(canonical)}::jsonb`,
    ];
    return `    (${values.join(', ')})`;
  });

  const ids = profiles.map((profile) => sqlString(profile.canonical_id)).join(', ');

  return [
    '-- ============================================================================',
    '-- CWP/SAT-DB-01 — Seed sat_wines desde Canonical Wine Catalog',
    '-- ----------------------------------------------------------------------------',
    '-- Fuente unica de verdad: canonical-wine-catalog/profiles/*.json',
    '-- `canonical` conserva el perfil completo server-only.',
    '-- `display_label` es blind-safe: tipo de vino + numero de practica, sin identidad.',
    '-- RLS no se modifica: sat_wines sigue sin policies para anon/authenticated.',
    '-- ============================================================================',
    '',
    'begin;',
    '',
    'with canonical_seed (id, wine_type, priority, display_label, source, canonical) as (',
    '  values',
    `${rows.join(',\n')}`,
    ')',
    'insert into public.sat_wines (id, wine_type, priority, display_label, source, canonical)',
    'select id, wine_type, priority, display_label, source, canonical',
    'from canonical_seed',
    'on conflict (id) do update set',
    '  wine_type = excluded.wine_type,',
    '  priority = excluded.priority,',
    '  display_label = excluded.display_label,',
    '  source = excluded.source,',
    '  canonical = excluded.canonical;',
    '',
    'delete from public.sat_wines',
    'where source = \'canonical_wine\'',
    `  and id not in (${ids});`,
    '',
    'do $$',
    'declare',
    '  actual_count int;',
    'begin',
    '  select count(*) into actual_count',
    '  from public.sat_wines',
    '  where source = \'canonical_wine\';',
    '',
    '  if actual_count <> 107 then',
    '    raise exception \'sat_wines canonical seed expected 107 rows, found %\', actual_count;',
    '  end if;',
    '',
    '  if exists (',
    '    select 1',
    '    from public.sat_wines',
    '    where id in (\'SAT_WINE_005\', \'SAT_WINE_006\', \'SAT_WINE_007\', \'SAT_WINE_008\', \'SAT_WINE_009\', \'SAT_WINE_010\', \'SAT_WINE_011\', \'SAT_WINE_012\')',
    '      and wine_type <> \'BLANCO\'',
    '  ) then',
    '    raise exception \'SAT_WINE_005..012 must be BLANCO according to canonical catalog\';',
    '  end if;',
    '',
    '  if exists (',
    '    select 1',
    '    from public.sat_wines',
    '    where source = \'canonical_wine\'',
    '      and display_label !~ \'^Vino (blanco|tinto|rosado|espumoso|fortificado) — práctica [0-9]+$\'',
    '  ) then',
    '    raise exception \'sat_wines display_label must remain blind-safe\';',
    '  end if;',
    'end $$;',
    '',
    'commit;',
    '',
  ].join('\n');
}

function writeMigration(repoRoot) {
  const profiles = collectProfiles(path.join(repoRoot, 'canonical-wine-catalog', 'profiles'));
  const sql = toSatWinesSeedSql(profiles);
  const migrationPath = path.join(repoRoot, 'supabase', 'migrations', MIGRATION_NAME);
  fs.writeFileSync(migrationPath, sql, 'utf8');
  return migrationPath;
}

if (require.main === module) {
  const repoRoot = path.resolve(__dirname, '..');
  const migrationPath = writeMigration(repoRoot);
  console.log(`sat_wines seed migration written: ${migrationPath}`);
}

module.exports = {
  MIGRATION_NAME,
  blindDisplayLabel,
  toSatWinesSeedSql,
  writeMigration,
};
