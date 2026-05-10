"use client";

import { useState } from "react";
import type { CategoryStat, ProblemCohortStat, MultiplierKeyStat } from "@/lib/analytics";
import type { BacktestResult } from "@/lib/srs-simulator";
import { BASE_MULTIPLIERS } from "@/lib/srs";

export interface AdminData {
  overview: {
    totalUsers:        number;
    newThisWeek:       number;
    newThisMonth:      number;
    activeUsers7d:     number;
    activeUsers30d:    number;
    totalAttempts:     number;
    demoUsersExcluded: number;
  };
  users: Array<{
    id:               string;
    name:             string | null;
    email:            string | null;
    createdAt:        string;
    lastActive:       string | null;
    attemptCount:     number;
    problemsAttempted: number;
    optimalCount:     number;
  }>;
  cohortProblems: Array<ProblemCohortStat & {
    title:      string;
    difficulty: string;
    category:   string;
  }>;
  categoryStats:   CategoryStat[];
  multiplierStats: MultiplierKeyStat[];
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function pct(n: number) { return `${(n * 100).toFixed(0)}%`; }

const DIFF_COLOR: Record<string, string> = {
  Easy:   "text-green-400",
  Medium: "text-amber-400",
  Hard:   "text-red-400",
};

/* ── Backtest tab ── */

const DEFAULT_OVERRIDES = JSON.stringify(BASE_MULTIPLIERS, null, 2);

function BacktestTab() {
  const [overridesText, setOverridesText] = useState(DEFAULT_OVERRIDES);
  const [status, setStatus]  = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult]  = useState<BacktestResult | null>(null);
  const [errMsg, setErrMsg]  = useState("");

