# ADR: Curriculum-Aware New Problem Recommendation

**Date:** 2026-05-16
**Status:** Accepted

---

## Context

Aurora surfaces a review queue automatically (SRS-driven), but the "New" tab was a raw list of all 150 unAttempted problems with no guidance on which to tackle next. Users — especially beginners — face decision paralysis: the NeetCode 150 has a deliberate dependency order (hashing → two-pointer → sliding window → trees → ...), but nothing in the UI communicated that order or told users what to do when their review queue had room.

The question: how should Aurora recommend which new problem to attempt next?

## Decision

We implement a **curriculum-aware recommendation engine** (`computeNextRecommendation()` in `src/lib/curriculum.ts`) that follows the NeetCode 150 dependency graph. The engine produces a single recommended problem at any given moment and surfaces it as a featured card in the dashboard's Session view and at the top of the New tab.

New problems are only recommended when daily capacity allows — if the review queue already fills the session budget, the recommendation panel is suppressed.

## Curriculum Graph

The NeetCode 150 dependency graph is hardcoded as ordered layers. Within a layer, problems are sorted ascending by `leetcodeNumber` (matching NeetCode's in-category ordering).

```
Layer 0: Arrays & Hashing
         └─► Layer 1

Layer 1: [Two Pointers ↔ Stack]          ← fork: pick by attempt count
         └─► Layer 2 (when Layer 1 has progress)

Layer 2: [Binary Search ↔ Sliding Window ↔ Linked List]  ← fork: pick by attempt count
         All three must be substantially attempted before Layer 3 unlocks.

Layer 3: Trees
         └─► Layer 4

Layer 4: [Tries | Backtracking | Heap / Priority Queue]  ← fork: pick by attempt count
         └─► Layer 4b (follows chosen subtree branch)

Layer 4b:
  Backtracking track     → Graphs, then 1-D DP
  Heap/Priority Q track  → Intervals, then Greedy, then Advanced Graphs
  Tries track            → (leaf; joins Layer 5 after completion)

Layer 5: [2-D DP | Bit Manipulation | Math & Geometry]  ← fork: pick by attempt count
```

## Fork Resolution

At every fork point, the engine picks the branch where the user has the **most attempted problems**. Rationale: the user has already been working there — continuing is lower cognitive cost and respects their implicit choice.

**Tie-breaking:** When attempt counts are equal (including all-zero on first visit), the engine uses a stored random pick (`localStorage` key `aurora_fork_<layer>`, values are category names). This pick is set once and persists until the counts diverge. The random seed ensures the recommendation is stable across page loads.

**Switching:** The recommendation updates dynamically — if a user ignores the Two Pointers suggestion and attempts Stack problems directly, once Stack pulls ahead the recommendation follows Stack. There is no lock-in.

**Completion:** A category is "complete" when all non-deferred problems in it have been attempted at least once. Once complete, the fork skips to the competing branch.

## Layer Unlock Conditions

| Layer   | Unlocks when…                                                                 |
|---------|-------------------------------------------------------------------------------|
| Layer 1 | Layer 0 (Arrays & Hashing) has ≥ 1 attempt                                   |
| Layer 2 | Layer 1 (Two Pointers + Stack combined) has ≥ 3 attempts                      |
| Layer 3 | Layer 2 categories (BS + SW + LL) each have ≥ 1 attempt                      |
| Layer 4 | Layer 3 (Trees) has ≥ 1 attempt                                               |
| Layer 5 | Layer 4b subtree (e.g., Graphs + 1-D DP or Intervals + Greedy + Adv Graphs) each ≥ 1 attempt |

These thresholds are intentionally loose — the goal is forward momentum, not forcing completion of every problem before unlocking the next layer. FSRS handles revisiting weak categories via the review queue.

## Implementation

The engine lives in `src/lib/curriculum.ts` (pure computation, no DB calls):

```typescript
computeNextRecommendation({
  categoryStats,      // CategoryStat[] — attempted + total per category
  newProblems,        // NewProblem[]   — unAttempted problems with category + difficulty
  autoDeferHards,     // boolean        — exclude Hard problems from recommendation
  goalType,           // "blind75" | "neetcode150" | "none"
}): { problem: NewProblem; category: string; reason: string } | null
```

**Output fields:**
- `problem` — the specific next problem to attempt (first by `leetcodeNumber` in the active category)
- `category` — the active category name (e.g., `"Binary Search"`)
- `reason` — short human-readable label (e.g., `"Continue Two Pointers"`, `"Start Sliding Window"`)

The result is computed client-side in `dashboard-client.tsx` via `useMemo` and shown as a "Recommended" feature card.

## Dashboard Integration

The recommendation card appears:

1. **Session view** — above the review list when the daily session has remaining slots (i.e., `sessionActedOn < sessionSize` and review queue doesn't fill the session)
2. **New tab** — always pinned at the top, regardless of session state

The card shows: problem number + title + category + difficulty + a one-line reason string. "Skip" moves to the next problem in the same category (stored as `aurora_skipped_recommendation_<problemId>` in localStorage). Repeated skips move to the next category.

## Deferred Problems

If `autoDeferHards` is enabled, Hard problems are excluded from Layer 1 onwards. The engine treats a category as "complete" when all non-deferred problems are attempted.

If `goalType === "blind75"`, only Blind 75 problems are eligible for recommendation.

## Alternatives Considered

| Option | Outcome | Reason |
|---|---|---|
| **A. Recommend purely by retention gap** | Rejected | Already handled by SRS review queue. New problems need curriculum ordering, not decay-based priority. |
| **B. Enforce strict layer completion before unlock** | Rejected | Too rigid — a user who does 3 Arrays & Hashing and starts Trees early shouldn't be blocked; FSRS will catch up. Threshold-based unlock is forgiving. |
| **C. User-configurable curriculum path** | Deferred | Adds UI complexity before core value is proven. The NeetCode roadmap is the implicit contract of this product. |
| **D. AI-based recommendation** | Rejected | Latency, cost, non-determinism. The dependency graph is known; rule-based is more reliable and instant. |

## Consequences

- `src/lib/curriculum.ts` holds the curriculum DAG constants. If NeetCode updates their roadmap, this file needs updating.
- The fork choice stored in `localStorage` means two devices for the same user can diverge. Acceptable — the choice self-corrects once attempt counts diverge.
- Future: if a user asks "why this problem?", the `reason` field is the hook for explanations in the UI.
