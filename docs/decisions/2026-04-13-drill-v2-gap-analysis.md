# Drill System v2 — What We Have vs What We Need

> Generated April 13, 2026 from codebase audit against finalized plan v2.

---

## Summary

The drill backend (schema, API routes, SRS, seed pipeline) is **largely built**. The drill frontend (DrillCard, dashboard integration) **exists but needs significant rework** for v2 decisions. Content (drills.json) has **109 drills seeded but none structured as atom chains** per the v2 plan.

| Area | Status | Blocking Phase 1? |
|------|--------|--------------------|
| DB schema (syntaxDrills, userDrillStates, drillAttempts) | ✅ Exists | No — but needs 2 new columns for Phase 3 |
| API routes (GET queue, POST attempt, GET stats) | ✅ Exists | No |
| SRS engine (drill stability, fatigue, fluency) | ✅ Exists | No |
| Seed script + drills.json pipeline | ✅ Exists | No |
| DrillCard component | ⚠️ Exists — needs rework | **Yes** — no MC mode, no retry flow, uses Jaccard |
| Session header bar | ❌ Missing | Phase 2 |
| Sounds & animations | ❌ Missing | Phase 2 |
| Onboarding tour | ❌ Missing | Phase 2 |
| Group Anagrams atom chain content | ❌ Missing | **Yes** — gates Phase 1 validation |
| promptVariants field | ❌ Missing (schema + content) | Phase 3 |
| testCases field | ❌ Missing (schema + content) | Phase 3 |
| L5 drills (any) | ❌ Missing | Phase 3 |
| Pyodide integration | ❌ Missing | Phase 3 |

---

## Detailed Breakdown

### 1. Database Schema — `src/db/schema.ts`

**What exists:**
- `syntaxDrills` table: id, title, category, level (1–4), language, prompt, expectedCode, alternatives[], explanation, tags[]
- `userDrillStates` table: stability, lastReviewedAt, nextReviewAt, totalAttempts, bestConfidence, notes
- `drillAttempts` table: userCode, confidence, sessionPosition, categoryStreak, effectiveCredit
- `drillLevelEnum`: values "1"–"4"
- `drillConfidenceEnum`: values "1"–"4"

**What's missing (Phase 3):**
- `promptVariants text[]` column on `syntaxDrills` — for anti-memorization rotation
- `testCases jsonb` column on `syntaxDrills` — for L5 Pyodide inputs/outputs
- Level enum doesn't include "5" — needs update for L5 drills

**No changes needed for Phase 1.** Schema is sufficient.

---

### 2. API Routes

**What exists:**
- `GET /api/drills` — returns drills with user state (left join), supports filter (due/new/all) and category params, computes level unlock thresholds per category
- `POST /api/drills/attempt` — validates input, computes fatigue credit, creates/updates userDrillState, records drillAttempt
- `GET /api/drills/stats` — per-category fluency scores with tier computation

**What's missing:**
- Server-side random selection of `promptVariants` (Phase 3) — GET route would pick one phrasing randomly instead of returning the static `prompt` field
- No changes needed for Phase 1

---

### 3. SRS Engine — `src/lib/srs.ts`

**What exists:**
- `computeFatigueCredit(sessionPosition, categoryStreak)` — session + category fatigue multiplier
- `computeDrillStability(oldStability, confidence, fatigueCredit)` — confidence 1–4 maps to multiplier
- `computeDrillFluency(input)` — per-category fluency score with tier
- `computeSessionFatigue(position)` — diminishing returns at 8/15/25 thresholds
- `computeCategoryStreakPenalty(streak)` — consecutive same-category penalty
- `computeNextReviewDate(stability, fromDate)` — date math
- Problem SRS (`computeNewStability`, `computeRetrievability`, `computeReadiness`) — separate, untouched by drill changes

**What's missing:**
- Nothing for Phase 1–2. SRS for drills is complete.

---

### 4. Seed Pipeline

**What exists:**
- `scripts/seed-drills.ts` — reads `drills.json`, inserts into `syntax_drill` table via Drizzle, uses `onConflictDoNothing`
- `drills.json` — 109 drills across 18 categories, levels L1–L4

**What's missing for Phase 1:**
- Seed script doesn't handle `promptVariants` or `testCases` fields (not needed until Phase 3)
- Group Anagrams atom chain content not yet authored (see §7 below)

---

### 5. DrillCard Component — `src/components/drill-card.tsx`

**What exists:**
- Two phases: prompt → result
- Code textarea with `Ctrl+Shift+Enter` to submit
- `checkCode()` function: exact normalized match → correct, then Jaccard token similarity fallback
- Verdict display (correct/close/incorrect) with expected code + explanation
- Auto-rated confidence based on similarity
- Level badges (L1–L4 styled)
- `inferReturnHint()` for code hints
- `renderInlineCode()` for backtick rendering in explanations

**What needs to change for Phase 1 (5 items):**

