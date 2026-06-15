# Open Response Mentor System Architecture

**Status**: Complete and integrated  
**Version**: 1.0  
**Governance**: formative_only=true, safe_for_examiner=false, no LLM/generation/scoring

---

## Executive Summary

The Open Response Mentor is a deterministic, six-layer mentoring system that guides student thinking without generating answers or providing grading authority. It behaves like an experienced WSET tutor sitting beside the student, showing them *how to think* about open-response questions.

**Core Philosophy**: Guide structure, ask good questions, surface gaps—never write the answer.

---

## Six-Layer Architecture

### Layer 1: Command Verb Mentor

**What it does**: Explains what the command verb means and how to approach that type of question.

**Components**:
- Verb definitions (14 verbs: explain, describe, justify, assess, evaluate, compare, why, how, discuss, recommend, outline, state, list, identify_and_explain)
- Expected response format for each verb
- Structured thinking steps (do's and don'ts)
- Key phrases to use (not supplied—just suggested as scaffolding)
- Real examples of how to think through that verb type

**Example** (for "Explain"):
```
Verb: explain
Mentor Role: cause-effect guide
Core Guidance: Walk through the chain: What causes it? How does that cause it? What is the result?
Thinking Structure:
  1. Identify the initial factor or cause
  2. Explain the process or mechanism (the "how")
  3. Name the final result or effect
Key Phrases: because, due to, causes, leads to, results in, therefore
```

**Data Source**: `mentor-config.js` → `MENTOR_CONFIG.verb_mentors`

---

### Layer 2: Thinking Prompts

**What it does**: Asks guided questions that help students think deeper before answering.

**Components**:
- Verb-specific question prompts (3–5 per verb)
- Designed to scaffold thinking without giving answers

**Example** (for "explain"):
```
"What is the starting point or cause?"
"How does that cause lead to the next step?"
"What is the final effect or result?"
"Can you connect each step with causal language?"
```

**Data Source**: `mentor-config.js` → `MENTOR_CONFIG.thinking_prompts_by_verb`

---

### Layer 3: Causal Path Coach

**What it does**: Shows common causal chains in wine education, helping students see how concepts link together.

**Components**:
- 5 pre-built causal templates (climate→ripeness→acidity, oak→tannin→texture, etc.)
- Topic-to-template mapping (so the right templates appear for the right questions)
- Thinking prompts embedded in each template

**Example** (Climate → Ripeness → Acidity):
```
1. Cool climate → slower ripening
2. Slower ripening → malic acid retention
3. Retained acidity → freshness and crispness

Thinking Prompts:
  "How does temperature affect grape ripening speed?"
  "What happens to acids as grapes ripen?"
  "How does retained acidity change the wine's character?"
```

**Data Source**: `mentor-config.js` → `MENTOR_CONFIG.causal_path_templates`

---

### Layer 4: Concept Checklist

**What it does**: Lists the key concepts students should consider for each topic.

**Components**:
- Foundational-level concepts (what all students should know)
- Distinction-level concepts (what stronger/Distinction-level students add)
- Category labels (Viticulture, Winemaking, etc.)

**Example** (Climate Questions):
```
Foundational Level:
  - Climate type (cool, moderate, warm)
  - Temperature effect on ripening
  - Acidity preservation or loss
  - Sugar accumulation vs time

Distinction Level:
  - Diurnal range and its effects
  - Microclimatic variations
  - Specific acid behavior (malic vs tartaric)
  - Timing and phenolic maturity
```

**Data Source**: `mentor-config.js` → `MENTOR_CONFIG.concept_templates`

---

### Layer 5: Distinction Structure Guide

**What it does**: Shows what strong answers typically include, without giving the answer.

**Components**:
- Structure elements checklist
- Common weakness warning (what students often get wrong)

**Example** (for "explain" answers):
```
Strong Explain Answers Include:
  ✓ A clear starting cause or factor
  ✓ An explanation of HOW that cause works (the mechanism)
  ✓ The resulting effect or outcome
  ✓ Causal language connecting the steps
  ✓ Technical terminology appropriate to the topic

Common Weakness: Listing facts without connecting them with causal logic
```

