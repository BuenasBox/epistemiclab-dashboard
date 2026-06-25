# evaluate-or Edge Function

## Purpose

Formative feedback analysis for Open Response Lab questions. Analyzes student responses to detect conceptual coverage and causal reasoning completeness.

**Governance**: This is a pedagogical coaching tool, NOT official grading.

```
safe_for_examiner: false
formative_only: true
official_scoring: false
```

---

## Input Contract

### POST /functions/v1/evaluate-or

```typescript
{
  item_id: string;           // Question ID (e.g., "OR_001")
  response_text: string;     // Student's answer text
}
```

**Authentication**: Requires JWT Bearer token (user must be authenticated)

### Example Request

```bash
curl -X POST https://{project}.supabase.co/functions/v1/evaluate-or \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": "OR_020",
    "response_text": "Sandy soils have better drainage which can concentrate flavors..."
  }'
```

---

## Output Contract

### Success Response (200 OK)

```typescript
{
  concepts_detected: string[];              // Concepts student mentioned (present + partial)
  concepts_absent: string[];                // Expected concepts missing from response
  missing_causal_reasoning: string[];       // Reasoning gaps (e.g., unexplained cause-effect)
  improvement_suggestions: string[];        // Actionable feedback for revision
  depth: string;                            // Estimated response depth ('emerging'|'developing'|'strong')
  watermark: string;                        // Governance marker (user_id:24h - not persistent)
}
```

### Example Response

```json
{
  "concepts_detected": [
    "sandy soil: good drainage, low water retention",
    "sandy soil: moderate water stress, concentrated berries"
  ],
  "concepts_absent": [
    "clay soil: high water retention",
    "higher vigor can dilute compounds"
  ],
  "missing_causal_reasoning": [
    "Haz explícita la relación causa-efecto."
  ],
  "improvement_suggestions": [
    "Revisa incorporando explícitamente: clay soil: high water retention, higher vigor can dilute compounds."
  ],
  "depth": "developing",
  "watermark": "user_uuid:24h"
}
```

### Error Responses

**400 Bad Request** - Missing item_id
```json
{ "error": "Missing item_id" }
```

**401 Unauthorized** - Invalid/missing JWT
```json
{ "error": "Unauthorized" }
```

**404 Not Found** - item_id doesn't exist in or_bank
```json
{ "error": "Item not found" }
```

**500 Internal Error** - Fallback response (maintains governance)
```json
{
  "concepts_detected": [],
  "concepts_absent": [],
  "missing_causal_reasoning": [],
  "improvement_suggestions": ["Sin retroalimentación disponible para este elemento."]
}
```

---

## Algorithm

### Concept Detection (Hybrid Approach)

**Strategy**: Two-tier matching for robust detection

1. **Exact Substring Match**
   - Highest confidence
   - Catches well-articulated responses
   - Example: "cool climate preserves acidity" matches concept "cool climate: slower ripening"

2. **Token-Based Match**
   - Catches paraphrases and partial articulation
   - Matches meaningful words (>1 char, non-stopwords)
   - Example: "cool temps delay ripeness" partially matches "cool climate: slower ripening"

**Classification**:
- `present`: Exact match OR all concept tokens found
- `partial`: Some (but not all) concept tokens found
- `missing`: No tokens match

**Stopwords** (filtered out): a, al, and, de, del, el, en, for, la, las, los, of, the, to, un, una, y

**Limitations**:
- No semantic understanding (e.g., "cool" ≠ "cold" as different tokens)
- Cannot detect implicit knowledge (unstated but known)
- Cannot distinguish centrality (mentioned once vs. core point)

### Causal Reasoning Detection

**Trigger**: Student response contains causal connector words

**Connectors**: porque, debido, causa, provoca, produce, resulta, conduce, influye, afecta, impacta, because, leads, results

**Flag Condition**:
- Response is non-empty
- No connector found
- Depth target is 'developing' or 'strong'

**Output**: Flag in `missing_causal_reasoning` array

### Depth Classification

**Formula**:
```
coverage = (present + partial) / expected_count
depth = coverage >= 0.75  ? 'strong'
      : coverage >= 0.40  ? 'developing'
      : 'emerging'
```

**Purpose**: Informational classification only (not scoring)

---

## Data Dependencies

### Tables Read

**or_bank** (read-only)
```sql
SELECT
  expected_concepts JSONB,      -- Array of expected concept strings
  response_depth_target TEXT    -- 'foundational'|'developing'|'strong'
WHERE item_id = ?
```

**Constraints**:
- expected_concepts must be a non-empty array
- response_depth_target can be null (defaults to '')

### Tables Written

**None** - This function is stateless. It does not:
- Write to open_response_attempts
- Update user_metrics
- Record epistemic_events
- Persist feedback to database

---

## Governance & Safety

### What This Function IS

✅ Pedagogical feedback tool  
✅ Concept coverage analysis  
✅ Causal reasoning coaching  
✅ Formative assessment support  
✅ Safe for learning/practice  

### What This Function IS NOT

❌ Official WSET evaluation  
❌ Official grading mechanism  
❌ Equivalent to examiner scoring  
❌ Safe for certification decisions  
❌ Persistent learning record  

### Compliance Flags

```
safe_for_examiner: false       // Never use for official exam assessment
examiner_scoring_allowed: false // No authority for official scores
formative_only: true            // Coaching/learning context only
official_scoring: false         // No numerical official grades
```

### User Privacy

- `watermark` field: `user_id:24h` indicates feedback tied to user, valid for 24h
- No PII stored beyond JWT validation
- No response text persisted (stateless)
- CORS open (clients may call directly with valid JWT)

---

## Testing

Run basic contract tests:

```bash
# Tests are in test.ts in this directory
deno test --allow-net test.ts
```

Test coverage:
- Valid request with all parameters ✅
- Missing item_id validation ✅
- Missing response_text handling ✅
- Non-existent item_id (404) ✅
- Empty response handling ✅
- Concept detection accuracy ✅
- Causal reasoning detection ✅
- Depth classification boundaries ✅
- Output structure validation ✅
- Governance compliance (no scores/grades) ✅

---

## Version History

**v1** (2026-06-24)
- Initial deployment
- Hybrid concept detection (exact + token-based)
- Causal reasoning flagging
- Depth classification (informational)
- No scoring/grading output
- Stateless (no database writes)
- Governance-compliant (formative-only)

---

## Future Considerations

### Potential Extensions (Not Implemented)

1. **Misconception Detection**
   - Cross-reference response against known misconceptions table
   - Provide targeted educational intervention

2. **Rubric-Based Scoring**
   - Add optional `concept_coverage_score` output (e.g., 0-100)
   - Keep output governance-compliant (not official)
   - Support adaptive feedback tiers

3. **Batch Evaluation**
   - Accept array of {item_id, response_text}
   - Return array of feedback objects
   - Support efficient learning analytics

4. **Persistence Integration**
   - Record evaluated attempts to epistemic_events
   - Track concept coverage trajectory
   - Feed readiness calculations

5. **Semantic Matching**
   - Add optional NLP-based concept matching
   - Reduce false negatives from paraphrases
   - Maintain deterministic baseline for transparency

---

## Contact & Governance

**Governance Owner**: EpistemicLab Pedagogical Council  
**Function Owner**: Development Team  
**Last Audit**: 2026-06-24  
**Next Review**: 2026-09-24

For questions about use, modification, or governance compliance, contact the team.
