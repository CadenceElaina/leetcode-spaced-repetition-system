# Aurora Drill System — Finalized Plan v2

> Date: April 13, 2026
> Status: **All decisions locked**
> Supersedes: `2026-04-12-syntax-drills.md` (original planning doc — kept for history)

---

## 1. Drill Levels (L1–L5)

| Level | Name | Mode | Example |
|-------|------|------|---------|
| **L1** | Atom recognition | MC by default, optional type-it via Tab | `ord(c) - ord('a')` |
| **L2** | Atom in context | Free-form textarea, one step of a real solution inside a scaffold | `for c in word: freq[...] += 1` |
| **L3** | Composition | Multi-atom, build the key mechanism, recall-biased token scoring | `freq=[0]*26 → tuple(freq)` |
| **L4** | Full solution | Complete implementation + language-agnostic "why" explanation | `groupAnagrams` full impl |
| **L5** | Apply to variant | Unseen problem, same atoms. Pyodide test-case execution or self-rated reveal | group by digit freq / vowels only |
| **Future** | Reverse drill | Given code → explain what it does and when to use it | conceptual layer |

### Language-portable explanations on every drill

Every explanation covers: (1) what the Python syntax does, (2) the underlying concept, (3) Java/C++ equivalent where meaningful. `defaultdict(list)` → "auto-init list values — Java: `computeIfAbsent`". Prevents Python-idiom dependency.

### Atom chain = the build unit

Every L4 problem maps to a set of atoms drillable at L1–L3. Atoms recur across problems — `ord(c)-ord('a')` appears in Group Anagrams, Ransom Note, Valid Anagram, and others. Content ROI compounds.

---

## 2. L1 Interaction Model — Decided

> **MC by default.** Tabbing to the textarea activates type-it mode. Both paths surface explanation + Next →.

### MC path (default)
User clicks an option → immediate green/red highlight → explanation appears below → Next → or auto-continue. No submit button. No keyboard shortcut needed for selection.

### Type-it path (opt-in via Tab)
Tab focuses the textarea. MC options dim but stay visible (reference only, no longer clickable). `Ctrl+Shift+Enter` or submit button checks the typed answer. Scored against expectedCode + alternatives via recall-biased token check.

### Navigation shortcuts
- `Ctrl+.` advance · `Ctrl+,` previous
- If textarea is dirty on advance: inline "discard and skip?" prompt (not a modal)
- Draft saved to sessionStorage keyed by drillId so `Ctrl+,` restores it

### Auto-continue toggle
Lives in the session header bar as a small toggleable "auto ▶" pill. Per-session preference, not global settings. Off by default — user must explicitly enable. When on: after correct MC click, advances after 800ms with a brief green flash.

---

## 3. Scoring — Recall-Biased Token Coverage — Decided

> **Replace Jaccard with recall-biased coverage.**
> `Score = matching_tokens / expected_tokens`. Doesn't punish extra tokens (variable name choices, preamble lines). Punishes missing expected tokens.

```
coverage = intersection(user_tokens, expected_tokens) / len(expected_tokens)
  ≥ 0.85 → correct    confidence 4
  ≥ 0.65 → partial    confidence 2 or 3 (see below)
  < 0.65 → incorrect  confidence 1
```

### Partial splits into confidence 2 vs 3
- Coverage 0.65–0.74 → confidence 2 (Hard)
- Coverage 0.75–0.84 → confidence 3 (Good)

### L1/L2 — exact match only, no fuzzy
Expressions are short. "Close but wrong" at L1 is almost always a wrong concept. Check exact normalized match against expectedCode + all alternatives. No token scoring at L1/L2.

### Alternatives list covers equivalent approaches
`ord(c) - 97` ≡ `ord(c) - ord('a')`. Seed alternatives for every drill at authoring time. Reasonable alternative = correct concept, different style. Not: different algorithm that happens to share tokens.

### Implementation change to checkCode
Replace `intersection.size / union.size` (Jaccard) with `intersection.size / expectedTokens.size`. Single line change to existing `checkCode` in DrillCard. Thresholds shift accordingly.

---

## 4. Partial Credit & Retry Flow

```
Submit → Score vs expected + alternatives → Below threshold
  → Wrong code shown read-only above → Fresh blank editor below → Resubmit
    → Correct/close → confidence 2
    → Wrong again → confidence 1, show solution
```

