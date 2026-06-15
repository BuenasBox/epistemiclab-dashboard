# Y.2.1 — Weakness Profiles Activation Architecture

**Status**: Implementation Plan  
**Date**: 2026-06-14  
**Phase**: Y.2.1 (Activate Weakness Profiles)  

---

## OBJECTIVE

Transform weakness detection from **local-only** to **persistent + multi-device aware**, enabling adaptive recommendation engine (Y.2.3+) to reason about learner weakness trajectories.

**Current State** (Pre-Y.2.1):
- Weakness detection: 100% client-side, localStorage only
- Persistence: None (data lost on logout)
- Multi-device: Not supported

**Target State** (Post-Y.2.1):
- Weakness detection: Same (learner_intelligence.js)
- Persistence: Supabase weakness_profiles table
- Sync: End-of-session from frontend to Supabase
- Multi-device: Profile page shows persisted history
- Fallback: Local-only if Supabase unavailable

---

## ARCHITECTURE COMPONENTS

### 1. Database Layer (Supabase PostgreSQL)

**Table**: `public.weakness_profiles`
```sql
user_id uuid (PK with topic)
topic text (PK with user_id)
strength_score numeric[0-100] (learning metric, not score)
attempts integer [0, ∞]
last_seen timestamptz
created_at timestamptz
updated_at timestamptz
```

**New Components**:

#### A. RLS Policies
```sql
-- Read: Users can read only their own profiles
-- Write: Users can insert/update only their own profiles
-- Admin: Can read all (for future analytics)
```

#### B. PostgreSQL Function: upsert_user_weakness_profiles()
```
Input: p_user_id uuid, p_weakness_summary jsonb
Process:
  1. Validate authentication (auth.uid() must match p_user_id)
  2. Validate profile exists
  3. Iterate over topics in weakness_summary
  4. For each topic: INSERT or UPDATE weakness_profiles
     - strength_score [0-100]
     - attempts integer
     - last_seen = now()
     - updated_at = now()
Output: Count of upserted rows
```

#### C. PostgreSQL Function: get_user_weakness_profiles()
```
Input: p_user_id uuid
Process:
  1. Validate authentication
  2. SELECT all weakness_profiles for user
  3. ORDER BY updated_at DESC
Output: Array of { topic, strength_score, attempts, last_seen, updated_at }
```

**Migration File**: `supabase/migrations/20260614_y2_weakness_profiles_sync.sql`

---

### 2. Frontend Module: weakness-sync.js

**File**: `shared/weakness-sync.js` (195 lines)

**Exports**:

#### buildWeaknessSummary(weakSet, sessionHistory)
Converts learner_intelligence output → Supabase JSONB format

**Input** (from learner_intelligence.weakSet()):
```javascript
{
  weakRAs: ['RA1', 'RA4'],
  weakTopics: ['sparkling_classification'],
  strongTopics: ['sat_appearance'],
  weakVerbs: ['justify'],
  misconceptionTrends: ['MLF_misconception']
}
```

**Process**:
1. For each weak/strong topic, count successes in sessionHistory
2. Compute strength_score = (successes / total) * 100
3. Add prefixes: `verb:X`, `misconception:Y` to avoid collisions
4. Return JSONB with topics array + governance metadata

**Output** (for RPC call):
```javascript
{
  topics: [
    { name: 'RA1', strength_score: 45.0, attempts: 3 },
    { name: 'verb:justify', strength_score: 50, attempts: 1 },
    ...
  ],
  computed_at: '2026-06-14T12:34:56Z',
  governance: {
    safe_for_examiner: false,
    formative_only: true,
    no_official_scoring: true
  }
}
```

#### syncWeaknessProfiles(userId, weaknessSummary, supabaseClient)
Calls RPC to persist weakness_profiles

**Logic**:
```javascript
const { data, error } = await supabaseClient.rpc(
  'upsert_user_weakness_profiles',
  { p_user_id: userId, p_weakness_summary: weaknessSummary }
);
```

**Returns**: `{ success: bool, count: int, error: string }`

**Error Handling**:
- If Supabase unavailable: Log warning, return error, don't break UI
- If auth fails: Return error, don't block learner experience
- If summary invalid: Log error, suggest local-only fallback

