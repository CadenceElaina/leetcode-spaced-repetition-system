// Pure computation — no DB calls, no fetch, no side effects.
// Caller (dashboard-client.tsx) manages localStorage for fork persistence.
// See docs/decisions/2026-05-16-curriculum-recommendation.md

import type { CategoryStat, NewProblem } from "./capacity";

export type ForkChoices = Record<string, string>;

export type CurriculumRecommendation = {
  problem: NewProblem;
  category: string;
  reason: string;
  /** New fork keys the caller should persist to localStorage. */
  newForkKeys: Record<string, string>;
};

/* ── Curriculum DAG constants (NeetCode 150 dependency graph) ── */

const A_HASH = "Arrays & Hashing";
const L1_FORK = ["Two Pointers", "Stack"] as const;
const L2_CATS = ["Binary Search", "Sliding Window", "Linked List"] as const;
const TREES = "Trees";
const L4_FORK = ["Tries", "Backtracking", "Heap / Priority Queue"] as const;

// Ordered sequence of categories to recommend within each L4 subtree.
const L4_SUBTREES: Record<string, readonly string[]> = {
  "Backtracking":          ["Graphs", "1-D Dynamic Programming"],
  "Heap / Priority Queue": ["Intervals", "Greedy", "Advanced Graphs"],
  "Tries":                 [],
};

const L5_FORK = ["2-D Dynamic Programming", "Bit Manipulation", "Math & Geometry"] as const;

/* ── Helpers ── */

/** Stable key for a fork point (order-independent). */
function forkKey(cats: readonly string[]): string {
  return [...cats].sort().join("|");
}

/**
 * Among `remaining` categories, pick the one with the most attempts.
 * On an all-zero tie, use `choices` for persistence or record a new random pick in `newKeys`.
 */
function pickFork(
  remaining: readonly string[],
  attempted: (c: string) => number,
  choices: ForkChoices,
  newKeys: Record<string, string>,
): string {
  const maxAtt = Math.max(...remaining.map(attempted));

  if (maxAtt === 0) {
    const key = forkKey(remaining);
    if (choices[key] && (remaining as string[]).includes(choices[key])) {
      return choices[key];
    }
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    newKeys[key] = pick;
    return pick;
  }

  // Pick the branch with the most attempts; stable tiebreak: alphabetical.
  return [...remaining]
    .filter(c => attempted(c) === maxAtt)
    .sort((a, b) => a.localeCompare(b))[0];
}

/* ── Main export ── */

export function computeNextRecommendation({
  categoryStats,
  newProblems,
  autoDeferHards,
  goalType,
  forkChoices = {},
}: {
  categoryStats: CategoryStat[];
  newProblems: NewProblem[];
  autoDeferHards: boolean;
  goalType: "blind75" | "neetcode150" | "none";
  forkChoices?: ForkChoices;
}): CurriculumRecommendation | null {
  const newForkKeys: Record<string, string> = {};
  const statMap = new Map(categoryStats.map(s => [s.category, s]));

  const eligible = [...newProblems]
    .filter(p => {
      if (autoDeferHards && p.difficulty === "Hard") return false;
      if (goalType === "blind75" && !p.blind75) return false;
      return true;
    })
    .sort((a, b) => (a.leetcodeNumber ?? 9999) - (b.leetcodeNumber ?? 9999));

  const attempted = (cat: string): number => statMap.get(cat)?.attempted ?? 0;
  const hasNew = (cat: string): boolean => eligible.some(p => p.category === cat);

  function firstIn(cat: string): CurriculumRecommendation {
    const problem = eligible.find(p => p.category === cat)!;
    const reason = attempted(cat) > 0 ? `Continue ${cat}` : `Start ${cat}`;
    return { problem, category: cat, reason, newForkKeys };
  }

  function pickAndFirst(cats: readonly string[]): CurriculumRecommendation | null {
    const remaining = cats.filter(hasNew);
    if (remaining.length === 0) return null;
    return firstIn(pickFork(remaining, attempted, forkChoices, newForkKeys));
  }

  /**
   * Determine the active L4 track by summing attempts across each track's
   * full subtree (L4 category + all subtree descendants). This prevents the
   * recommendation from switching tracks mid-subtree if the user happens to
   * accrue more Tries attempts than their chosen Backtracking track.
   */
  function activeL4Track(): string | null {
    const trackScores: { cat: string; score: number }[] = [
      {
        cat: "Backtracking",
        score: attempted("Backtracking") + attempted("Graphs") + attempted("1-D Dynamic Programming"),
      },
      {
        cat: "Heap / Priority Queue",
        score: attempted("Heap / Priority Queue") + attempted("Intervals") + attempted("Greedy") + attempted("Advanced Graphs"),
      },
      { cat: "Tries", score: attempted("Tries") },
    ];

    const maxScore = Math.max(...trackScores.map(t => t.score));

    if (maxScore === 0) {
      // No L4 activity yet — use fork logic over whichever have new problems.
      const remaining = L4_FORK.filter(hasNew);
      if (remaining.length === 0) return null;
      return pickFork(remaining, attempted, forkChoices, newForkKeys);
    }

    return trackScores
      .filter(t => t.score === maxScore)
      .sort((a, b) => a.cat.localeCompare(b.cat))[0].cat;
  }

  // ── Layer 0: Arrays & Hashing ──────────────────────────────────────────────
  if (hasNew(A_HASH)) return firstIn(A_HASH);
  if (attempted(A_HASH) === 0) return null;

  // ── Layer 1: Two Pointers | Stack ──────────────────────────────────────────
  const l1 = pickAndFirst(L1_FORK);
  if (l1) return l1;

  // Layer 2 unlock: ≥3 combined Layer 1 attempts
  if (L1_FORK.reduce((s, c) => s + attempted(c), 0) < 3) return null;

  // ── Layer 2: Binary Search | Sliding Window | Linked List ──────────────────
  // All three must be substantially attempted before Trees unlocks.
  const l2 = pickAndFirst(L2_CATS);
  if (l2) return l2;

  // Layer 3 unlock: every Layer 2 category has ≥1 attempt
  if (!L2_CATS.every(c => attempted(c) >= 1)) return null;

  // ── Layer 3: Trees ─────────────────────────────────────────────────────────
  if (hasNew(TREES)) return firstIn(TREES);
  if (attempted(TREES) === 0) return null;

  // ── Layer 4: Tries | Backtracking | Heap/Priority Queue (subtree-aware) ────
  const track = activeL4Track();
  if (!track) return null;

  if (hasNew(track)) return firstIn(track);

  // Follow the subtree in sequence; stop if a category has zero attempts
  // (don't skip ahead before the user has started it).
  for (const cat of L4_SUBTREES[track] ?? []) {
    if (hasNew(cat)) return firstIn(cat);
    if (attempted(cat) === 0) return null;
  }

  // ── Layer 5: 2-D DP | Bit Manipulation | Math & Geometry ──────────────────
  return pickAndFirst(L5_FORK);
}