### Wrong code outside editor — forces fresh recall
Dimmed read-only panel above the fresh textarea. Label: "Your attempt" above the panel, "Write it from scratch" above the textarea. User cannot edit the wrong answer into a right one — must recall cold.

### Wrong again → show solution, move on
Don't loop. Two attempts max. Confidence 1 feeds SRS to reschedule quickly (1 day). Explanation is always shown after second wrong attempt. User can still advance.

---

## 5. L5 Checking — Pyodide or Self-Rated — Decided

> **No AI API for L5.** Primary path: Pyodide (CPython in browser via WASM) running test cases client-side. Free, zero latency after first load, tests actual correctness not similarity. Fallback: self-rated reveal.

### Pyodide approach
~10MB first load, caches after. Each L5 drill gets a `testCases: [{input, expected}]` field in the schema. User's function wrapped and executed in the Pyodide sandbox. Results: ≥4/5 pass → confidence 4, ≥3/5 → 3, ≥2/5 → 2, <2/5 → 1.

### Pyodide loading strategy — Decided
- User navigates to Drills → Pyodide starts downloading in a background worker (no blocking, no UI indicator)
- By the time they finish L1–L4, it's almost certainly loaded
- If somehow they reach L5 before it finishes, show a small "preparing Python runtime..." message
- Never blocks the drill session, never adds to initial page load

### Self-rated fallback (ship first if Pyodide deferred)
Show expected output + reference solution after submit. User clicks "Got it" / "Partially" / "Missed it" → maps to confidence 4/2/1. Zero complexity, ships immediately.

### Schema addition for L5
Add `testCases` array to `syntaxDrills` table. Nullable — only L5 drills have it. Existing L1–L4 drills unaffected.

---

## 6. Session Header Bar & UX Chrome — Decided

> **Persistent header above DrillCard.** All session-level state (progress, combo, mute, auto-continue) lives in a header bar. DrillCard stays stateless with respect to session.

```
●●●●○○○○ 4/8    🔥 3 in a row    auto ▶    🔊
```

### Progress display — dot pips
Filling dot pips (●●●●○○○○) showing position in session. "Daily Drill" = fixed 8. When all 8 complete, triggers session summary modal. Open practice = shows X/queue-size.

### Combo badge — appears after 4 consecutive correct
Small animated badge. "3 in a row" updates live. Resets on wrong or partial. Does not appear until streak ≥ 4.

### Session summary — modal overlay on session end
Triggered when drill 8 completes and user clicks Next →. Shows: correct / partial / wrong counts, streak. Each stat counts up on mount. "Done for today" closes, "Keep going" enters open practice mode. No XP system — raw counts + streak only.

---

## 7. Sounds & Animations — Decided

> **On by default.** First-visit tour surfaces the toggle.

| State | Sound | Animation |
|-------|-------|-----------|
| **Correct** | Ascending chime, short | Green flash + pop scale on ✓ (1→1.2→1, 200ms). Textarea border glows green 300ms |
| **Partial** | Neutral curious tone | Amber shimmer across verdict panel. Not punishing |
| **Wrong** | Descending sympathetic tone | Horizontal shake on textarea (3 shifts, 200ms total) |

### Streak milestone sound (5, 10, 25 in session)
Distinct celebratory sound — different from per-drill correct. Fires at combo milestones within a session.

### Pre-load all assets on mount
`new Audio('/sounds/correct.mp3')` etc. at component mount. `currentTime = 0` before each play call. Any perceptible lag kills the reward loop entirely.

### Opt-in time pressure for L1/L2 (future)
Optional 60s countdown gives bonus XP. Never forced. Ship after core loop is stable.

---

## 8. First-Visit Onboarding Tour — Decided

> Tour triggers when `localStorage.getItem('drills-onboarded')` is null. Closing the X without checking "got it" does not set the flag — reappears next visit. Only the primary CTA or "don't show again" checkbox sets the flag.

### Tour covers in one screen (no carousel)
Level system (L1–L5 briefly), sounds on by default with mute toggle shown, keyboard shortcuts (`Ctrl+Shift+Enter` submit · `Ctrl+.` next · `Ctrl+,` prev · Tab for type-it mode), Daily Drill (8 fixed) vs open practice.

### Mute toggle accessible from tour and always from session header
Tour highlights the mute button location. Users can toggle sounds in the tour itself before dismissing.

---

## 9. Drill → Problem → Mastery Loop

