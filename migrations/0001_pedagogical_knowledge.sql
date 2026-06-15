-- Phase S5: Pedagogical Knowledge Migration
-- Migrate frontend knowledge assets to Supabase

-- SBA Items (from preguntas_data.js + session_bank.js pedagogical metadata)
-- SINGLE SOURCE OF TRUTH: 670 SBA items with all metadata in one table
CREATE TABLE IF NOT EXISTS sba_bank (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  stem TEXT NOT NULL,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  topic TEXT,
  ra TEXT,
  difficulty TEXT,
  correct_index INT,          -- Removed on export by Edge Function
  correct_letter TEXT,        -- Removed on export by Edge Function
  keywords JSONB,
  gold BOOLEAN DEFAULT false,

  -- Pedagogical metadata (from session_bank.js)
  causal_chain JSONB,         -- Contains {causa, efecto, mecanismo}
  feedback_by_mode JSONB,     -- Contains {mentor, reviewer, trainer} coaching
  micro_drill JSONB,          -- Contains drill mode and remediation

  governance JSONB,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_options CHECK ((options IS NOT NULL AND jsonb_array_length(options) = 4))
);

CREATE INDEX idx_sba_topic ON sba_bank(topic);
CREATE INDEX idx_sba_ra ON sba_bank(ra);
CREATE INDEX idx_sba_difficulty ON sba_bank(difficulty);
CREATE INDEX idx_sba_gold ON sba_bank(gold);

-- Open Response Items (from lab_payload.js)
CREATE TABLE IF NOT EXISTS or_bank (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL UNIQUE,
  question_text TEXT NOT NULL,
  command_verb TEXT,
  ra_id TEXT,
  topic TEXT,
  expected_concepts JSONB,
  expected_structure JSONB,
  response_depth_target TEXT,
  causal_chain_target JSONB,
  feedback_profile JSONB,
  governance JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_or_topic ON or_bank(topic);
CREATE INDEX idx_or_ra ON or_bank(ra_id);

-- REMOVED: adaptive_bank table
-- RATIONALE: 670 SBA items are stored in sba_bank (single source of truth)
-- Adaptive session queries sba_bank with session filters (express_10, standard_25, mock_theory_50)
-- Session-level filtering is frontend responsibility, not database duplication

-- SAT Wine Knowledge (from sat-wine-data.js)
CREATE TABLE IF NOT EXISTS sat_wines (
  id TEXT PRIMARY KEY,
  wine_name TEXT NOT NULL,
  country TEXT,
  region TEXT,
  grape_variety JSONB,
  description TEXT,
  quality_markers JSONB,
  readiness_profile JSONB,
  governance JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_wines_country ON sat_wines(country);
CREATE INDEX idx_wines_region ON sat_wines(region);

-- Mentor Configuration (from mentor-config.js)
CREATE TABLE IF NOT EXISTS mentor_config (
  id TEXT PRIMARY KEY,
  verb TEXT NOT NULL UNIQUE,
  verb_category TEXT,
  coaching_prompt TEXT,
  depth_levels JSONB,
  misconception_triggers JSONB,
  governance JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Misconception Nodes (pedagogical logic)
CREATE TABLE IF NOT EXISTS misconceptions (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  detection_keywords JSONB,
  intervention_text TEXT,
  causal_explanation TEXT,
  correction_direction TEXT,
  governance JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_misconception_topic ON misconceptions(topic);

-- Distinction Patterns (quality/structure knowledge)
CREATE TABLE IF NOT EXISTS distinction_patterns (
  id TEXT PRIMARY KEY,
  pattern_type TEXT, -- 'descriptor' | 'quality' | 'readiness' | 'response_structure'
  category TEXT,
  content JSONB NOT NULL,
  governance JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_pattern_type ON distinction_patterns(pattern_type);

-- Enable RLS
ALTER TABLE sba_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE or_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE sat_wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE misconceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distinction_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Authenticated users can read all knowledge
CREATE POLICY "Authenticated users can read pedagogical knowledge"
  ON sba_bank FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read OR knowledge"
  ON or_bank FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read adaptive knowledge"
  ON adaptive_bank FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read SAT wines"
  ON sat_wines FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read mentor config"
  ON mentor_config FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read misconceptions"
  ON misconceptions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read distinction patterns"
  ON distinction_patterns FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin can write
CREATE POLICY "Admin can write to sba_bank"
  ON sba_bank FOR INSERT
  WITH CHECK (
    (SELECT (raw_user_meta_data->>'role') = 'admin'
     FROM auth.users WHERE auth.uid() = id)
  );

CREATE POLICY "Admin can update sba_bank"
  ON sba_bank FOR UPDATE
  USING (
    (SELECT (raw_user_meta_data->>'role') = 'admin'
     FROM auth.users WHERE auth.uid() = id)
  );

-- Similar for other tables
CREATE POLICY "Admin can write to or_bank"
  ON or_bank FOR INSERT
  WITH CHECK (
    (SELECT (raw_user_meta_data->>'role') = 'admin'
     FROM auth.users WHERE auth.uid() = id)
  );

CREATE POLICY "Admin can write to adaptive_bank"
  ON adaptive_bank FOR INSERT
  WITH CHECK (
    (SELECT (raw_user_meta_data->>'role') = 'admin'
     FROM auth.users WHERE auth.uid() = id)
  );

CREATE POLICY "Admin can write to sat_wines"
  ON sat_wines FOR INSERT
  WITH CHECK (
    (SELECT (raw_user_meta_data->>'role') = 'admin'
     FROM auth.users WHERE auth.uid() = id)
  );

CREATE POLICY "Admin can write to mentor_config"
  ON mentor_config FOR INSERT
  WITH CHECK (
    (SELECT (raw_user_meta_data->>'role') = 'admin'
     FROM auth.users WHERE auth.uid() = id)
  );

CREATE POLICY "Admin can write to misconceptions"
  ON misconceptions FOR INSERT
  WITH CHECK (
    (SELECT (raw_user_meta_data->>'role') = 'admin'
     FROM auth.users WHERE auth.uid() = id)
  );

CREATE POLICY "Admin can write to distinction_patterns"
  ON distinction_patterns FOR INSERT
  WITH CHECK (
    (SELECT (raw_user_meta_data->>'role') = 'admin'
     FROM auth.users WHERE auth.uid() = id)
  );