#### fetchWeaknessProfiles(userId, supabaseClient)
Reads persisted profiles from Supabase

**Logic**:
```javascript
const { data, error } = await supabaseClient.rpc(
  'get_user_weakness_profiles',
  { p_user_id: userId }
);
```

**Returns**: `{ success: bool, profiles: array, error: string }`

**Profiles Format**: Array of `{ topic, strength_score, attempts, last_seen, updated_at }`

#### renderWeaknessProfileCard(persistedProfiles)
Renders HTML card for profile page

**Output**: HTML card showing top 5 weakest topics with strength bars

#### triggerWeaknessSyncAtSessionEnd(userId, supabaseClient)
Integration helper: Calls LI.weakSet() → buildWeaknessSummary() → syncWeaknessProfiles()

---

### 3. Frontend Integration Points

#### A. Session Completion (adaptive-session, open-response-lab, sat)

**Call Point**: After session ends, before showing results

```javascript
// When finishing a session
window.WeaknessSync.triggerWeaknessSyncAtSessionEnd(
  userId,              // from auth.uid()
  supabaseClient       // from shared client
);
// Continue showing results; don't wait for sync result
```

**Behavior**:
- Non-blocking (fire-and-forget)
- Logs success/error to console
- Doesn't affect learner UX
- Local recommendations still work if sync fails

#### B. Profile Page (profile/profile.js)

**On Load**:
```javascript
// Fetch persisted weakness profiles
const { success, profiles } = await window.WeaknessSync.fetchWeaknessProfiles(
  userId,
  supabaseClient
);

// Render persisted profile card (if available)
var profileCard = window.WeaknessSync.renderWeaknessProfileCard(profiles);
// Insert into profile page DOM
```

**Behavior**:
- Non-blocking fetch (timeout 5s)
- Falls back to local-only if unavailable
- Shows merge of persisted + local data (local takes precedence)

---

## DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ Student Activity (SBA, OR, SAT)                             │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ learner_intelligence.js                                      │
│ - recordSBASession/recordORSession/recordSATSession         │
│ - localStorage: wset_learner_history_v1                     │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Session End                                                  │
│ (adaptive-session, or-lab, sat)                             │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ weakness-sync.js: triggerWeaknessSyncAtSessionEnd()         │
│ 1. Calls LI.weakSet() → extract weaknesses from history    │
│ 2. buildWeaknessSummary() → compute strength scores         │
│ 3. syncWeaknessProfiles() → RPC to Supabase                │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Supabase RPC: upsert_user_weakness_profiles()              │
│ - Validate auth, user_id, weakness_summary                 │
│ - INSERT/UPDATE weakness_profiles rows                     │
│ - Update strength_score, attempts, last_seen               │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Profile Page Load                                           │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ weakness-sync.js: fetchWeaknessProfiles()                  │
│ 1. RPC: get_user_weakness_profiles() from Supabase          │
│ 2. Returns array of persisted profiles                      │
│ 3. renderWeaknessProfileCard() → HTML for profile page      │
└─────────────────────────────────────────────────────────────┘
```

---

## GOVERNANCE COMPLIANCE CHECKLIST

### Formative-Only Framing
- ✅ All strength_score values labeled as "learning metrics" not "scores"
- ✅ All UI copy uses "Perfil de Aprendizaje" (Learning Profile), never "grade" or "assessment"
- ✅ All metadata includes `formative_only: true`

### No Official Scoring
- ✅ strength_score is numeric [0-100] representing accuracy, not a grade
- ✅ No "pass/fail" thresholds
- ✅ No "predicted WSET score"
- ✅ No distinction classification
- ✅ No examiner authority claimed

### No Unauthorized Data Access
- ✅ RLS policies enforce user_id ownership
- ✅ Users cannot read other users' profiles
- ✅ Admin read access only (for future Y.3+ analytics)

### No Hidden External Services
- ✅ All Supabase calls are transparent
- ✅ No embedding, vector DB, or external ML
- ✅ Deterministic only (no generative models)

---

## ERROR HANDLING & RESILIENCE

### Sync Fails (Network Error)
```
Session end → Try sync → Supabase unreachable
  → Log error to console
  → Continue showing results
  → Weakness data stays in localStorage
  → Next sync will retry
