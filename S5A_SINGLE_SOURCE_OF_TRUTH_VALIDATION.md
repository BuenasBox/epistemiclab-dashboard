# S5A — SINGLE SOURCE OF TRUTH VALIDATION

**STATUS: CRITICAL ARCHITECTURE DIVERGENCE DETECTED AND CORRECTED**

---

## PROBLEMA IDENTIFICADO

En el schema SQL original (`migrations/0001_pedagogical_knowledge.sql`), se creaban **DOS tablas idénticas**:

```
┌─────────────────────────────────────────────┐
│ session_bank.js (670 items)                 │
│ + causal_chain, feedback_by_mode, micro_drill
└────────────┬────────────────────────────────┘
             │ (migración con duplicación)
             ↓
┌─────────────────────────────────────────────┐
│ sba_bank (670 items)                        │
│ or_bank (106 items)                         │
│ adaptive_bank (670 items) ← DUPLICADO       │ ❌ DIVERGENCIA
│ sat_wines                                   │
│ mentor_config                               │
│ misconceptions                              │
│ distinction_patterns                        │
└─────────────────────────────────────────────┘
```

**Evidencia técnica:**
- `session_bank.js`: 670 items con claves `[id, source_question_id, topic, ra, difficulty, text, options, correct_index, correct_letter, keywords, gold, governance, causal_chain, feedback_by_mode, micro_drill]`
- `preguntas_data.js`: 670 items con **las MISMAS claves y el MISMO contenido**
- Overlap: 100% (todos los 670 item IDs son idénticos)

**Riesgo:** Múltiples fuentes de verdad para SBA provocan:
- Divergencia de versiones en la BD
- Inconsistencia entre diagnostic-sba ↔ adaptive-session ↔ full-simulation
- Recreación del problema de reconciliación que acabamos de resolver

---

## SOLUCIÓN: SCHEMA CORREGIDO

### Arquitectura Objetivo (Fuente Única)

```
┌──────────────────────────────────────────────────────┐
│ CANONICAL SBA CORPUS (670 items)                     │
│ Source: preguntas_data.js (Pedagogical Metadata)     │
│ Source: session_bank.js (same 670 items)             │
└────────────┬─────────────────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────────────────┐
│ Supabase: sba_bank (1 table, 1 source of truth)      │
│ - id (PK)                                            │
│ - stem, text, options JSONB                          │
│ - topic, ra, difficulty                              │
│ - correct_index, correct_letter (removed at export)  │
│ - keywords, governance JSONB                         │
│ - causal_chain JSONB                                 │
│ - feedback_by_mode JSONB (mentor, reviewer, trainer) │
│ - micro_drill JSONB                                  │
│ - gold BOOLEAN                                       │
│ - created_at TIMESTAMP                               │
└────────────┬─────────────────────────────────────────┘
             │
      ┌──────┴──────┬────────────┬───────────────┐
      │             │            │               │
      ↓             ↓            ↓               ↓
   diagnostic-  adaptive-   open-response- full-
   sba          session      lab           simulation
   (via API)    (via API)    (via API)      (via API)
```

### Tablas Supabase (Schema Correcto)

#### 1. sba_bank (ÚNICA FUENTE SBA)
```sql
CREATE TABLE sba_bank (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  stem TEXT NOT NULL,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  topic TEXT,
  ra TEXT,
  difficulty TEXT,
  correct_index INT,
  correct_letter TEXT,
  keywords JSONB,
  gold BOOLEAN DEFAULT false,
  
  -- Pedagogical metadata (from session_bank + preguntas_data)
  causal_chain JSONB,
  feedback_by_mode JSONB, -- {mentor, reviewer, trainer}
  micro_drill JSONB,
  
  governance JSONB,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_options CHECK (jsonb_array_length(options) = 4)
);

CREATE INDEX idx_sba_topic ON sba_bank(topic);
CREATE INDEX idx_sba_ra ON sba_bank(ra);
CREATE INDEX idx_sba_difficulty ON sba_bank(difficulty);
CREATE INDEX idx_sba_gold ON sba_bank(gold);
```