**Data Source**: `mentor-config.js` → `MENTOR_CONFIG.distinction_patterns`

---

### Layer 6: Self-Review Checklist

**What it does**: Before submitting, students check their own work against 6 categories.

**Components**:
- Structure & Organization
- Verb Compliance
- Concepts & Evidence
- Causal Logic
- Language & Clarity
- Completeness

**Example**:
```
Structure & Organization:
  ✓ Is my response organized in a logical order?
  ✓ Did I answer what was actually asked?
  ✓ Did I avoid repeating myself?

Verb Compliance:
  ✓ Did I follow the command verb's requirements?
  ✓ Did I use the right type of thinking (causal, comparative, etc.)?
  ✓ Did I avoid the verb's common mistakes?
```

**Data Source**: `mentor-config.js` → `MENTOR_CONFIG.self_review_questions`

---

## Technical Architecture

### Core Modules

#### 1. `mentor-config.js`
- Contains all mentoring configuration (6 layers)
- No logic, no computation
- ~600 lines of structured data
- Exported as `window.MENTOR_CONFIG`

#### 2. `mentor-engine.js`
- Pure functions: `buildMentorGuidance(stem, topic, studentAnswer?, learnerState?)`
- Detects verb from question stem
- Assembles all 6 layers into a guidance packet
- Helper functions for analyzing student responses (causal reasoning, structure, verbosity)
- Exported as `window.MentorEngine`

**Key Functions**:
- `buildMentorGuidance()` - Main entry point
- `detectVerbFromStem()` - Verb detection via regex patterns
- `buildVerbMentorLayer()` - Layer 1
- `buildThinkingPromptsLayer()` - Layer 2
- `buildCausalPathLayer()` - Layer 3 (includes topic-to-template mapping)
- `buildConceptChecklistLayer()` - Layer 4
- `buildDistinctionStructureLayer()` - Layer 5
- `analyzeStudentResponse()` - For feedback mode (causal reasoning quality)

#### 3. `mentor-ui.js`
- React-like rendering functions
- `renderMentorUI(guidance)` - Renders all 6 layers as expandable cards
- `renderMentorSummary(guidance)` - Quick summary (smaller spaces)
- Professional, mobile-first styling
- No chatbot interface, no typing, no generated text
- Exported as `window.MentorUI`

**UI Features**:
- Expandable/collapsible cards for each layer
- Professional color scheme matching dashboard
- Mobile responsive
- Inline styles + CSS variables
- Accessibility: semantic HTML, no raw JSON visible

---

## Data Flow

```
Question Stem (e.g., "Explain how cool climate affects acidity")
         ↓
Verb Detection (detectVerbFromStem) → "explain"
         ↓
Configuration Lookup (MENTOR_CONFIG)
         ├→ Verb Mentor (explain definition + structure)
         ├→ Thinking Prompts (explain-specific guiding questions)
         ├→ Causal Path Coach (topic "climate" → relevant paths)
         ├→ Concept Checklist (topic "climate" → expected concepts)
         ├→ Distinction Structure (explain-answer structure guide)
         └→ Self-Review Checklist (6 categories)
         ↓
Guidance Packet (JSON object with all 6 layers)
         ↓
UI Rendering (MentorUI.renderMentorUI)
         ↓
HTML Cards (expandable, professional, mobile-friendly)
         ↓
Browser Display (integrated into Open Response Lab & Full Simulation)
```

---

## Integration Points

### Open Response Lab
**File**: `epistemiclab-dashboard/open-response-lab/index.html`

```javascript
// In render() function:
if (els.verbCoach && window.MentorEngine && window.MentorUI) {
  const guidance = window.MentorEngine.buildMentorGuidance(item.stem, item.topic);
  els.verbCoach.innerHTML = window.MentorUI.renderMentorUI(guidance);
}
```

**Location**: Renders in the `[data-testid="verb-coach"]` div, above the answer textarea.

