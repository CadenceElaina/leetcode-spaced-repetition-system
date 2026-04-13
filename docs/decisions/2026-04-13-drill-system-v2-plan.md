# Aurora Drill System — Finalized Plan v2

> Date: April 13, 2026
> Status: **Phase 1 + 2 complete. Phase 3 in progress.**
> Supersedes: `2026-04-12-syntax-drills.md` (original planning doc — kept for history)

---

## 1. Drill Levels (L1–L5)

| Level | Name | Mode | Example |
|-------|------|------|---------|
| **L1** | Atom recall | Editor (same as all levels) | `ord(c) - ord('a')` |
| **L2** | Atom in context | Editor, one step of a real solution inside a scaffold | `for c in word: freq[...] += 1` |
| **L3** | Composition | Multi-atom, build the key mechanism, recall-biased token scoring | `freq=[0]*26 → tuple(freq)` |
| **L4** | Full solution | Complete implementation + language-agnostic "why" explanation | `groupAnagrams` full impl |
| **L5** | Apply to variant | Unseen problem, same atoms. Pyodide test-case execution or self-rated reveal | group by digit freq / vowels only |
| **Future** | Reverse drill | Given code → explain what it does and when to use it | conceptual layer |

**Design decision (April 2026):** All levels use the CodeEditor (CodeMirror + Python syntax highlighting). MC selection was removed — retrieval practice (typing from memory) is strictly more effective than recognition. The `distractors` field on drill records is kept in the data model for potential future use but no longer drives any UI.

### Language-portable explanations on every drill

Every explanation covers: (1) what the Python syntax does, (2) the underlying concept, (3) Java/C++ equivalent where meaningful. `defaultdict(list)` → "auto-init list values — Java: `computeIfAbsent`". Prevents Python-idiom dependency.

### Atom chain = the build unit

Every L4 problem maps to a set of atoms drillable at L1–L3. Atoms recur across problems — `ord(c)-ord('a')` appears in Group Anagrams, Ransom Note, Valid Anagram, and others. Content ROI compounds.

---

## 2. Interaction Model (All Levels)

> **Editor-first.** All levels render a CodeMirror editor. No MC mode.

- `Ctrl+Shift+Enter` or submit button checks the typed answer
- `Ctrl+.` advance (or skip with inline discard prompt if editor is dirty)
- `Ctrl+,` previous drill
- Draft saved to `sessionStorage` keyed by `drill-${id}` — restores on Ctrl+,
- Auto-continue toggle in session header: off by default. When on, advances 800ms after a correct result.

---

## 3. Scoring — Recall-Biased Token Coverage

> `Score = matching_tokens / expected_tokens`. Doesn't punish extra tokens. Punishes missing expected tokens.

```
coverage = intersection(user_tokens, expected_tokens) / len(expected_tokens)
  ≥ 0.85 → correct    confidence 4
  0.75–0.84 → good    confidence 3
  0.65–0.74 → hard    confidence 2
  < 0.65  → incorrect  confidence 1
```

### L1/L2 — exact match only, no fuzzy

Expressions are short. "Close but wrong" at L1 is almost always a wrong concept. Exact normalized match against `expectedCode` + all `alternatives`. No token scoring at L1/L2.

### Alternatives list covers equivalent approaches

`ord(c) - 97` ≡ `ord(c) - ord('a')`. Alternatives field seeded at authoring time.

---

## 4. Partial Credit & Retry Flow

```
Submit → Score → Below threshold
  → Verdict banner (close/incorrect)
  → If INCORRECT: show expected answer immediately (user was lost, needs anchor)
  → If CLOSE: hide expected (user almost had it, force recall)
  → Dimmed first attempt above → Fresh editor below → Resubmit
    → Correct/close → confidence capped at 2
    → Wrong again → confidence 1
```

Two attempts max. Explanation always shown in result phase.

---

## 5. L5 Checking — Pyodide or Self-Rated

> **No AI API for L5.** Primary: Pyodide (CPython in WASM) running test cases client-side. Fallback: self-rated reveal.

- Pyodide pre-warms in a background worker when user enters drill mode
- If L5 reached before Pyodide ready: show self-rate flow
- Pass rate → confidence: ≥4/5 → 4, ≥3/5 → 3, ≥2/5 → 2, <2/5 → 1

---

## 6. Session Header Bar

```
‹ prev   Daily Drill  ●●●●○○○○   3/5 correct   🔥 5 in a row   auto ▶   🔊   Exit
```

- `‹ prev` button — dimmed/disabled on drill 1
- Dot pips — filled accent = completed, accent = current, border = upcoming
- Score — `N/M correct` (green N) — appears after first drill scored
- Combo badge — appears only at streak ≥ 4
- Auto-continue toggle — pill, off by default
- Mute button — emoji, persists in `localStorage`

---

## 7. Sounds — Web Audio API Synthesis

> **No static files.** All sounds synthesized via Web Audio API. `sounds.ts` exports `playSound(name, muted)` — async, awaits `ctx.resume()` before scheduling oscillators (critical for gesture-gated AudioContext).

