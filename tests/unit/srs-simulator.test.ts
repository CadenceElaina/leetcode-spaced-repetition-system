import { describe, it, expect } from "vitest";
import { runBacktest, type BacktestAttemptInput } from "@/lib/srs-simulator";
import { BASE_MULTIPLIERS, computeInitialStability, computeNewStability } from "@/lib/srs";

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;

function makeAttempt(
  overrides: Partial<BacktestAttemptInput> & {
    userId?: string;
    problemId?: number;
    createdAtOffset?: number; // days from epoch
  } = {},
): BacktestAttemptInput {
  const { createdAtOffset = 0, ...rest } = overrides;
  return {
    userId:              "user-1",
    problemId:           1,
    difficulty:          "Medium",
    solvedIndependently: "YES",
    solutionQuality:     "OPTIMAL",
    rewroteFromScratch:  null,
    confidence:          3,
    solveTimeMinutes:    15,
    predictedR:          null,
    createdAt:           new Date(createdAtOffset * DAY),
    ...rest,
  };
}

// ── runBacktest ───────────────────────────────────────────────────────────────

describe("runBacktest", () => {
  it("returns empty result for empty input", () => {
    const r = runBacktest([], {});
    expect(r.perProblem).toHaveLength(0);
    expect(r.summary.totalProblems).toBe(0);
    expect(r.summary.avgDelta).toBe(0);
    expect(r.calibration.reviewCount).toBe(0);
  });

  it("first-attempt stability matches computeInitialStability with no overrides", () => {
    const a = makeAttempt({ createdAtOffset: 0 });
    const r = runBacktest([a], {});
    const expected = computeInitialStability({
      solvedIndependently: a.solvedIndependently,
      solutionQuality:     a.solutionQuality,
      rewroteFromScratch:  a.rewroteFromScratch,
      confidence:          a.confidence,
      solveTimeMinutes:    a.solveTimeMinutes,
      difficulty:          a.difficulty,
    });
    expect(r.perProblem[0].actualFinalStability).toBeCloseTo(expected, 5);
    expect(r.perProblem[0].simulatedFinalStability).toBeCloseTo(expected, 5);
    expect(r.perProblem[0].delta).toBeCloseTo(0, 5);
  });

  it("two attempts: second attempt updates stability; no override → delta 0", () => {
    const a0 = makeAttempt({ createdAtOffset: 0 });
    const a1 = makeAttempt({ createdAtOffset: 5 });
    const r = runBacktest([a0, a1], {});
    // Both formulas are identical → delta must be 0
    expect(r.perProblem[0].delta).toBeCloseTo(0, 5);
    // Stability should be higher than initial after second YES:OPTIMAL attempt
    expect(r.perProblem[0].actualFinalStability).toBeGreaterThan(
      computeInitialStability({ solvedIndependently: "YES", solutionQuality: "OPTIMAL", rewroteFromScratch: null, confidence: 3, solveTimeMinutes: 15, difficulty: "Medium" }),
    );
  });

  it("override that raises a multiplier produces higher simulated stability", () => {
    const a0 = makeAttempt({ createdAtOffset: 0 });
    const a1 = makeAttempt({ createdAtOffset: 10 });
    const r = runBacktest([a0, a1], { "YES:OPTIMAL": 4.0 }); // raised from 2.5
    expect(r.perProblem[0].simulatedFinalStability).toBeGreaterThan(
      r.perProblem[0].actualFinalStability,
    );
    expect(r.perProblem[0].delta).toBeGreaterThan(0);
    expect(r.summary.higherCount).toBe(1);
    expect(r.summary.lowerCount).toBe(0);
  });

  it("override that lowers a multiplier produces lower simulated stability", () => {
    const a0 = makeAttempt({ createdAtOffset: 0 });
    const a1 = makeAttempt({ createdAtOffset: 10 });
    const r = runBacktest([a0, a1], { "YES:OPTIMAL": 1.0 }); // lowered from 2.5
    expect(r.perProblem[0].simulatedFinalStability).toBeLessThan(
      r.perProblem[0].actualFinalStability,
    );
    expect(r.perProblem[0].delta).toBeLessThan(0);
    expect(r.summary.lowerCount).toBe(1);
  });

  it("groups by (userId, problemId) — different users produce separate result rows", () => {
    const u1 = makeAttempt({ userId: "user-1", problemId: 1, createdAtOffset: 0 });
    const u2 = makeAttempt({ userId: "user-2", problemId: 1, createdAtOffset: 0 });
    const r = runBacktest([u1, u2], {});
    expect(r.perProblem).toHaveLength(2);
    expect(r.summary.totalProblems).toBe(2);
  });

  it("groups by (userId, problemId) — same user, different problems produce separate rows", () => {
    const p1 = makeAttempt({ problemId: 1, createdAtOffset: 0 });
    const p2 = makeAttempt({ problemId: 2, createdAtOffset: 0 });
    const r = runBacktest([p1, p2], {});
    expect(r.perProblem).toHaveLength(2);
  });

  it("calibration: reviewCount equals number of non-first attempts in the sequence", () => {
    // 3 attempts = 2 reviews (second and third have preceding stabilities)
    const attempts = [
      makeAttempt({ createdAtOffset: 0 }),
      makeAttempt({ createdAtOffset: 5 }),
      makeAttempt({ createdAtOffset: 12 }),
    ];
    const r = runBacktest(attempts, {});
    expect(r.calibration.reviewCount).toBe(2);
  });

  it("calibration: actualMAE uses stored predictedR values", () => {
    // First attempt: no predictedR (null) — should not contribute to actual MAE
    // Second attempt: predictedR = 0.9, outcome = YES (actual value 1.0) → |error| = 0.1
    const a0 = makeAttempt({ predictedR: null, createdAtOffset: 0 });
    const a1 = makeAttempt({ predictedR: 0.9, createdAtOffset: 10 });
    const r = runBacktest([a0, a1], {});
    expect(r.calibration.actualMAE).toBeCloseTo(0.1, 5);
  });

  it("calibration: actualMAE is null when no attempts have stored predictedR", () => {
    // 2 attempts, neither has predictedR
    const a0 = makeAttempt({ predictedR: null, createdAtOffset: 0 });
    const a1 = makeAttempt({ predictedR: null, createdAtOffset: 5 });
    const r = runBacktest([a0, a1], {});
    expect(r.calibration.actualMAE).toBeNull();
    // simulated MAE is always computed
    expect(r.calibration.simulatedMAE).not.toBeNull();
  });

  it("noChangeCount: problems within 5% relative delta are counted as no change", () => {
    // With no overrides, actual === simulated → all are noChange
    const a0 = makeAttempt({ createdAtOffset: 0 });
    const a1 = makeAttempt({ createdAtOffset: 7 });
    const r = runBacktest([a0, a1], {});
    expect(r.summary.noChangeCount).toBe(1);
    expect(r.summary.higherCount).toBe(0);
    expect(r.summary.lowerCount).toBe(0);
  });

  it("results are sorted by absolute delta descending", () => {
    // Problem 1: big multiplier change → large delta
    // Problem 2: key not triggered by default attempt → delta near 0
    const big = [
      makeAttempt({ problemId: 1, createdAtOffset: 0 }),
      makeAttempt({ problemId: 1, createdAtOffset: 10 }),
    ];
    const small = [makeAttempt({ problemId: 2, createdAtOffset: 0 })];
    const r = runBacktest([...big, ...small], { "YES:OPTIMAL": 5.0 });
    // problem 1 has 2 attempts with large delta; problem 2 only 1 attempt (initial only)
    expect(Math.abs(r.perProblem[0].delta)).toBeGreaterThanOrEqual(
      Math.abs(r.perProblem[r.perProblem.length - 1].delta),
    );
  });

  it("problemMeta is used when provided", () => {
    const a = makeAttempt({ problemId: 42, createdAtOffset: 0 });
    const meta = new Map([[42, { title: "Two Sum", difficulty: "Easy" as const }]]);
    const r = runBacktest([a], {}, meta);
    expect(r.perProblem[0].problemTitle).toBe("Two Sum");
    expect(r.perProblem[0].difficulty).toBe("Easy");
  });

  it("falls back to default title and difficulty when problemMeta is absent", () => {
    const a = makeAttempt({ problemId: 99, createdAtOffset: 0 });
    const r = runBacktest([a], {});
    expect(r.perProblem[0].problemTitle).toBe("Problem 99");
    expect(r.perProblem[0].difficulty).toBe("Medium"); // from the attempt input
  });

  it("avgDelta matches manual average of individual deltas", () => {
    const p1a = [makeAttempt({ problemId: 1, createdAtOffset: 0 }), makeAttempt({ problemId: 1, createdAtOffset: 5 })];
    const p2a = [makeAttempt({ problemId: 2, createdAtOffset: 0 }), makeAttempt({ problemId: 2, createdAtOffset: 8 })];
    const r = runBacktest([...p1a, ...p2a], { "YES:OPTIMAL": 3.5 });
    const manualAvg = r.perProblem.reduce((s, p) => s + p.delta, 0) / r.perProblem.length;
    expect(r.summary.avgDelta).toBeCloseTo(manualAvg, 5);
  });

  it("stability is clamped to MAX_STABILITY under extreme override", () => {
    const attempts = Array.from({ length: 3 }, (_, i) =>
      makeAttempt({ createdAtOffset: i * 5 }),
    );
    const r = runBacktest(attempts, { "YES:OPTIMAL": 1000 });
    expect(r.perProblem[0].simulatedFinalStability).toBeLessThanOrEqual(365);
  });

  it("stability is clamped to MIN_STABILITY for a NO:NONE sequence", () => {
    const attempts = [
      makeAttempt({ solvedIndependently: "NO", solutionQuality: "NONE", createdAtOffset: 0 }),
      makeAttempt({ solvedIndependently: "NO", solutionQuality: "NONE", createdAtOffset: 3 }),
    ];
    const r = runBacktest(attempts, {});
    expect(r.perProblem[0].actualFinalStability).toBeGreaterThanOrEqual(0.5);
    expect(r.perProblem[0].simulatedFinalStability).toBeGreaterThanOrEqual(0.5);
  });
});
