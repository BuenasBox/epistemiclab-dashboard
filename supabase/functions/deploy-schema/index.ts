import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sba_bank (
  id TEXT PRIMARY KEY, source_id TEXT, stem TEXT NOT NULL, text TEXT NOT NULL,
  options JSONB NOT NULL, topic TEXT, ra TEXT, difficulty TEXT,
  correct_index INT, correct_letter TEXT, keywords JSONB, gold BOOLEAN DEFAULT false,
  causal_chain JSONB, feedback_by_mode JSONB, micro_drill JSONB,
  governance JSONB, created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_options CHECK (jsonb_array_length(options) = 4)
);
CREATE INDEX IF NOT EXISTS idx_sba_topic ON sba_bank(topic);
CREATE INDEX IF NOT EXISTS idx_sba_ra ON sba_bank(ra);
CREATE INDEX IF NOT EXISTS idx_sba_difficulty ON sba_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_sba_gold ON sba_bank(gold);

CREATE TABLE IF NOT EXISTS or_bank (
  id TEXT PRIMARY KEY, item_id TEXT NOT NULL UNIQUE, question_text TEXT NOT NULL,
  command_verb TEXT, ra_id TEXT, topic TEXT, expected_concepts JSONB,
  expected_structure JSONB, response_depth_target TEXT, causal_chain_target JSONB,
  feedback_profile JSONB, governance JSONB, created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_or_topic ON or_bank(topic);
CREATE INDEX IF NOT EXISTS idx_or_ra ON or_bank(ra_id);

CREATE TABLE IF NOT EXISTS sat_wines (
  id TEXT PRIMARY KEY, wine_name TEXT NOT NULL, country TEXT, region TEXT,
  grape_variety JSONB, description TEXT, quality_markers JSONB,
  readiness_profile JSONB, governance JSONB, created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wines_country ON sat_wines(country);
CREATE INDEX IF NOT EXISTS idx_wines_region ON sat_wines(region);

CREATE TABLE IF NOT EXISTS mentor_config (
  id TEXT PRIMARY KEY, verb TEXT NOT NULL UNIQUE, verb_category TEXT,
  coaching_prompt TEXT, depth_levels JSONB, misconception_triggers JSONB,
  governance JSONB, created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS misconceptions (
  id TEXT PRIMARY KEY, topic TEXT NOT NULL, detection_keywords JSONB,
  intervention_text TEXT, severity_weight REAL, governance JSONB,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_misconceptions_topic ON misconceptions(topic);

CREATE TABLE IF NOT EXISTS distinction_patterns (
  id TEXT PRIMARY KEY, pattern_type TEXT, descriptor_pattern TEXT NOT NULL,
  quality_reasoning JSONB, response_structure JSONB, governance JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sat_observation_aliases (
  id TEXT PRIMARY KEY, term TEXT NOT NULL UNIQUE, category TEXT, aliases JSONB,
  governance JSONB, created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE sba_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE or_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE sat_wines ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "auth_read_sba" ON sba_bank FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "auth_read_or" ON or_bank FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "admin_write_sba" ON sba_bank FOR INSERT, UPDATE, DELETE USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY IF NOT EXISTS "admin_write_or" ON or_bank FOR INSERT, UPDATE, DELETE USING (auth.jwt() ->> 'role' = 'admin');
`;

Deno.serve(async (req) => {
  return new Response(JSON.stringify({ status: "ready", message: "Schema ready for deployment" }), { status: 200 });
});
