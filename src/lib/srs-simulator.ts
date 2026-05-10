/**
 * SRS backtest engine — replay historical attempts through an alternate multiplier
 * table and compare resulting stabilities and calibration against the actual formula.
 *
 * Pure computation only — no DB, no fetch, no side effects.
 */

import {
  BASE_MULTIPLIERS,
  INITIAL_STABILITY_BASE,
  MIN_STABILITY,
  MAX_STABILITY,
  computeModifier,
  computeRetrievability,
  type AttemptSignals,
} from "@/lib/srs";

/* ── Input types ── */

export interface BacktestAttemptInput {
  userId: string;
  problemId: number;
  difficulty: "Easy" | "Medium" | "Hard";
  solvedIndependently: "YES" | "PARTIAL" | "NO";
  solutionQuality: "OPTIMAL" | "SUBOPTIMAL" | "BRUTE_FORCE" | "NONE";
  rewroteFromScratch: "YES" | "NO" | "DID_NOT_ATTEMPT" | null;
  confidence: number;
  solveTimeMinutes: number | null;
  predictedR: number | null; // stored value at review time (null on first attempt)
  createdAt: Date;
}

/* ── Output types ── */

export interface BacktestProblemResult {
  userId: string;
  problemId: number;
  problemTitle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  attemptCount: number;
  actualFinalStability: number;
  simulatedFinalStability: number;
  delta: number; // simulated - actual (positive = sim produces higher stability)
}

export interface BacktestResult {
  perProblem: BacktestProblemResult[];
  summary: {
    totalProblems: number;
    avgDelta: number;
    higherCount: number;
    lowerCount: number;
    noChangeCount: number;
  };
  calibration: {
    actualMAE: number | null;
    simulatedMAE: number | null;
    reviewCount: number;
  };
}

/* ── Internal helpers ── */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / MS_PER_DAY;
}

function outcomeValue(outcome: "YES" | "PARTIAL" | "NO"): number {
  if (outcome === "YES") return 1.0;
  if (outcome === "PARTIAL") return 0.5;
  return 0.0;
}

function toSignals(a: BacktestAttemptInput): AttemptSignals {
  return {
    solvedIndependently: a.solvedIndependently,
    solutionQuality: a.solutionQuality,
    rewroteFromScratch: a.rewroteFromScratch,
    confidence: a.confidence,
    solveTimeMinutes: a.solveTimeMinutes,
    difficulty: a.difficulty,
  };
}

function computeStabilityWithTable(
  prior: number | null,
  signals: AttemptSignals,
  table: Record<string, number>,
): number {
  const key = `${signals.solvedIndependently}:${signals.solutionQuality}`;
  const base = table[key] ?? 1.0;
  const modifier = computeModifier(signals);
  const effective = base + modifier;
  const raw = prior === null
    ? INITIAL_STABILITY_BASE * effective
    : prior * effective;
  return Math.max(MIN_STABILITY, Math.min(MAX_STABILITY, raw));
}

/* ── Main export ── */

/**
 * Replays every user's attempt history under both the current formula and an
 * override table, returning per-problem stability deltas and a MAE comparison.
 *
 * @param attempts   All attempts across all users, any order (sorted internally).
 * @param overrides  Partial multiplier table — merged on top of BASE_MULTIPLIERS.
 * @param problemMeta  Optional map from problemId → { title, difficulty } for display.
 */
export function runBacktest(
  attempts: BacktestAttemptInput[],
  overrides: Record<string, number>,
  problemMeta: Map<number, { title: string; difficulty: "Easy" | "Medium" | "Hard" }> = new Map(),
): BacktestResult {
  const mergedTable = { ...BASE_MULTIPLIERS, ...overrides };

  // Group by (userId, problemId), then sort each group by date
  const groups = new Map<string, BacktestAttemptInput[]>();
  for (const a of attempts) {
    const key = `${a.userId}::${a.problemId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(a);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const perProblem: BacktestProblemResult[] = [];
  let actualAbsErrors: number[] = [];
  let simAbsErrors: number[] = [];

  for (const [, group] of groups) {
    let actualStability: number | null = null;
    let simStability: number | null = null;

    for (let i = 0; i < group.length; i++) {
      const a = group[i];
      const signals = toSignals(a);

      if (i === 0) {
        // First attempt — initialise stabilities
        actualStability = computeStabilityWithTable(null, signals, BASE_MULTIPLIERS);
        simStability    = computeStabilityWithTable(null, signals, mergedTable);
      } else {
        const prev = group[i - 1];
        const daysSince = daysBetween(prev.createdAt, a.createdAt);
        const actVal = outcomeValue(a.solvedIndependently);

        // Calibration: actual formula (uses stored predictedR if available)
        if (a.predictedR !== null) {
          actualAbsErrors.push(Math.abs(a.predictedR - actVal));
        }

        // Calibration: simulated formula (always computable from prior sim stability)
        const simPredicted = computeRetrievability(simStability!, daysSince);
        simAbsErrors.push(Math.abs(simPredicted - actVal));

        actualStability = computeStabilityWithTable(actualStability, signals, BASE_MULTIPLIERS);
        simStability    = computeStabilityWithTable(simStability,    signals, mergedTable);
      }
    }

    if (actualStability === null || simStability === null) continue;

    const meta = problemMeta.get(group[0].problemId);
    perProblem.push({
      userId:                  group[0].userId,
      problemId:               group[0].problemId,
      problemTitle:            meta?.title ?? `Problem ${group[0].problemId}`,
      difficulty:              meta?.difficulty ?? group[0].difficulty,
      attemptCount:            group.length,
      actualFinalStability:    actualStability,
      simulatedFinalStability: simStability,
      delta:                   simStability - actualStability,
    });
  }

  // Summary
  const THRESHOLD = 0.05; // < 5% difference = "no change"
  let higherCount = 0, lowerCount = 0, noChangeCount = 0;
  let deltaSum = 0;
  for (const r of perProblem) {
    deltaSum += r.delta;
    const pct = Math.abs(r.delta) / Math.max(r.actualFinalStability, 0.01);
    if (pct < THRESHOLD) {
      noChangeCount++;
    } else if (r.delta > 0) {
      higherCount++;
    } else {
      lowerCount++;
    }
  }

  const mean = (xs: number[]) => xs.length > 0 ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

  return {
    perProblem: perProblem.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    summary: {
      totalProblems: perProblem.length,
      avgDelta:      perProblem.length > 0 ? deltaSum / perProblem.length : 0,
      higherCount,
      lowerCount,
      noChangeCount,
    },
    calibration: {
      actualMAE:    mean(actualAbsErrors),
      simulatedMAE: mean(simAbsErrors),
      reviewCount:  simAbsErrors.length,
    },
  };
}