### Full loop
L1 recognition → L2 recall → L3 composition → L4 full solution → Problem attempt → (if stuck: targeted drill remediation → re-attempt) → (if solved: SRS credits + schedules review) → L5 variant → mastery

### Pattern → problem linking via tags
Every drill tagged with which problems use its atoms. Before attempting: "you haven't drilled monotonic stack yet." After failing: "you got stuck on deque usage — here's the L2 drill for that." Tags field already exists in schema.

### Anti-memorization via prompt rotation + interleaving
Each drill gets 3–4 prompt phrasings in a `promptVariants[]` field. Server picks randomly on load. Daily queue interleaves categories via SRS — no category batching within a session. L5 is the main anti-memorization layer at mastery level.

---

## 10. Content Strategy & Schema

### Build Group Anagrams atom chain first
Complete L1→L5 for one problem. Validates full pipeline before scaling. Atoms: `ord(c)-ord('a')`, `[0]*26`, char freq loop, `tuple(freq)`, `defaultdict(list)`, `.values()`, `list()` wrap. These atoms recur across 10+ problems.

### Schema additions needed
Add to `syntaxDrills`: `promptVariants text[]` (rotation phrasings), `testCases jsonb` (L5 Pyodide inputs/outputs). Existing fields sufficient for L1–L4. `tags[]` already present for problem linking.

### L5 variants — 3–5 per concept, built lazily
Don't block on content completeness. Ship L1–L4 first. Same-pattern/different-key, constraint variant, output variant, different-data-type variant. Each tagged back to the L4 it extends.

---

## 11. Build Order

### Phase 1 — Foundation (Ship-able Loop)

- [ ] Seed Group Anagrams L1–L4 atom chain in drills.json
  - Validate full drill → check → explanation → SRS pipeline with real content
- [ ] Replace Jaccard with recall-biased coverage in checkCode
  - `intersection.size / expected_tokens.size` · thresholds: 0.85/0.65
- [ ] L1 MC variant in DrillCard
  - Detect level === 1, render options from alternatives[]. Tab activates textarea type-it mode.
- [ ] Partial credit retry flow
  - Wrong code read-only panel above + fresh textarea below. Two attempts max.
- [ ] Ctrl+. / Ctrl+, navigation + dirty-state guard
  - sessionStorage draft save. Inline discard prompt (not modal) on dirty advance.

### Phase 2 — Session UX

- [ ] Session header bar
  - Progress pips + combo badge + auto-continue toggle + mute button
- [ ] Sound system — pre-load all assets on mount
  - correct / partial / wrong / streak-milestone. Mute → localStorage.
- [ ] Verdict animations
  - Green pop, amber shimmer, wrong shake. CSS @keyframes only.
- [ ] Session summary modal
  - Triggers after drill 8. Counting stat animation. Done / Keep going CTA.
- [ ] First-visit onboarding tour
  - localStorage flag. One screen. Covers levels, sounds, shortcuts. X without checkbox = reappears.

### Phase 3 — L5 + Anti-Memorization

- [ ] `promptVariants[]` schema addition + random server-side selection
  - 3–4 phrasings per drill. Prevents prompt-matching.
- [ ] L5 drill content — Group Anagrams variants (start with self-rated reveal)
  - 3 variants minimum. testCases field seeded. Upgrade to Pyodide in phase 4.
- [ ] Pyodide integration for L5 auto-grading
  - Lazy-load on first L5 drill. Pre-warm in background worker on drill mode entry. Run user code against testCases. Map pass rate to confidence 1–4.
- [ ] Problem → drill tag linking in UI
  - "Before you attempt this problem, drill these atoms" surface on problem page.

### Phase 4 — Scale

- [ ] Scale atom content to full NeetCode 150
  - Identify atoms per problem. Group Anagrams chain is the template.
- [ ] Opt-in time pressure mode for L1/L2
  - 60s countdown, bonus XP. Session header toggle. Never forced.

---

## 12. Closed Questions

| Question | Decision |
|----------|----------|
| Progress display: arc SVG or dot pips? | **Dot pips.** Simple, clear, easy to animate. Arc as polish upgrade later. |
| Combo threshold: 4 or 3? | **4.** Feels earned. Easy to lower later. |
| Session summary XP? | **No XP system.** Show correct/partial/wrong counts + streak. Plug in gamification later if wanted. |
| Pyodide loading: lazy or pre-load? | **Background pre-warm** on drill mode entry. Lazy indicator if L5 reached before ready. |
