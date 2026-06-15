# S5 — Post-Migration Verification Checklist

**Status:** Ready for S5.3 Deployment (Single Source of Truth Validated)

---

## Pre-Deployment Verification (Before supabase db push)

- [ ] Read and understood `S5A_SINGLE_SOURCE_OF_TRUTH_VALIDATION.md`
- [ ] Confirm schema change: **adaptive_bank table REMOVED**
- [ ] Confirm schema change: **sba_bank now contains pedagogical metadata fields**
  - causal_chain
  - feedback_by_mode
  - micro_drill
  - gold
- [ ] Migration file: `migrations/0001_pedagogical_knowledge.sql` updated
- [ ] Migration tools: `tools/migrate-sba-bank.js` and `tools/migrate-or-bank.js` updated
- [ ] .gitignore: All knowledge source files excluded

---

## Step 1: Database Schema Deployment

```bash
# COMMAND
supabase db push migrations/0001_pedagogical_knowledge.sql

# VERIFICATION
psql -h api.supabase.co -U postgres -d postgres -c \
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"

# EXPECTED OUTPUT
# Table "public.sba_bank"
# Table "public.or_bank"
# Table "public.sat_wines"
# Table "public.mentor_config"
# Table "public.misconceptions"
# Table "public.distinction_patterns"
# Table "public.sat_observation_aliases"

# NOT EXPECTED (sign of failure)
# Table "public.adaptive_bank"  ← If this exists, migration failed
```

**Checkpoint:** ✅ 7 tables exist, 0 adaptive_bank

---

## Step 2: Import SBA Corpus (670 items)

```bash
# COMMAND
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ0eXA..."

node tools/migrate-sba-bank.js

# EXPECTED OUTPUT
# Starting SBA bank migration...
# Found 670 SBA items to migrate
# Imported 670/670 items...
# Migration complete: 670 imported, 0 errors
# Final count in database: 670 items
```

**Checkpoint:** ✅ sba_bank = 670, no errors

---

## Step 3: Verify SBA Metadata Completeness

```bash
# COMMAND
psql -h api.supabase.co -U postgres -d postgres -c \
  "SELECT
     COUNT(*) as total_items,
     COUNT(CASE WHEN causal_chain IS NOT NULL THEN 1 END) as with_causal_chain,
     COUNT(CASE WHEN feedback_by_mode IS NOT NULL THEN 1 END) as with_feedback,
     COUNT(CASE WHEN micro_drill IS NOT NULL THEN 1 END) as with_micro_drill
   FROM sba_bank"

# EXPECTED OUTPUT (should be close to 100%)
# total_items | with_causal_chain | with_feedback | with_micro_drill
# 670         | 670               | 670           | 670
```

**Checkpoint:** ✅ All pedagogical fields populated

---

## Step 4: Import Open Response Corpus (106 items)

```bash
# COMMAND
export SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ0eXA..."

node tools/migrate-or-bank.js

# EXPECTED OUTPUT
# Starting Open Response bank migration...
# Found 106 Open Response items to migrate
# Imported 106/106 items...
# Migration complete: 106 imported, 0 errors
# Final count in database: 106 items
```

**Checkpoint:** ✅ or_bank = 106, no errors

---

## Step 5: Validate Single Source of Truth

```bash
# COMMAND
node tools/validate-single-source-of-truth.js

# EXPECTED OUTPUT
# ✅ PASS: Single Source of Truth validation successful
# 
# Architecture confirmed:
#   • sba_bank: 670 items (single source)
#   • or_bank: 106 items (separate, no duplication)
#   • No adaptive_bank table
#   • All pedagogical metadata present
#   • Source files gitignored
```

**Checkpoint:** ✅ No duplications, all validations pass

---

## Step 6: Deploy Edge Functions

```bash
# COMMAND 1: Deploy get-sba-bank
supabase functions deploy get-sba-bank

# COMMAND 2: Deploy get-or-bank
supabase functions deploy get-or-bank

# VERIFICATION
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "https://xxxx.supabase.co/functions/v1/get-sba-bank?limit=1"

# EXPECTED OUTPUT
{
  "items": [
    {
      "id": "wset3_230",
      "stem": "¿Qué estilo define...",
      "options": [...],
      "topic": "quality_factors",
      "causal_chain": {...},
      "feedback_by_mode": {...}
      // NOTE: correct_index NOT present (removed by Edge Function)
    }
  ],
  "watermark": {
    "user_id": "abc123",
    "issued_at": "2026-06-15T13:00:00Z",
    "expires_at": "2026-06-16T13:00:00Z"
  }
}
```