```

### Auth Fails (User Unauthorized)
```
Fetch on profile page → RPC auth check fails
  → Return empty profiles array
  → Fall back to local-only
  → No error shown to learner
  → Profile page still renders local weaknesses
```

### Invalid Summary (Bug)
```
buildWeaknessSummary returns null
  → triggerWeaknessSyncAtSessionEnd catches error
  → Logs to console
  → Returns { success: false }
  → UI continues unaffected
```

---

## TESTING STRATEGY

### Unit Tests (test_weakness_sync.js)

- ✅ buildWeaknessSummary() edge cases
- ✅ Strength score calculation (accuracy → [0,100])
- ✅ Governance metadata always included
- ✅ Never contains scoring language

### Integration Tests (SQL + Frontend)

- ✅ RPC upsert: INSERT new row → verify in DB
- ✅ RPC upsert: UPDATE existing row → verify updated_at changed
- ✅ RPC read: Fetch own profiles → verify RLS allows
- ✅ RPC read: Attempt fetch other profiles → verify RLS blocks
- ✅ End-to-end: Complete session → check DB row created

### Regression Tests

- ✅ Y.1.1 Remediation still works (local-only)
- ✅ Profile page loads without Supabase
- ✅ Sessions complete without sync errors
- ✅ No governance violations introduced

---

## DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Migration runs successfully: `supabase db push`
- [ ] RLS policies created: SELECT/INSERT/UPDATE grants
- [ ] RPC functions registered: upsert + get
- [ ] weakness-sync.js imported in target HTML files
- [ ] Sync trigger added to session-completion flows
- [ ] Profile page reads persisted profiles
- [ ] Unit tests pass: test_weakness_sync.js
- [ ] Integration test passes: E2E session → DB verify
- [ ] No governance violations (automated + manual check)
- [ ] Local-only fallback verified (disconnect Supabase)

---

## PHASE GATES

**Gate for Y.2.1 → Y.2.2**:
- ✅ weakness_profiles activated (synced end-of-session)
- ✅ RLS prevents cross-user access
- ✅ Frontend can read multi-device persisted history
- ✅ Zero governance violations
- ⏳ Ready for Y.2.2: Misconception Detection (uses weakness_profiles as input)

---

## KNOWN LIMITATIONS

### 1. Single-Device View Per Session
**Issue**: If student logs in on Device A, then Device B, weakness_profiles on Device A are not automatically synced to Device B's localStorage.
**Mitigation**: Profile page fetches from Supabase (persisted), but in-session recommendations use local only.
**Future**: Y.3+ could implement cross-device sync on session start.

### 2. Strength Score Not Granular
**Issue**: strength_score is numeric [0-100], not decomposed by confidence.
**Mitigation**: Sufficient for Y.2.1-2.3; Y.3 can add confidence intervals if needed.

### 3. No Real-Time Sync
**Issue**: Sync happens only at session end, not continuously.
**Mitigation**: By design (reduce writes); acceptable for learning context.

---

## FILES CHANGED / CREATED

### Created (New)
- `supabase/migrations/20260614_y2_weakness_profiles_sync.sql` — RLS + RPC functions
- `shared/weakness-sync.js` — Sync module (195 LOC)
- `tests/test_weakness_sync.js` — Unit tests (230 LOC)

### To Be Modified
- `adaptive-session/index.html` — Add weakness-sync import, call triggerWeaknessSyncAtSessionEnd()
- `open-response-lab/index.html` — Add weakness-sync import, call triggerWeaknessSyncAtSessionEnd()
- `profile/profile.js` — Call fetchWeaknessProfiles() on load, render card
- May need: Supabase client reference (likely already available)

### No Changes Needed
- Backend (WSET-AI-System-push) — CLI/batch only
- Auth system — No touch
- Access control — No touch
- Payment system — No touch

---

## NEXT STEPS (POST-Y.2.1)

### Y.2.2: Misconception Detection
Uses weakness_profiles as input to identify recurring patterns.

### Y.2.3: Adaptive Recommendation Engine
Ranks recommendations by frequency, recency, severity, confidence.

### Y.2.4: Student Intelligence Dashboard
Profile page shows comprehensive weakness + improvement trends.

---

**Y.2.1 Architecture Document Complete**

Ready for implementation. No blockers identified.

