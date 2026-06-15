# Y.2.1 — Weakness Profiles Audit

**Date**: 2026-06-14  
**Objective**: Understand current state, identify activation blockers, plan safe wiring

---

## CURRENT STATE

### Database Schema (Supabase)

**Table**: `public.weakness_profiles`

```sql
user_id uuid PRIMARY KEY (with topic)
topic text PRIMARY KEY (with user_id)
strength_score numeric(6,3) — [0, 100], default 0
attempts integer — [0, ∞], default 0
last_seen timestamptz
created_at timestamptz (default now())
updated_at timestamptz (default now())
```

**Index**: `weakness_profiles_user_score_idx`  
On: `(user_id, strength_score ASC)`

**Status**: Table EXISTS in production but is READ-ONLY (never written to)

---

## CURRENT USAGE

### Frontend (epistemiclab-dashboard)

**Where weaknesses are analyzed**:
- `adaptive-session/learner_intelligence.js` — All weakness detection logic
- Uses `localStorage` key: `wset_learner_history_v1`
- Analysis is 100% deterministic, in-memory, no external calls

**Weakness types detected** (from learner_intelligence.js):
1. **RA weaknesses**: RAs with ≤60% accuracy, ≥2 attempts
2. **Topic weaknesses**: Topics failed in ≥2 distinct sessions
3. **Verb weaknesses**: Command verbs with ≥50% failure rate across ≥2 attempts
4. **Misconception trends**: Topics failed in ≥2 distinct sessions

**Functions that analyze weaknesses**:
- `weakSet()` — Returns { weakRAs, weakTopics, strongTopics, ... }
- `remediationPlan()` — Returns action recommendations based on weakSet()
- `progressReport()` — Tracks improvement over sessions
- `recordSBASession()` — Records SBA attempt results
- `recordORSession()` — Records Open Response attempt results
- `recordSATSession()` — Records SAT attempt results

**Current output**: 
- Weakness profiles displayed on profile page
- Used for remediation recommendations (Y.1.1)
- Never persisted to Supabase

---

### Backend (WSET-AI-System-push)

**References to weakness_profiles**: NONE found

The backend is completely disconnected from learner weakness tracking.

---

## ARCHITECTURE GAP

### What Exists
✅ Frontend weakness detection (localStorage-based, deterministic)  
✅ Supabase table structure (weakness_profiles)  
✅ RLS policy framework (no custom policies for weakness_profiles yet)

### What's Missing
❌ Frontend → Supabase write path (no sync from learner_intelligence to weakness_profiles)  
❌ Supabase read path (no fetch of persisted weakness profiles to frontend)  
❌ Server-side functions to aggregate/update weakness profiles  
❌ RLS policies on weakness_profiles (currently unrestricted)

---

## Y.2.1 ACTIVATION BLOCKERS & DECISIONS

### Decision 1: Write Frequency

**Question**: How often should weakness_profiles be updated?

**Options**:
A) **Real-time** (after every session)
- Pros: Always up-to-date, no local-cloud sync required
- Cons: N+1 writes for multi-question sessions, higher Supabase cost

B) **End-of-session** (after session completes)
- Pros: Single write per session, batched, cleaner
- Cons: Slight delay between frontend analysis and cloud persistence

C) **Periodic background sync** (every 5-15 minutes)
- Pros: Batch efficiency, reduced writes
- Cons: Additional infrastructure (service worker or API endpoint)

**Recommendation**: **Option B (End-of-session)**
- Aligns with how learning_events are recorded
- Matches Y.1 session completion flow
- Minimal write volume for production cost

---

### Decision 2: Who Writes

**Question**: Should frontend or backend write weakness_profiles?

**Options**:
A) **Frontend writes** (via RLS-protected Supabase client)
- Pros: Simpler, no API endpoint needed
- Cons: Client-side data validation only, harder to audit

B) **Backend via API** (POST to Flask endpoint → Supabase write)
- Pros: Server-side validation, audit trail, controlled
- Cons: Extra network hop, adds latency

C) **Hybrid** (Frontend aggregates, API endpoint upserts with validation)
- Pros: Best of both worlds, validates on server
- Cons: More complex to implement

**Recommendation**: **Option C (Hybrid with validation)**
- Frontend sends weakness summary at session end
- Flask API endpoint (`/api/learner/weakness-sync`) validates + upserts
- Enables server-side rules (e.g., min confidence thresholds)
- Maintains audit trail

---

### Decision 3: Who Reads

**Question**: Should frontend read weakness_profiles from Supabase or use local history?

**Options**:
A) **Local only** (never read from Supabase, always use localStorage)
- Pros: Deterministic, no network dependency, offline-capable
- Cons: Single-device view, no cross-device state

B) **Supabase first** (fetch on profile page load, merge with local)
- Pros: Multi-device consistency, persisted history
- Cons: Network dependency, potential sync conflicts

C) **Hybrid** (cache persisted profile, sync on demand)
- Pros: Offline capable with eventual consistency
- Cons: Complex conflict resolution

**Recommendation**: **Option B (Supabase first with merge)**
- Profile page fetches persisted weakness_profiles from Supabase
- Merges with current session local data (local takes precedence)
- Enables multi-device continuity for future phases
- Non-blocking: if Supabase fetch fails, fall back to local only

---