### Full Simulation Part 2 (Open Response)
**File**: `epistemiclab-dashboard/full-simulation/index.html`

```javascript
// In renderORQ() function:
if($('or-verb-coach')){
  if(window.MentorEngine && window.MentorUI){
    const guidance=window.MentorEngine.buildMentorGuidance(
      q.stem||q.question_text||'', q.topic||null
    );
    $('or-verb-coach').innerHTML=window.MentorUI.renderMentorUI(guidance);
  }
}
```

**Location**: Renders in the `id="or-verb-coach"` div, between the question stem and the answer textarea.

---

## Governance Model

### What the Mentor DOES
✓ Guide student thinking with structured prompts  
✓ Show what strong answers include (without giving the answer)  
✓ Help detect missing causal reasoning  
✓ Highlight concept gaps for self-review  
✓ Provide verb-specific structure guidance  
✓ Ask Socratic questions  

### What the Mentor NEVER DOES
✗ Generate answer text  
✗ Supply specific paragraphs or model answers  
✗ Predict pass/merit/distinction grades  
✗ Call external APIs, LLMs, or embeddings  
✗ Score or grade student work  
✗ Provide examiner authority  
✗ Make claims about WSET official standards  

### Governance Flags
```javascript
{
  safe_for_examiner: false,
  examiner_scoring_allowed: false,
  formative_only: true,
  no_generated_answers: true,
  uses_llm: false,
  uses_api: false,
  uses_embeddings: false,
  uses_vector_db: false
}
```

---

## Verb Coverage

All 14 command verbs in the structured question bank are covered:

| Verb | Type | Thinking Structure | Key Phrases |
|------|------|-------------------|-------------|
| explain | causal | Cause → Mechanism → Effect | because, due to, leads to |
| describe | observation | Features → Specific terms → Multiple dimensions | appears, evident, characterized |
| justify | evidence | Position → 3+ reasons → Links | because, therefore, demonstrates |
| assess | judgment | Quality judgment → Evidence → WSET vocabulary | quality, excellent, good |
| evaluate | synthesis | 3+ factors → Impact assessment → Synthesis | factor, significantly, therefore |
| compare | analysis | Shared dimensions → Item A vs B → Both sides | whereas, while, in contrast |
| why | causal (short) | Cause → Direct effect | because, due to, since |
| how | procedural | Starting point → Steps → Final result | first, then, next, finally |
| discuss | balanced | Perspective 1 → Perspective 2 → Conclusion | on one hand, however, conclude |
| recommend | application | Recommendation → Evidence → Fit to scenario | recommend, because, suitable |
| outline | synthesis | Key points → Logical order → Brevity | main, key, primary, then |
| state | recall | Direct fact → No elaboration → Brevity | — (factual only) |
| list | enumeration | Enumeration → Clear format → Consistency | 1. 2. 3. or • • • |
| identify_and_explain | recall+comprehension | Part 1: Name it → Part 2: Explain it | is called, because, therefore |

---

## Topic Mapping

Causal paths are auto-mapped to relevant topics:

```javascript
{
  'climate': ['climate_ripeness_acidity'],
  'oak_ageing': ['oak_tannin_texture'],
  'vigor': ['vigor_concentration_style'],
  'fermentation': ['fermentation_temperature_aroma'],
  'residual_sugar': ['residual_sugar_balance'],
  // ... etc
}
```

When a question's topic is detected, the engine finds matching causal paths and includes them in Layer 3.

---

## Concept Categories

Concepts are organized by learning level:

1. **Foundational Level** - Essential concepts all students must know
2. **Distinction Level** - Nuanced concepts that distinguish Distinction answers

Categories include:
- Viticulture & Climate
- Viticulture & Soil
- Winemaking & Fermentation
- Winemaking & Oak
- Sensory Analysis
- Regional Styles

---

## UI Component Hierarchy

