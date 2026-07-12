begin;

-- 31 legacy Spanish-language or_bank items (OR_001..OR_031) were seeded before
-- command_verb existed as a required field. They already have full pedagogical
-- content (expected_concepts, response_depth_target, feedback_profile,
-- governance) — only command_verb was missing. Backfilled by reading the
-- literal command verb already present in each question_text, using the same
-- taxonomy (explain/describe/justify/compare/discuss/identify_and_explain/
-- list/state) already used by the other 75 items in the bank. No new
-- pedagogical content invented — pure classification of existing text.

update public.or_bank as ob
set command_verb = v.command_verb
from (values
  ('OR_001','explain'),
  ('OR_002','justify'),
  ('OR_003','explain'),
  ('OR_004','explain'),
  ('OR_005','describe'),
  ('OR_006','explain'),
  ('OR_007','explain'),
  ('OR_008','compare'),
  ('OR_009','describe'),
  ('OR_010','explain'),
  ('OR_011','explain'),
  ('OR_012','compare'),
  ('OR_013','discuss'),
  ('OR_014','describe'),
  ('OR_015','explain'),
  ('OR_016','state'),
  ('OR_017','justify'),
  ('OR_018','describe'),
  ('OR_019','discuss'),
  ('OR_020','compare'),
  ('OR_021','identify_and_explain'),
  ('OR_022','describe'),
  ('OR_023','explain'),
  ('OR_024','identify_and_explain'),
  ('OR_025','identify_and_explain'),
  ('OR_026','list'),
  ('OR_027','identify_and_explain'),
  ('OR_028','explain'),
  ('OR_029','identify_and_explain'),
  ('OR_030','identify_and_explain'),
  ('OR_031','identify_and_explain')
) as v(item_id, command_verb)
where ob.item_id = v.item_id;

commit;