| Change | Current | Target |
|--------|---------|--------|
| **Scoring algorithm** | Jaccard (`intersection / union`) | Recall-biased (`intersection / expectedTokens`). Thresholds: ≥0.85 correct, 0.75–0.84 conf 3, 0.65–0.74 conf 2, <0.65 incorrect |
| **L1/L2 scoring** | Same fuzzy scoring for all levels | L1/L2: exact match only (no token scoring). L3+: recall-biased tokens |
| **L1 MC mode** | No MC — all levels use textarea | Level 1: render MC options from `alternatives[]` + `expectedCode`. Tab switches to type-it mode with dimmed MC options |
| **Partial credit retry** | Single attempt, auto-rated | Below threshold → show wrong code read-only above + fresh textarea below → second attempt. Two attempts max. |
| **Navigation shortcuts** | None | `Ctrl+.` advance, `Ctrl+,` previous. Dirty-state guard with sessionStorage draft save |

**What needs to be added in Phase 2:**

| Feature | Notes |
|---------|-------|
| Session header bar | Progress pips, combo badge, auto-continue toggle, mute button — above DrillCard |
| Sound system | Pre-loaded audio assets, mute state in localStorage |
| Verdict animations | Green pop (correct), amber shimmer (partial), shake (wrong) — CSS keyframes |
| Session summary modal | After drill 8, counting animation, Done / Keep going |
| Onboarding tour | localStorage flag, one-screen, covers levels/sounds/shortcuts |

---

### 6. Dashboard Integration — `src/app/dashboard/dashboard-client.tsx`

**What exists:**
- Drills tab alongside Review/New/Done/Import tabs
- DrillCard imported and used for drill interactions
- Demo mode with drill data
- Sub-tabs: Due / New / Mastered
- "Daily Drill" session button
- Session flow with drill queue

**What needs to change:**
- DrillCard changes propagate here (MC mode, retry flow, etc.)
- Session header bar integration (Phase 2)
- The dashboard shell itself is mostly fine

---

### 7. Content Gap — Group Anagrams Atom Chain

**The single dependency that gates Phase 1 pipeline validation.**

Per the plan, the Group Anagrams atom chain needs L1–L4 drills for these atoms:

| Atom | Level(s) Needed | Currently in drills.json? |
|------|-----------------|---------------------------|
| `ord(c) - ord('a')` | L1 (recognition) | ❌ No standalone drill |
| `[0]*26` | L1 (recognition) | ❌ No |
| char freq loop (`for c in word: freq[ord(c)-ord('a')] += 1`) | L2 (atom in context) | ❌ No |
| `tuple(freq)` | L1 or L2 | ❌ No |
| `defaultdict(list)` | L1 (recognition) | ✅ Exists ("defaultdict for grouping") but not tagged to Group Anagrams |
| `.values()` | L2 (in context) | ❌ No standalone drill |
| `list()` wrap | L2 (in context) | ❌ No standalone drill |
| L3 composition (freq → tuple → group) | L3 | ❌ No |
| L4 full `groupAnagrams` implementation | L4 | ❌ No (closest is L2 "Anagram grouping with defaultdict") |
| L5 variants (digit freq, vowels only, etc.) | L5 | ❌ No L5 drills exist |

**What exists that's adjacent:**
- L1 "defaultdict for grouping" — usable, needs tag update
- L2 "Anagram grouping with defaultdict" — has the `[0]*26` approach as an alternative, could be restructured
- Other drills share atoms (e.g., hash map drills use `defaultdict`, `Counter`)

**What needs to be authored:**
- ~7–10 new drills for the Group Anagrams L1–L4 chain
- Each needs: `prompt`, `expectedCode`, `alternatives[]`, `explanation` (with language-portable notes), `tags` (linking to "Group Anagrams" problem)
- L5 variants (Phase 3): 3+ drills with `testCases` field

---

### 8. Missing Infrastructure (Phase 2–4)

| Component | Phase | Files to Create/Modify |
|-----------|-------|----------------------|
| Session header bar component | 2 | New: `src/components/session-header.tsx` |
| Sound system (preload + play) | 2 | New: `src/lib/sounds.ts` + audio files in `public/sounds/` |
| Verdict CSS animations | 2 | Modify: `src/app/globals.css` (keyframes) + DrillCard |
| Session summary modal | 2 | New: `src/components/session-summary.tsx` |
| Onboarding tour | 2 | New: `src/components/drill-tour.tsx` |
| promptVariants schema + API | 3 | Modify: `schema.ts`, `GET /api/drills`, `seed-drills.ts` |
| testCases schema + seed | 3 | Modify: `schema.ts`, `seed-drills.ts`, drills.json |
| Pyodide worker | 3 | New: `public/workers/pyodide-worker.js` or `src/lib/pyodide.ts` |
| Problem → drill linking UI | 3 | Modify: `src/app/problems/[id]/page.tsx` |
| Time pressure mode | 4 | Modify: session header + DrillCard |

---

## Phase 1 Action Items (ordered)

1. **Author Group Anagrams atom chain content** — L1 through L4, ~8–10 drills in drills.json
2. **Replace Jaccard with recall-biased coverage** — one-line change in `checkCode()` in `drill-card.tsx`
3. **Add L1/L2 exact-match-only logic** — guard in `checkCode()` that skips token scoring for levels 1–2
4. **Build L1 MC mode** — new render path in DrillCard for level === 1
5. **Build partial credit retry flow** — second-attempt UI in DrillCard
6. **Add Ctrl+. / Ctrl+, navigation** — keyboard handler in dashboard drill session + sessionStorage draft

**Dependency:** Item 1 (content) is the single blocker. Items 2–6 are code changes that can start in parallel once the atom chain structure is known.