```
mentor-shell
├── mentor-card (Layer 1: Verb Mentor)
│   ├── mentor-card-header
│   │   ├── mentor-toggle (▶/▼)
│   │   ├── mentor-title
│   │   └── mentor-subtitle
│   └── mentor-card-body (expandable)
│       ├── mentor-guidance-text
│       ├── mentor-list (thinking structure)
│       ├── mentor-phrase-tag (key phrases)
│       └── mentor-example
├── mentor-card (Layer 2: Thinking Prompts)
├── mentor-card (Layer 3: Causal Path Coach)
│   └── mentor-causal-path (per template)
│       ├── mentor-causal-step
│       └── thinking prompts
├── mentor-card (Layer 4: Concept Checklist)
│   ├── mentor-concept-level (Foundational)
│   │   └── mentor-concept-list
│   └── mentor-concept-level (Distinction)
│       └── mentor-concept-list
├── mentor-card (Layer 5: Distinction Structure)
│   ├── mentor-structure-element (per element)
│   └── mentor-warning (common weakness)
└── mentor-card (Layer 6: Self-Review)
    └── mentor-section (per category)
        └── mentor-list (questions)
```

---

## Testing Strategy

### Unit Tests
- Verb detection accuracy (all 14 verbs)
- Guidance generation completeness (all 6 layers)
- Answer analysis (causal reasoning, structure, verbosity)
- Configuration validation (no missing fields)

### Integration Tests
- Full workflow: stem → verb → guidance → UI
- Works with all verbs and topics
- Graceful degradation with missing config

### Governance Tests
- No generated answers in output
- No scoring language
- No LLM markers
- Proper flag declarations

### Performance Tests
- Guidance generation < 100ms
- UI rendering < 100ms
- No blocking operations

See `mentor-system.test.js` for comprehensive test suite.

---

## Files Changed/Created

```
epistemiclab-dashboard/
├── shared/
│   ├── mentor-config.js          [NEW] Configuration (6 layers, 14 verbs, etc)
│   ├── mentor-engine.js          [NEW] Logic engine (verb detection, guidance assembly)
│   └── mentor-ui.js              [NEW] UI rendering (cards, mobile-first)
├── open-response-lab/
│   └── index.html                [MODIFIED] Added mentor script tags & render call
├── full-simulation/
│   └── index.html                [MODIFIED] Added mentor script tags & render call
└── tests/
    └── mentor-system.test.js      [NEW] Comprehensive test suite (~60 tests)

docs/
├── OPEN_RESPONSE_MENTOR_ARCHITECTURE.md    [NEW] This file
├── OPEN_RESPONSE_MENTOR_REPORT.md          [NEW] Implementation report
└── OPEN_RESPONSE_MENTOR_VALIDATION.md      [NEW] Test results & validation
```

---

## Performance Characteristics

| Operation | Time | Size |
|-----------|------|------|
| Verb detection | <5ms | — |
| Guidance generation | <50ms | ~5–10KB |
| UI rendering | <50ms | ~15–25KB HTML |
| Full pipeline | <100ms | Total |
| mentor-config.js | — | ~25KB |
| mentor-engine.js | — | ~12KB |
| mentor-ui.js | — | ~18KB |

---

## Future Enhancements (Out of Scope)

- **Learner state integration**: Use weakness profiles to personalize concept checklists
- **Adaptive scaffolding**: Auto-hide foundational concepts if learner has mastered them
- **Multi-language support**: Translate configuration to Spanish (Español)
- **Feedback mode**: Highlight missing concepts in student answer feedback
- **Analytics**: Track which layers students use most, verb performance trends

---

## Compatibility

- **Browser**: All modern browsers (ES6+)
- **Framework**: Vanilla JavaScript (no React, Vue, Angular dependency)
- **CSS**: CSS variables (–panel, –text, –accent, etc.) for theme matching
- **Accessibility**: Semantic HTML, keyboard-navigable, screen-reader compatible

---

## Summary

The Open Response Mentor is a complete, deterministic, governance-clean coaching system that guides student thinking across 6 layers of mentoring and 14 command verbs. It integrates seamlessly into Open Response Lab and Full Simulation Part 2, providing professional, mobile-first guidance without generating answers or grading.

