import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { attempts, userProblemStates, problems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  computeLearningVelocity,
  detectStuckProblems,
  computeMetacognitionGap,
  computeReviewCompliance,
  computeCategoryStats,
  computeModelCalibration,
  type AttemptRecord,
  type StateRecord,
  type ReviewPoint,
} from "@/lib/analytics";
import { computeReadiness, MASTERY_THRESHOLD } from "@/lib/srs";
import { InsightsClient } from "./insights-client";
import { DEMO_INSIGHTS_DATA } from "./demo-data";
import type { StuckProblemDisplay } from "./demo-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Insights — Aurora" };

export default async function InsightsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <Suspense>
        <InsightsClient data={DEMO_INSIGHTS_DATA} isDemo />
      </Suspense>
    );
  }

  const userId = session.user.id;
  const now = new Date();

  const [rawAttempts, rawStates, allProblems] = await Promise.all([
    db
      .select({
        problemId:              attempts.problemId,
        category:               problems.category,
        difficulty:             problems.difficulty,
        outcome:                attempts.solvedIndependently,
        quality:                attempts.solutionQuality,
        confidence:             attempts.confidence,
        solveTimeMinutes:       attempts.solveTimeMinutes,
        rewroteFromScratch:     attempts.rewroteFromScratch,
        timeComplexityCorrect:  attempts.timeComplexityCorrect,
        spaceComplexityCorrect: attempts.spaceComplexityCorrect,
        predictedR:             attempts.predictedR,
        createdAt:              attempts.createdAt,
      })
      .from(attempts)
      .innerJoin(problems, eq(attempts.problemId, problems.id))
      .where(eq(attempts.userId, userId))
      .orderBy(asc(attempts.createdAt)),
    db
      .select({
        problemId:           userProblemStates.problemId,
        stability:           userProblemStates.stability,
        lastReviewedAt:      userProblemStates.lastReviewedAt,
        nextReviewAt:        userProblemStates.nextReviewAt,
        totalAttempts:       userProblemStates.totalAttempts,
        bestSolutionQuality: userProblemStates.bestSolutionQuality,
      })
      .from(userProblemStates)
      .where(eq(userProblemStates.userId, userId)),
    db.select({ id: problems.id, title: problems.title, difficulty: problems.difficulty }).from(problems),
  ]);

  const attemptRecords: AttemptRecord[] = rawAttempts.map((a) => ({
    problemId:              a.problemId,
    category:               a.category,
    difficulty:             a.difficulty,
    outcome:                a.outcome,
    quality:                a.quality,
    confidence:             a.confidence,
    solveTimeMinutes:       a.solveTimeMinutes,
    rewroteFromScratch:     a.rewroteFromScratch,
    timeComplexityCorrect:  a.timeComplexityCorrect,
    spaceComplexityCorrect: a.spaceComplexityCorrect,
    predictedR:             a.predictedR,
    createdAt:              a.createdAt,
  }));

  const stateRecords: StateRecord[] = rawStates.map((s) => ({
    problemId:           s.problemId,
    stability:           s.stability,
    lastReviewedAt:      s.lastReviewedAt,
    nextReviewAt:        s.nextReviewAt,
    totalAttempts:       s.totalAttempts,
    bestSolutionQuality: s.bestSolutionQuality,
  }));

  const problemMap = new Map(allProblems.map((p) => [p.id, p]));

  const velocity    = computeLearningVelocity(attemptRecords, 14, now);
  const compliance  = computeReviewCompliance(stateRecords, 14, now);
  const metacog     = computeMetacognitionGap(attemptRecords);
  const catStats    = computeCategoryStats(attemptRecords, stateRecords, now);
  const rawStuck    = detectStuckProblems(stateRecords, attemptRecords, 4, now);

  // Model calibration: compare predictedR (at review time) against actual outcome.
  // Only reviews with a prior attempt have predictedR; first-ever attempts are null.
  const reviewPoints: ReviewPoint[] = rawAttempts
    .filter((a) => a.predictedR !== null)
    .map((a) => ({
      predictedR: a.predictedR!,
      outcome: a.outcome,
    }));
  const calibrationN = reviewPoints.length;
  const calibrationMAE = calibrationN >= 20
    ? reviewPoints.reduce((s, p) => {
        const actual = p.outcome === "YES" ? 1.0 : p.outcome === "PARTIAL" ? 0.5 : 0.0;
        return s + Math.abs(p.predictedR - actual);
      }, 0) / calibrationN
    : null;
  const { buckets: calibrationBuckets } = computeModelCalibration(reviewPoints);

  const stuckProblems: StuckProblemDisplay[] = rawStuck.map((s) => {
    const p = problemMap.get(s.problemId);
    return {
      problemId:              s.problemId,
      title:                  p?.title ?? `Problem ${s.problemId}`,
      difficulty:             (p?.difficulty ?? "Medium") as "Easy" | "Medium" | "Hard",
      totalAttempts:          s.totalAttempts,
      bestQuality:            s.bestQuality,
      daysSinceFirstAttempt:  s.daysSinceFirstAttempt,
    };
  });

  // Readiness score — mirror the dashboard page computation
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const attemptedCategories = catStats.filter((c) => c.attemptedProblems > 0);
  const lowestCategoryAvgR = attemptedCategories.length > 0
    ? Math.min(...attemptedCategories.map((c) => c.avgR))
    : 0;
  const activeDates = new Set(
    rawAttempts
      .filter((a) => new Date(a.createdAt) >= fourteenDaysAgo)
      .map((a) => new Date(a.createdAt).toISOString().slice(0, 10))
  );
  const activeDaysInWindow = activeDates.size;
  const consistencyPct = activeDaysInWindow / 14;
  const sampleWeight = Math.min(1, rawStates.length / 10);
  const retainedCount = rawStates.filter((s) => (s.stability ?? 0) >= MASTERY_THRESHOLD).length;
  const readiness = computeReadiness({
    totalProblems:       allProblems.length,
    attemptedCount:      rawStates.length,
    retainedCount:       Math.round(retainedCount * sampleWeight),
    lowestCategoryAvgR:  lowestCategoryAvgR * sampleWeight,
    reviewsCompletedPct: consistencyPct * sampleWeight,
  });

  return (
    <Suspense>
      <InsightsClient
        data={{
          velocity,
          compliance,
          metacognition: metacog,
          stuckProblems,
          categoryStats: catStats.sort((a, b) => a.avgR - b.avgR),
          totalAttempts:  attemptRecords.length,
          totalProblems:  stateRecords.length,
          calibration: { n: calibrationN, mae: calibrationMAE, buckets: calibrationBuckets },
          readiness: { score: readiness.score, tier: readiness.tier },
          readinessBreakdown: {
            coverage:        readiness.coverage,
            retention:       readiness.retention,
            categoryBalance: readiness.categoryBalance,
            consistency:     readiness.consistency,
          },
          consistencyReviewed: activeDaysInWindow,
        }}
        isDemo={false}
      />
    </Suspense>
  );
}