| State | Sound |
|-------|-------|
| Correct | Ascending two-tone chime (C5 → E5) |
| Partial | Single neutral tone (A4) |
| Wrong | Descending two-tone (G4 → E4) |
| Milestone (5/10/25 combo) | Three-tone fanfare (C5 → E5 → G5) |

---

## 8. Animations

Defined as CSS `@keyframes` in `globals.css`, applied as single-shot class strings via state (cleared after duration to allow re-trigger):

| Trigger | Class | Effect |
|---------|-------|--------|
| Correct result | `drill-anim-correct-glow` | Green border glow on verdict banner |
| Correct icon | `drill-anim-correct-pop` | Scale 1→1.2→1 on ✓ |
| Close result | `drill-anim-partial` | Amber shimmer on verdict banner |
| Wrong result | `drill-anim-wrong-shake` | Horizontal shake on editor wrapper div |

---

## 9. Syntax Reference Panel

Right column when Drills tab is active has a two-way toggle (persisted in `localStorage` as `aurora-right-panel`):

- **Fluency Stats** — existing FluencyPanel with tier, category bars, weakest/strongest
- **Syntax Ref** — searchable quick-reference panel

### Syntax Ref design

- Search bar (name + summary)
- Category filter pills
- Each entry: name, category badge, one-line summary → click to expand
- Expanded: syntax (read-only CodeEditor), variants list, minimal example (read-only CodeEditor), scratch pad (editable CodeEditor)
- Target: ~80–100 entries covering all patterns in NeetCode 150
- Accessible during L1–L4 drill sessions; availability during L5/capstone TBD (user preference)

### Component

`src/components/syntax-reference-panel.tsx` — `SYNTAX_ENTRIES: SyntaxEntry[]` content array is the only thing that needs filling out. See agent 2 handoff for content spec.

---

## 10. Onboarding Tour

`src/components/drill-tour.tsx` — triggers when `localStorage.getItem('drills-onboarded') === null`. X without checkbox = reappears. "Got it" or checkbox = sets flag. Covers: 5 levels, shortcuts, session types, sounds toggle.

---

## 11. Drill → Problem → Mastery Loop

L1 recall → L2 recall in context → L3 composition → L4 full → Problem attempt → (if stuck: drill remediation) → (if solved: SRS credits) → L5 variant → mastery

Pattern → problem linking via tags (Phase 3): every drill tagged with which problems use its atoms.

---

## 12. Content Strategy

117 drills seeded across 18 NeetCode 150 categories (L1–L4). Group Anagrams has a complete L1–L4 atom chain. Remaining categories need depth (more L1/L2 atoms per category).

Anti-memorization via `promptVariants[]` field (Phase 3): 3–4 phrasings per drill. Server picks randomly on load.

---

## 13. Build Order

### Phase 1 — Foundation ✅
- [x] Recall-biased coverage scoring in `checkCode`
- [x] L1/L2 exact-match-only logic
- [x] Partial credit retry flow (two attempts, dimmed first attempt)
- [x] `Ctrl+.` / `Ctrl+,` navigation + dirty-state guard + sessionStorage draft
- [x] Group Anagrams L1–L4 atom chain content (117 drills total)

### Phase 2 — Session UX ✅
- [x] Session header bar (progress pips, combo badge, score, back button, auto-continue, mute)
- [x] Sound system (Web Audio API synthesis — no static files)
- [x] Verdict animations (CSS keyframes)
- [x] Session summary modal (counting animation, Done / Keep going)
- [x] First-visit onboarding tour
- [x] CodeEditor (CodeMirror) replacing plain textarea
- [x] Editor-first design (MC removed)
- [x] Retry phase shows expected code when verdict is "incorrect"
- [x] Syntax reference panel toggle (stats ↔ syntax ref)

### Phase 3 — L5 + Content + Syntax Panel
- [ ] `SyntaxReferencePanel` full content (~80–100 entries) — see agent 2 handoff
- [ ] Run button in CodeEditor via Pyodide (general execution, not just L5 test grading)
- [ ] Syntax panel accessibility control (available L1–L4, user-toggleable for L5)
- [ ] `promptVariants[]` schema addition + random server-side selection
- [ ] L5 drill content — Group Anagrams variants (3+ with `testCases`)
- [ ] Problem → drill tag linking in UI

### Phase 4 — Scale
- [ ] Scale atom content to full NeetCode 150 (audit depth per category)
- [ ] Opt-in time pressure mode for L1/L2

---

## 14. Closed Questions

| Question | Decision |
|----------|----------|
| Progress display | Dot pips |
| Combo threshold | 4 |
| Session summary XP | No XP — raw counts + streak |
| Pyodide loading | Background pre-warm on drill mode entry |
| MC for L1 | Removed — editor-first all levels |
| Sound system | Web Audio API synthesis, no static files |
| Right panel | Toggle: Fluency Stats ↔ Syntax Ref (localStorage persisted) |
| Retry: show answer? | Incorrect verdict → show expected; Close verdict → hide (force recall) |