### Decision 4: Persistence Strategy

**Question**: What data from learner_intelligence gets written to weakness_profiles?

**Current structure** (in localStorage):
```javascript
{
  weakRAs: ['RA1', 'RA4', ...],
  weakTopics: ['sparkling_classification', ...],
  strongTopics: ['sat_appearance', ...],
  weakVerbs: ['justify', ...],
  misconceptionTrends: ['MLF_misconception', ...]
}
```

**Target schema** (Supabase):
```
user_id, topic, strength_score [0-100], attempts, last_seen, updated_at
```

**Mapping challenge**: 
- Input: List of weak RAs, topics, verbs, misconceptions
- Output: Single row per (user_id, topic) with numeric score

**Solution**: 
1. For each weakness detected, compute strength_score as inverse of failure rate
2. Map weakness_type to topic (e.g., "RA1" → "ra1_foundation")
3. Upsert (user_id, topic) row with updated score + timestamp

**Example mapping**:
```javascript
// Input: weakTopics = ['sparkling_classification']
// Processing: Topic failed in 2 attempts out of 5 total → 60% accuracy → strength_score = 60
// Output: INSERT/UPDATE weakness_profiles 
//   SET topic='sparkling_classification', strength_score=60, attempts=5, last_seen=now()
```

---

## SAFE ACTIVATION CHECKLIST

Before wiring, verify:

### ✅ Data Ownership
- [ ] Confirm profiles table is writable (check RLS)
- [ ] Confirm weakness_profiles table is writable (check RLS)
- [ ] Verify no other service writes weakness_profiles (would cause conflicts)

### ✅ Write Safety
- [ ] Implement idempotent upsert (ON CONFLICT DO UPDATE)
- [ ] No REPLACE/DELETE operations (preserve history with updated_at)
- [ ] Validate strength_score is in [0, 100]

### ✅ Read Safety
- [ ] RLS policy: users can only read their own weakness_profiles
- [ ] No exposure of other users' profiles

### ✅ Governance
- [ ] No scoring language (strength_score is learning metric, not grade)
- [ ] Formative-only framing in all UI
- [ ] No pass/fail thresholds
- [ ] safe_for_examiner = False maintained

### ✅ Testing
- [ ] Unit test: strength_score calculation
- [ ] Integration test: upsert at session end
- [ ] Integration test: RLS read access
- [ ] Edge case: multiple rapid sessions (concurrent writes)

---

## PROPOSED Y.2.1 WIRING PLAN

### Phase 1: RLS & API Foundation
1. Add RLS policy to weakness_profiles (users read own only)
2. Create Flask API endpoint `/api/learner/weakness-sync`
3. Endpoint accepts: user_id, session_id, weakness_summary
4. Endpoint validates + upserts to weakness_profiles

### Phase 2: Frontend Sync Trigger
1. Add `syncWeaknessProfile()` call at session completion
2. POST to `/api/learner/weakness-sync` with computed weaknesses
3. Log success/error, don't block UI
4. Retry on transient failures

### Phase 3: Profile Read Integration
1. Add `fetchWeaknessProfile()` on profile page load
2. Merge persisted data with local data (local precedence)
3. Display persisted weakness history (multi-session view)
4. Fall back gracefully if Supabase unavailable

### Phase 4: Validation & Testing
1. Unit tests for strength_score calculation
2. Integration tests for upsert + RLS
3. End-to-end test: complete session → check Supabase row
4. Performance test: concurrent writes don't cause conflicts

---

## STOPPING RULE CHECK

**Prerequisite**: Can weakness_profiles be safely activated?

**Current assessment**:
- ✅ Schema exists and is well-designed
- ✅ RLS framework is in place (no custom policies needed yet)
- ✅ No competing writes (table is currently untouched)
- ✅ Read access straightforward (user_id-based filtering)
- ✅ No governance conflicts (learning metric, not scoring)

**Recommendation**: PROCEED to implementation

---

## FILES TO MODIFY

### Frontend
- `adaptive-session/learner_intelligence.js` — Export weakness summary for sync
- `adaptive-session/index.html` — Call syncWeaknessProfile() at session end
- `profile/profile.js` — Add fetchWeaknessProfile() + display
- `shared/supabase-public-config.js` or new `shared/weakness-sync.js` — API client

### Backend
- `tools/orchestrator/orchestrator.py` or new `tools/api/weakness_sync_handler.py` — Endpoint
- `tools/constants.py` — Add governance constant (if needed)
- Supabase migrations (if needed) — RLS policies

### Tests
- `tests/test_weakness_profile_sync.py` — API validation + RLS
- `adaptive-session/test_learner_intelligence_weakness.js` — Strength score calculation

---

## NEXT STEPS

1. ✅ Audit complete (this document)
2. ⏳ Design weakness-sync API contract
3. ⏳ Implement RLS + API endpoint
4. ⏳ Implement frontend sync trigger
5. ⏳ Implement profile read integration
6. ⏳ Test end-to-end
7. ⏳ Validate governance compliance
8. ⏳ Create Y2_EXECUTION_REPORT.md

---

**Y.2.1 Audit Complete — Safe to proceed with implementation**

**Blockers Found**: None  
**Governance Risk**: Low (metric only, not scoring)  
**Complexity**: Medium (requires API endpoint, RLS, bi-directional sync)

