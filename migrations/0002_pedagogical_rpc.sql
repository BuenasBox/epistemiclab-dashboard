CREATE OR REPLACE FUNCTION get_sba_bank(p_limit INT DEFAULT 670, p_topic TEXT DEFAULT NULL)
RETURNS TABLE (
  id TEXT, stem TEXT, text TEXT, options JSONB,
  topic TEXT, ra TEXT, difficulty TEXT,
  keywords JSONB, gold BOOLEAN,
  causal_chain JSONB, feedback_by_mode JSONB, micro_drill JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sba_bank.id, sba_bank.stem, sba_bank.text, sba_bank.options,
    sba_bank.topic, sba_bank.ra, sba_bank.difficulty,
    sba_bank.keywords, sba_bank.gold,
    sba_bank.causal_chain, sba_bank.feedback_by_mode, sba_bank.micro_drill
  FROM sba_bank
  WHERE (p_topic IS NULL OR sba_bank.topic = p_topic)
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_or_bank(p_limit INT DEFAULT 106, p_topic TEXT DEFAULT NULL)
RETURNS TABLE (
  id TEXT, item_id TEXT, question_text TEXT, command_verb TEXT,
  ra_id TEXT, topic TEXT,
  expected_concepts JSONB, expected_structure JSONB,
  response_depth_target TEXT, causal_chain_target JSONB,
  feedback_profile JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    or_bank.id, or_bank.item_id, or_bank.question_text, or_bank.command_verb,
    or_bank.ra_id, or_bank.topic,
    or_bank.expected_concepts, or_bank.expected_structure,
    or_bank.response_depth_target, or_bank.causal_chain_target,
    or_bank.feedback_profile
  FROM or_bank
  WHERE (p_topic IS NULL OR or_bank.topic = p_topic)
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
