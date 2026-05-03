import { db } from "@/db";
import { problems, userProblemStates, attempts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AttemptForm } from "./attempt-form";
import { auth } from "@/auth";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(problems).where(eq(problems.id, Number(id))).limit(1);
  if (!rows[0]) return { title: "Not Found — Aurora" };
  return { title: `Log Attempt — ${rows[0].title} — Aurora` };
}

export default async function AttemptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ attemptDate?: string }> }) {
  const { id } = await params;
  const { attemptDate } = await searchParams;
  const rows = await db.select().from(problems).where(eq(problems.id, Number(id))).limit(1);
  const problem = rows[0];
  if (!problem) notFound();

  const session = await auth();
  let isReview = false;
  let priorAttempt: {
    notes: string | null;
    code: string | null;
    confidence: number;
    solvedIndependently: string;
    solutionQuality: string;
    createdAt: string;
    solveTimeMinutes: number | null;
  } | null = null;

  if (session?.user?.id) {
    const [existing, priorRows] = await Promise.all([
      db
        .select({ id: userProblemStates.id })
        .from(userProblemStates)
        .where(and(eq(userProblemStates.userId, session.user.id), eq(userProblemStates.problemId, problem.id)))
        .limit(1),
      db
        .select({
          notes: attempts.notes,
          code: attempts.code,
          confidence: attempts.confidence,
          solvedIndependently: attempts.solvedIndependently,
          solutionQuality: attempts.solutionQuality,
          createdAt: attempts.createdAt,
          solveTimeMinutes: attempts.solveTimeMinutes,
        })
        .from(attempts)
        .where(and(eq(attempts.userId, session.user.id), eq(attempts.problemId, problem.id)))
        .orderBy(desc(attempts.createdAt))
        .limit(1),
    ]);
    isReview = existing.length > 0;
    if (isReview && priorRows[0]) {
      const r = priorRows[0];
      priorAttempt = {
        notes: r.notes,
        code: r.code,
        confidence: r.confidence,
        solvedIndependently: r.solvedIndependently,
        solutionQuality: r.solutionQuality,
        createdAt: r.createdAt.toISOString(),
        solveTimeMinutes: r.solveTimeMinutes,
      };
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Log Attempt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {problem.leetcodeNumber}. {problem.title}
        </p>
      </div>
      <AttemptForm
        problemId={problem.id}
        problemTitle={problem.title}
        leetcodeNumber={problem.leetcodeNumber}
        problemCategory={problem.category}
        isReview={isReview}
        priorAttempt={priorAttempt}
        defaultAttemptDate={attemptDate ?? null}
      />
    </div>
  );
}
