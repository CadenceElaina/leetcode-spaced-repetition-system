import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { attempts, users, problems } from "@/db/schema";
import { eq, and, notLike } from "drizzle-orm";
import { runBacktest, type BacktestAttemptInput } from "@/lib/srs-simulator";

export const dynamic = "force-dynamic";

const DEMO_SUFFIX = "%@research-demo.aurora";

export async function GET(req: NextRequest) {
  const session = await auth();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!session?.user?.id || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse overrides from query string
  const overridesRaw = req.nextUrl.searchParams.get("overrides");
  let overrides: Record<string, number> = {};
  if (overridesRaw) {
    try {
      const parsed = JSON.parse(overridesRaw);
      if (typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      // Validate all values are numbers
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v !== "number") throw new Error(`Value for key "${k}" is not a number`);
      }
      overrides = parsed as Record<string, number>;
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid overrides JSON" },
        { status: 400 },
      );
    }
  }

  // Fetch all real-user attempts joined with problem difficulty
  const [allAttempts, allProblems] = await Promise.all([
    db
      .select({
        userId:             attempts.userId,
        problemId:          attempts.problemId,
        solvedIndependently: attempts.solvedIndependently,
        solutionQuality:    attempts.solutionQuality,
        rewroteFromScratch: attempts.rewroteFromScratch,
        confidence:         attempts.confidence,
        solveTimeMinutes:   attempts.solveTimeMinutes,
        predictedR:         attempts.predictedR,
        createdAt:          attempts.createdAt,
        difficulty:         problems.difficulty,
      })
      .from(attempts)
      .innerJoin(users,    eq(attempts.userId,    users.id))
      .innerJoin(problems, eq(attempts.problemId, problems.id))
      .where(and(notLike(users.email!, DEMO_SUFFIX), eq(users.analyticsOptOut, false))),

    db
      .select({ id: problems.id, title: problems.title, difficulty: problems.difficulty })
      .from(problems),
  ]);

  const problemMeta = new Map(
    allProblems.map((p) => [p.id, { title: p.title, difficulty: p.difficulty }]),
  );

  const inputs: BacktestAttemptInput[] = allAttempts.map((a) => ({
    userId:             a.userId,
    problemId:          a.problemId,
    difficulty:         a.difficulty,
    solvedIndependently: a.solvedIndependently,
    solutionQuality:    a.solutionQuality,
    rewroteFromScratch: a.rewroteFromScratch,
    confidence:         a.confidence,
    solveTimeMinutes:   a.solveTimeMinutes,
    predictedR:         a.predictedR,
    createdAt:          a.createdAt,
  }));

  const result = runBacktest(inputs, overrides, problemMeta);
  return NextResponse.json(result);
}