  async function runBacktest() {
    let overrides: Record<string, number>;
    try {
      overrides = JSON.parse(overridesText);
      if (typeof overrides !== "object" || Array.isArray(overrides)) throw new Error();
    } catch {
      setErrMsg("Invalid JSON — must be an object mapping keys to numbers.");
      setStatus("error");
      return;
    }

    setStatus("running");
    setErrMsg("");
    try {
      const res = await fetch(
        `/api/admin/backtest?overrides=${encodeURIComponent(JSON.stringify(overrides))}`,
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      setResult(await res.json());
      setStatus("done");
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }

  const deltaColor = (d: number) =>
    Math.abs(d) < 0.5 ? "text-muted-foreground"
    : d > 0 ? "text-green-400"
    : "text-red-400";

  return (
    <section className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Re-run every user&apos;s attempt history through a modified multiplier table. The tool computes
        what final stability and calibration MAE would have been under the alternate formula, then
        compares them to the actual results. Edit only the keys you want to change.
      </p>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Multiplier overrides (JSON)
        </label>
        <textarea
          className="w-full rounded-md border border-border/60 bg-muted/20 px-3 py-2 font-mono text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          rows={14}
          spellCheck={false}
          value={overridesText}
          onChange={(e) => setOverridesText(e.target.value)}
        />
      </div>

      <button
        onClick={runBacktest}
        disabled={status === "running"}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
      >
        {status === "running" ? "Running…" : "Run backtest"}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-400">{errMsg}</p>
      )}

      {status === "done" && result && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Problems" value={result.summary.totalProblems} />
            <StatCard
              label="Avg Δ Stability"
              value={
                <span className={result.summary.avgDelta > 0.5 ? "text-green-400" : result.summary.avgDelta < -0.5 ? "text-red-400" : "text-foreground"}>
                  {result.summary.avgDelta > 0 ? "+" : ""}{result.summary.avgDelta.toFixed(2)}d
                </span>
              }
            />
            <StatCard
              label="Calibration MAE"
              value={
                <span>
                  {result.calibration.actualMAE != null
                    ? result.calibration.actualMAE.toFixed(3)
                    : "—"}
                  {" → "}
                  {result.calibration.simulatedMAE != null
                    ? result.calibration.simulatedMAE.toFixed(3)
                    : "—"}
                </span>
              }
              sub={
                result.calibration.actualMAE != null && result.calibration.simulatedMAE != null
                  ? result.calibration.simulatedMAE < result.calibration.actualMAE
                    ? "sim is better calibrated"
                    : result.calibration.simulatedMAE > result.calibration.actualMAE
                    ? "sim is worse calibrated"
                    : "no change"
                  : `${result.calibration.reviewCount} reviews`
              }
            />
            <StatCard
              label="Higher / Lower"
              value={`${result.summary.higherCount} / ${result.summary.lowerCount}`}
              sub={`${result.summary.noChangeCount} within 5%`}
            />
          </div>

          {/* Per-problem table */}
          {result.perProblem.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/30">
                  <tr>
                    <th className="px-4 py-2.5 text-left   text-xs font-medium text-muted-foreground">Problem</th>
                    <th className="px-4 py-2.5 text-right  text-xs font-medium text-muted-foreground">Attempts</th>
                    <th className="px-4 py-2.5 text-right  text-xs font-medium text-muted-foreground">Actual S</th>
                    <th className="px-4 py-2.5 text-right  text-xs font-medium text-muted-foreground">Sim S</th>
                    <th className="px-4 py-2.5 text-right  text-xs font-medium text-muted-foreground">Δ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {result.perProblem.slice(0, 50).map((r, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-foreground">{r.problemTitle}</p>
                        <p className={`text-xs ${DIFF_COLOR[r.difficulty]}`}>{r.difficulty}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.attemptCount}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.actualFinalStability.toFixed(1)}d</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.simulatedFinalStability.toFixed(1)}d</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${deltaColor(r.delta)}`}>
                        {r.delta > 0 ? "+" : ""}{r.delta.toFixed(1)}d
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.perProblem.length > 50 && (
                <p className="px-4 py-2 text-xs text-muted-foreground">
                  Showing top 50 of {result.perProblem.length} (sorted by |Δ|).
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ── Main component ── */

export function AdminClient({ data }: { data: AdminData }) {
  const { overview, users, cohortProblems, categoryStats, multiplierStats } = data;
  const [activeTab, setActiveTab] = useState<"users" | "cohort" | "categories" | "multipliers" | "backtest">("users");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Site analytics
          {overview.demoUsersExcluded > 0 && (
            <span className="ml-1 text-muted-foreground/60">
              — {overview.demoUsersExcluded} demo seed users excluded
            </span>
          )}
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={overview.totalUsers}
          sub={overview.newThisWeek > 0 ? `+${overview.newThisWeek} this week` : "all time"}
        />
        <StatCard label="Active 7d"      value={overview.activeUsers7d}  sub="unique users with attempts" />
        <StatCard label="Active 30d"     value={overview.activeUsers30d} sub="unique users with attempts" />
        <StatCard label="Total Attempts" value={overview.totalAttempts.toLocaleString()} sub="all time" />
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border/60">
        <nav className="-mb-px flex gap-6" aria-label="Admin sections">
          {(["users", "cohort", "categories", "multipliers", "backtest"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "cohort" ? "Cohort Problems"
               : tab === "categories" ? "Categories"
               : tab === "multipliers" ? "Multipliers"
               : tab === "backtest" ? "Backtest"
               : "Users"}
            </button>
          ))}
        </nav>
      </div>

      {/* Users tab */}
      {activeTab === "users" && (
        <section>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/30">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Last Active</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Attempts</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Problems</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Optimal</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-foreground">{u.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {relativeTime(u.lastActive)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {u.attemptCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {u.problemsAttempted}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {u.optimalCount}
                        {u.problemsAttempted > 0 && (
                          <span className="ml-1 text-xs text-muted-foreground/60">
                            ({pct(u.optimalCount / u.problemsAttempted)})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Cohort problems tab */}
      {activeTab === "cohort" && (
        <section>
          <p className="mb-3 text-xs text-muted-foreground">
            Sorted by no-outcome rate (high = many students couldn&apos;t solve it). Showing problems attempted by at least 2 users.
          </p>
          {cohortProblems.filter((p) => p.enrolledStudentsAttempted >= 2).length === 0 ? (
            <p className="text-sm text-muted-foreground">Not enough cohort data yet — need ≥2 users to have attempted the same problem.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/30">
                  <tr>
                    <th className="px-4 py-2.5 text-left   text-xs font-medium text-muted-foreground">Problem</th>
                    <th className="px-4 py-2.5 text-left   text-xs font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-2.5 text-right  text-xs font-medium text-muted-foreground">Students</th>
                    <th className="px-4 py-2.5 text-right  text-xs font-medium text-muted-foreground">Optimal %</th>
                    <th className="px-4 py-2.5 text-right  text-xs font-medium text-muted-foreground">No-outcome %</th>
                    <th className="px-4 py-2.5 text-right  text-xs font-medium text-muted-foreground">Avg to Optimal</th>
                    <th className="px-4 py-2.5 text-right  text-xs font-medium text-muted-foreground">Avg R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {cohortProblems
                    .filter((p) => p.enrolledStudentsAttempted >= 2)
                    .map((p) => (
                      <tr key={p.problemId} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-foreground">{p.title}</p>
                          <p className={`text-xs ${DIFF_COLOR[p.difficulty]}`}>{p.difficulty}</p>
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">{p.category}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {p.enrolledStudentsAttempted}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-green-400">
                          {pct(p.pctAchievedOptimal)}
                        </td>
                        <td className={`px-4 py-2.5 text-right tabular-nums ${
                          p.noOutcomeRate > 0.3 ? "text-red-400" : p.noOutcomeRate > 0.15 ? "text-amber-400" : "text-muted-foreground"
                        }`}>
                          {pct(p.noOutcomeRate)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {p.avgAttemptsToOptimal != null ? p.avgAttemptsToOptimal.toFixed(1) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {pct(p.avgR)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Categories tab */}
      {activeTab === "categories" && (
        <section>
          <p className="mb-3 text-xs text-muted-foreground">
            All users merged. Sorted by retention — weakest categories first.
          </p>
          {categoryStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attempt data yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/30">
                  <tr>
                    <th className="px-4 py-2.5 text-left  text-xs font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Problems</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Avg Retention</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Stuck</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Complexity Acc.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {categoryStats.map((c) => (
                    <tr key={c.category} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-medium text-foreground">{c.category}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{c.attemptedProblems}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        <span className={
                          c.avgR >= 0.75 ? "text-green-400"
                          : c.avgR >= 0.55 ? "text-amber-400"
                          : "text-red-400"
                        }>
                          {pct(c.avgR)}
                        </span>
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${c.stuckCount > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                        {c.stuckCount}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {pct(c.complexityAccuracyRate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Multipliers tab */}
      {activeTab === "multipliers" && (
        <section>
          <p className="mb-3 text-xs text-muted-foreground">
            Frequency of each (outcome × quality) multiplier key across all real attempts.
            Avg R is the predicted retrievability at the time of the attempt (blank when predictedR
            wasn&apos;t yet recorded for early attempts).
          </p>
          {multiplierStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attempt data yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/30">
                  <tr>
                    <th className="px-4 py-2.5 text-left  text-xs font-medium text-muted-foreground">Key</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Count</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">% of Total</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Base ×</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Avg Conf.</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Avg R at review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {multiplierStats.map((m) => {
                    const [outcome, quality] = m.key.split(":");
                    const outcomeColor =
                      outcome === "YES" ? "text-green-400"
                      : outcome === "PARTIAL" ? "text-amber-400"
                      : "text-red-400";
                    return (
                      <tr key={m.key} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-mono text-sm">
                          <span className={outcomeColor}>{outcome}</span>
                          <span className="text-muted-foreground">:{quality}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{m.count.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{pct(m.pctOfTotal)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums font-medium text-foreground">{m.baseMultiplier.toFixed(1)}×</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{m.avgConfidence.toFixed(1)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                          {m.avgPredictedR != null ? pct(m.avgPredictedR) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Backtest tab */}
      {activeTab === "backtest" && <BacktestTab />}
    </div>
  );
}