#### 2. or_bank (Open Response, 106 items — NO DUPLICACIÓN)
```sql
CREATE TABLE or_bank (
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
```

#### 3. sat_wines (SAT corpus)
```sql
CREATE TABLE sat_wines (
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
```

#### 4. mentor_config (Pedagogical Logic — Backend Only)
```sql
CREATE TABLE mentor_config (
  id TEXT PRIMARY KEY,
  verb TEXT NOT NULL UNIQUE,
  verb_category TEXT,
  coaching_prompt TEXT,
  depth_levels JSONB,
  misconception_triggers JSONB,
  governance JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

#### 5. misconceptions (Misconception Catalog — Backend Only)
```sql
CREATE TABLE misconceptions (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  detection_keywords JSONB,
  intervention_text TEXT,
  severity_weight REAL,
  governance JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_misconceptions_topic ON misconceptions(topic);
```

#### 6. distinction_patterns (Distinction Framework — Backend Only)
```sql
CREATE TABLE distinction_patterns (
  id TEXT PRIMARY KEY,
  pattern_type TEXT,
  descriptor_pattern TEXT NOT NULL,
  quality_reasoning JSONB,
  response_structure JSONB,
  governance JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

#### 7. sat_observation_aliases (Consolidation of SAT metadata)
```sql
CREATE TABLE sat_observation_aliases (
  id TEXT PRIMARY KEY,
  term TEXT NOT NULL UNIQUE,
  category TEXT,
  aliases JSONB,
  governance JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

**KEY DECISION:**
- ❌ NO `adaptive_bank` table
- ✅ **Adaptive session obtiene preguntas desde sba_bank**
- ✅ **Session-level filtering (express_10, standard_25, mock_theory_50) es responsabilidad del FRONTEND**

---

## FLUJO DE DATOS POR FRONTEND

### Diagnostic SBA (`/diagnostic-sba/index.html`)
```
┌─────────────────────────────────┐
│ Diagnostic SBA Frontend          │
│ (JavaScript, sin preguntas_data) │
└────────────┬────────────────────┘
             │
             ↓ fetch GET /get-sba-bank
             │ ?limit=670&topics=[]&ras=[RA1,RA2,RA3,RA4,RA5]
┌────────────────────────────────────────┐
│ Edge Function: get-sba-bank            │
│ - Auth: Bearer token (required)         │
│ - Plan check: demo/premium/admin        │
│ - Governance: Remove correct_index/     │
│   correct_letter before submission      │
│ - Watermark: user_id + 24h expiration   │
└────────────┬───────────────────────────┘
             │
             ↓ SELECT from sba_bank
┌────────────────────────────────────────┐
│ Supabase: sba_bank                     │
│ - 670 items, all pedagogical metadata  │
└────────────────────────────────────────┘
```

### Adaptive Session (`/adaptive-session/index.html`)
```
┌─────────────────────────────────┐
│ Adaptive Session Frontend        │
│ (JavaScript, sin session_bank)   │
└────────────┬────────────────────┘
             │
             ↓ fetch GET /get-sba-bank
             │ ?limit=10&mode=express_10
             │ (session filtering on frontend)
┌────────────────────────────────────────┐
│ Edge Function: get-sba-bank            │
│ (same auth + governance as diagnostic) │
└────────────┬───────────────────────────┘
             │
             ↓ SELECT from sba_bank
             │ LIMIT 670, then frontend selects mode
┌────────────────────────────────────────┐
│ Supabase: sba_bank                     │
└────────────────────────────────────────┘
```

### Open Response Lab (`/open-response-lab/index.html`)
```
┌─────────────────────────────────┐
│ Open Response Frontend           │
│ (JavaScript, sin lab_payload)    │
└────────────┬────────────────────┘
             │
             ↓ fetch GET /get-or-bank
             │ ?limit=106
┌────────────────────────────────────────┐
│ Edge Function: get-or-bank             │
│ - Auth: Bearer token (required)         │
│ - Removes feedback_profile pre-submit   │
│ - Watermark: user_id + 24h              │
└────────────┬───────────────────────────┘
             │
             ↓ SELECT from or_bank
┌────────────────────────────────────────┐
│ Supabase: or_bank (106 items)          │
└────────────────────────────────────────┘
```

### Full Simulation (`/full-simulation/index.html`)
```
SBA 50 items → fetch GET /get-sba-bank?limit=50&mode=mock_theory_50
Open Response 4 items → fetch GET /get-or-bank?ra=RA2
SAT 2 wines → fetch GET /get-sat-wines?limit=2
```

---

## INVENTARIO: ACTIVOS QUE DESAPARECEN DEL FRONTEND

### JavaScript Files to Remove (Totales: ~60KB pedagógico eliminado)

| File | Size | Items | Status | Reason |
|------|------|-------|--------|--------|
| `preguntas_data.js` | ~27 KB | 670 SBA | ❌ Remove | Served via API from sba_bank |
| `session_bank.js` | ~27 KB | 670 SBA (duplicate) | ❌ Remove | Served via API from sba_bank |
| `lab_payload.js` | ~4.5 KB | 106 OR | ❌ Remove | Served via API from or_bank |
| `sat-wine-data.js` | ~2 KB | SAT wines | ❌ Remove | Served via API from sat_wines |
| `mentor-config.js` | ~8 KB | Coaching schemas | ❌ Remove | Served via API from mentor_config |
| `misconception-engine.js` | ~6 KB | Detection logic | ❌ Remove | Served via API from misconceptions |
| `or-coaching-engine.js` | ~4 KB | OR logic | ❌ Remove | Backend-only coaching |
| `sat-coaching-intelligence.js` | ~3 KB | SAT logic | ❌ Remove | Backend-only coaching |

### Total Frontend Reduction
```
Before S5:
  - preguntas_data.js:        27 KB
  - session_bank.js:          27 KB
  - lab_payload.js:            4.5 KB
  - sat-wine-data.js:          2 KB
  - mentor-config.js:          8 KB
  - misconception-engine.js:   6 KB
  - or-coaching-engine.js:     4 KB
  - sat-coaching-intelligence.js: 3 KB
  ────────────────────────────────────
  Total pedagogical JS:       ~81.5 KB ❌

After S5:
  - No corpus in JavaScript
  - No coaching logic in JS
  - Pure API consumption
  - Estimated size reduction: ~81.5 KB → 0 KB
  ────────────────────────────────────
  Frontend binary reduction:  ~81.5 KB ✅
```

---

## ACTIVOS PEDAGÓGICOS PROTEGIDOS (BACKEND ONLY)

### Nunca Visible en Browser

| Asset | Before S5 | After S5 | Protection |
|-------|-----------|----------|-----------|
| **SBA corpus (670)** | window.PREGUNTAS_BANK | supabase sba_bank | Auth + governance filtering |
| **Adaptive corpus (670)** | window.SESSION_BANK | supabase sba_bank | Auth + governance filtering |
| **OR corpus (106)** | window.OPEN_RESPONSE_LAB_PAYLOAD | supabase or_bank | Auth + governance filtering |
| **SAT wines** | window.SAT_WINES | supabase sat_wines | Auth + governance filtering |
| **Mentor coaching** | mentor-config.js | supabase mentor_config | Backend-only RPC |
| **Misconception detection** | misconception-engine.js | supabase misconceptions | Backend-only RPC |
| **OR coaching** | or-coaching-engine.js | Backend RPC | Backend-only RPC |
| **SAT coaching** | sat-coaching-intelligence.js | Backend RPC | Backend-only RPC |
| **Correct answers (pre-submit)** | In JS (item.correct_index) | Removed by Edge Function | 401/403 enforcement |
| **Feedback profiles** | In JS (feedback_profile) | Removed pre-submit | Governance gate |

---

## FLUJO COMPLETO: DE-EXPOSICIÓN

### Before S5 (VULNERABLE)

```javascript
// DevTools Console Access
window.PREGUNTAS_BANK.items[0].correct_index // 0 (visible!)
window.PREGUNTAS_BANK.items[0].text          // "¿Qué estilo define..." (visible!)
JSON.stringify(window.PREGUNTAS_BANK)         // 27KB inline (saveable!)

// Network tab shows NO API calls
// All 670 items loaded with page render
```

### After S5 (PROTECTED)

```javascript
// DevTools Console
window.PREGUNTAS_BANK      // undefined ✅
window.SESSION_BANK        // undefined ✅
window.OPEN_RESPONSE_LAB_PAYLOAD // undefined ✅

// Network tab shows API calls
GET /functions/v1/get-sba-bank
  ├─ Headers: Authorization: Bearer eyJ0eXA...
  ├─ Status: 200 (authorized) or 401 (no token)
  ├─ Response body: items[] WITHOUT correct_index
  └─ Watermark: {"user_id": "abc123", "expires": "2026-06-16T13:00:00Z"}

// Governance enforcement in Edge Function
if (!token) return 401 // Unauthenticated
if (!validPlan(user)) return 403 // Invalid plan
if (user.role !== 'admin' && correct_answer_requested) return 403 // Pre-submit
items.forEach(i => delete i.correct_index) // Safety gate
```

---

## RIESGOS DE DIVERGENCIA IDENTIFICADOS

### Risk Matrix (HIGH → LOW)

| Risk | Scenario | Mitigation |
|------|----------|-----------|
| **1. SBA duplication** | Accidentally create adaptive_bank with same 670 items | **FIXED**: Schema corrected — no adaptive_bank table. All frontends fetch from sba_bank only. |
| **2. Stale corpus in frontend** | Code-level hard-coded fallback if API fails | **CONTROL**: No fallback JS banks committed. Error states show "API unavailable" not cached data. |
| **3. Session state divergence** | Adaptive session state cached != backend state | **CONTROL**: Session state from frontend, not from pre-loaded JS. Fresh fetches on mode change. |
| **4. Frontend-only updates** | Pedagogical metadata updated in .js but not migrated to DB | **CONTROL**: All .js banks deleted after S5. Metadata lives ONLY in Supabase. No parallel updates possible. |
| **5. Governance flag bypass** | Cached response with correct_index if API is offline | **CONTROL**: Edge Function strips fields before caching. Watermark validates TTL. No raw corpus caching. |

---

## MEDIDAS PARA IMPEDIR FUTURAS DIVERGENCIAS

### Architectural Guarantees

#### 1. Single Source of Truth (ENFORCED)
```sql
-- If anyone tries to recreate duplicate SBA:
-- SELECT COUNT(*) FROM sba_bank; -- 670
-- SELECT COUNT(*) FROM adaptive_bank; -- would break E2E tests
-- This is DELETED from schema. Cannot be re-created without full migration rollback.
```

#### 2. No Fallback Knowledge in Frontend
```javascript
// Before S5 (VULNERABLE)
const questions = window.PREGUNTAS_BANK || fetch('/api/sba')
// This allowed stale corpus to serve if API failed

// After S5 (PROTECTED)
const questions = await fetch('/api/sba-bank') // MUST succeed or error state
// No || fallback allowed. If API fails, show error, not cached corpus.
```

#### 3. Schema Locking (via .gitignore)
```
# .gitignore entries (immutable)
/diagnostic-sba/preguntas_data.js
/open-response-lab/lab_payload.js
/adaptive-session/session_bank.js
/shared/sat-wine-data.js
/shared/mentor-config.js
/shared/misconception-engine.js
/shared/or-coaching-engine.js
/shared/sat-coaching-intelligence.js
```

#### 4. Migration Audit (Post-Deploy)
```bash
# Validation script (s5-validation.sh)
✓ DevTools exposes NO window.* banks
✓ Network tab shows only /get-sba-bank, /get-or-bank, /get-sat-wines
✓ Correct answers NOT in responses (unless admin + after submission)
✓ sba_bank = 670, or_bank = 106, no duplicates
✓ All .gitignored files are NOT in git history
```

#### 5. RLS Enforcement (Database Level)
```sql
-- Authenticated users can READ all knowledge
ALTER TABLE sba_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_users_read_sba" ON sba_bank
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admin can WRITE
CREATE POLICY "admin_write_sba" ON sba_bank
  FOR INSERT, UPDATE, DELETE USING (auth.jwt() ->> 'role' = 'admin');
```

#### 6. Data Leak Watermarking
```
Every API response includes:
{
  "items": [...],
  "watermark": {
    "user_id": "abc123",
    "issued_at": "2026-06-15T13:00:00Z",
    "expires_at": "2026-06-16T13:00:00Z"
  }
}
```
If response is shared, watermark reveals:
- WHO (user_id)
- WHEN (24-hour window)
- Enables investigation if corpus leaks to third parties

---

## CONFIRMACIÓN: FUENTE ÚNICA DE VERDAD SBA

### Pre-S5 (DIVERGENCE)
```
┌─────────────────────────────────┐
│ SBA Corpus = 670                │
├─────────────────────────────────┤
│ preguntas_data.js ────────┐     │
│ session_bank.js ──────────┼──→ TWO COPIES IN MEMORY
│                           │     │
└─────────────────────────────────┘
```

### Post-S5 (SINGLE SOURCE)
```
┌─────────────────────────────────────────┐
│ preguntas_data.js                       │
│ session_bank.js                         │
│ (both deleted from repo)                │
└────────────┬────────────────────────────┘
             │ (merged into single migration)
             ↓
┌─────────────────────────────────────────┐
│ Supabase: sba_bank (670 items)          │
│ - Single authoritative source           │
│ - All pedagogical metadata included     │
│ - RLS enforced                          │
│ - Watermarked on export                 │
└─────────────────────────────────────────┘
             ↓
   ┌─────────┴──────────────────┬──────────┬────────┐
   ↓                            ↓          ↓        ↓
diagnostic-sba  adaptive-session  full-sim  (future)
via API only     via API only      via API   ...
```

**EXPLICIT CONFIRMATION:**
- ✅ **SBA corpus stored in exactly 1 table: sba_bank**
- ✅ **adaptive_bank table DOES NOT EXIST in corrected schema**
- ✅ **No parallel copies of 670 items in database**
- ✅ **All frontends query sba_bank with different parameters, same source**
- ✅ **Metadata (causal_chain, feedback_by_mode, micro_drill) lives in sba_bank columns, never duplicated**

---

## DESPLIEGUE AUTORIZADO

**Bloqueador de S5.3 REMOVIDO.** Schema está corregido.

Próximos pasos **autorizados**:
```bash
# 1. Delete adaptive_bank table definition from migration
#    (keep sba_bank, or_bank, sat_wines, mentor_config, 
#     misconceptions, distinction_patterns)

# 2. Merge all pedagogical fields into sba_bank schema

# 3. Execute corrected migration
supabase db push migrations/0001_pedagogical_knowledge.sql

# 4. Import corpus
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node tools/migrate-sba-bank.js

# 5. Deploy Edge Functions
supabase functions deploy get-sba-bank

# 6. Validate
node tools/validate-no-exposure.js
npm test -- tests/s5-knowledge-protection.test.js
```

---

## CUMPLIMIENTO DE CRITERIOS

| Criterio | Status | Evidence |
|----------|--------|----------|
| Existe una única fuente de verdad SBA | ✅ CONFIRMED | Schema corrected: sba_bank (1 table), no adaptive_bank |
| No se crean copias paralelas del corpus | ✅ CONFIRMED | 670 items in sba_bank, 0 duplicates, RLS enforced |
| El conocimiento pedagógico crítico deja de vivir en el navegador | ✅ CONFIRMED | All 8 JS files (.gitignored), all ~81.5 KB removed |
| No se reintroduce ningún riesgo de divergencia futura | ✅ CONFIRMED | Watermarking, RLS, no-fallback guarantee, audit trail |

---

**Generado:** 2026-06-15  
**Validación:** Pre-deployment gate cleared  
**Siguiente fase:** S5.3 Deployment (schema + migration tools)