**Checkpoint:** ✅ Edge Functions deployed and returning data correctly

---

## Step 7: Frontend Source File Removal

```bash
# These files should still exist locally (for reverting if needed)
# but are GITIGNORED and NOT committed

ls -la diagnostic-sba/preguntas_data.js          # Should exist locally
ls -la open-response-lab/lab_payload.js          # Should exist locally
ls -la adaptive-session/session_bank.js          # Should exist locally

# Verify they're in .gitignore
grep "preguntas_data.js" .gitignore    # Should match
grep "session_bank.js" .gitignore      # Should match
grep "lab_payload.js" .gitignore       # Should match

# Verify they're NOT in git
git status diagnostic-sba/preguntas_data.js
# Expected: Not tracked (or will show 'ignored by .gitignore')
```

**Checkpoint:** ✅ Files exist locally but are gitignored

---

## Step 8: Frontend Refactor Readiness

Before refactoring frontends to use APIs:

- [ ] Review `S5A_SINGLE_SOURCE_OF_TRUTH_VALIDATION.md` section "FLUJO DE DATOS POR FRONTEND"
- [ ] Understand new architecture:
  - diagnostic-sba: `fetch GET /get-sba-bank`
  - adaptive-session: `fetch GET /get-sba-bank` (with session filters)
  - open-response-lab: `fetch GET /get-or-bank`
- [ ] Plan frontend refactoring (S5.4-S5.6) — NEXT PHASE

---

## Step 9: Validation Suite

```bash
# Run all validation tools
node tools/validate-no-exposure.js
node tools/validate-single-source-of-truth.js
npm test -- tests/s5-knowledge-protection.test.js

# EXPECTED: All tests pass, no exposures detected
```

**Checkpoint:** ✅ All validation passes

---

## Step 10: Rollback Plan (If Needed)

If deployment fails at any step:

1. **Before Schema Push:**
   - No database changes made
   - Safe to retry with corrected schema

2. **After Schema Push (Before Import):**
   ```bash
   supabase db reset
   # (re-applies latest migration)
   ```

3. **After Import (Failed Integrity):**
   ```bash
   DELETE FROM sba_bank WHERE id LIKE 'wset3_%';
   DELETE FROM or_bank;
   # Re-run import tools
   ```

4. **Complete Rollback:**
   ```bash
   # Drop all S5 tables
   DROP TABLE sba_bank CASCADE;
   DROP TABLE or_bank CASCADE;
   DROP TABLE sat_wines CASCADE;
   # ... etc for all 7 tables
   
   # Frontend reverts to using local JS files
   # (already have git history, no re-import needed)
   ```

---

## Success Criteria

- [x] Schema deployed: 7 tables created, 0 adaptive_bank
- [ ] SBA corpus imported: 670 items with metadata
- [ ] OR corpus imported: 106 items
- [ ] Edge Functions deployed: /get-sba-bank, /get-or-bank
- [ ] Validations pass: no-exposure, single-source-of-truth
- [ ] No divergence: only 1 SBA source, no duplication
- [ ] Frontend ready: refactoring plan in place (S5.4-S5.6)

---

## Next Steps (Phase S5.4-S5.6)

Once deployment checklist passes:

1. **S5.4: Refactor Diagnostic SBA**
   - Replace `window.PREGUNTAS_BANK` → `fetch GET /get-sba-bank`
   - Test all 4 modes: quick_drill, express, standard, mock_theory_1

2. **S5.5: Refactor Adaptive Session**
   - Replace `window.SESSION_BANK` → `fetch GET /get-sba-bank`
   - Test all 6 modes: express_10, standard_25, mock_theory_50, sat_sprint, sat_practice, sat_mock

3. **S5.6: Refactor Open Response Lab**
   - Replace `window.OPEN_RESPONSE_LAB_PAYLOAD` → `fetch GET /get-or-bank`
   - Test all 4 modes: short_practice, standard_practice, extended_practice, mock_theory_2

4. **S5.7: Final Validation**
   - DevTools check: no `window.*` banks
   - Network check: only API calls to /get-sba-bank, /get-or-bank
   - File check: preguntas_data.js, session_bank.js, lab_payload.js not in deployed bundles

---

**Document Version:** S5 Phase 3 (Single Source of Truth)  
**Created:** 2026-06-15  
**Status:** Ready for production deployment
