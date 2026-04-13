"use client";

import { useState, useCallback, type ReactNode } from "react";
import type { DrillConfidence, DrillLevel, DemoDrill } from "@/app/dashboard/demo-data";

type DrillCardPhase = "prompt" | "result";

const LEVEL_BADGE: Record<DrillLevel, string> = {
  1: "bg-muted text-muted-foreground",
  2: "bg-accent/30 text-accent",
  3: "bg-accent/60 text-white",
  4: "bg-accent text-accent-foreground",
};

/** Render text with `backtick` spans as inline <code> elements */
function renderInlineCode(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="font-mono text-[0.9em] bg-card border border-border rounded px-1 py-0.5 text-accent">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Infer a return type hint from expectedCode */
function inferReturnHint(code: string): string | null {
  // Check for common Python patterns
  if (/\bCounter\(/.test(code)) return "→ Counter (dict-like)";
  if (/\bdefaultdict\(/.test(code)) return "→ defaultdict";
  if (/\bdict\(/.test(code) || /\bzip\(/.test(code) && /\bdict\(/.test(code)) return "→ dict";
  if (/\{[^}]*:/.test(code) && !/\bfor\b/.test(code.split("\n")[0] ?? "")) return "→ dict";
  if (/\{.*\bfor\b/.test(code)) return "→ dict / set (comprehension)";
  if (/\bset\(/.test(code)) return "→ set";
  if (/\bsorted\(/.test(code)) return "→ list";
  if (/\bTrue\b|\bFalse\b|\breturn\s+(True|False)/.test(code)) return "→ bool";
  if (/\.append\(/.test(code) || /\bresult\s*=\s*\[/.test(code)) return "→ list";
  if (/\bheapq\./.test(code)) return "→ heap (list)";
  if (/\bdeque\(/.test(code)) return "→ deque";
  return null;
}

/* ── Code normalization for comparison ── */

function normalize(code: string): string {
  return code
    .split("\n")
    .map((line) => line.replace(/#.*$/, "").trimEnd()) // strip comments + trailing space
    .filter((line) => line.trim() !== "") // remove blank lines
    .join("\n")
    .replace(/\s+/g, " ") // collapse all whitespace
    .trim()
    .toLowerCase();
}

function tokenize(code: string): string[] {
  return normalize(code).split(/[\s()\[\]{},.:;=<>+\-*/%!&|^~@#]+/).filter(Boolean);
}

type MatchResult = {
  verdict: "correct" | "close" | "incorrect";
  similarity: number;
  confidence: DrillConfidence;
};

function checkCode(userCode: string, expectedCode: string, alternatives: string[] = []): MatchResult {
  const userNorm = normalize(userCode);
  const candidates = [expectedCode, ...alternatives];

  // Check exact normalized match against expected + alternatives
  for (const candidate of candidates) {
    if (normalize(candidate) === userNorm) {
      return { verdict: "correct", similarity: 1, confidence: 4 };
    }
  }

  // Token-based similarity (Jaccard) against best candidate
  const userTokens = new Set(tokenize(userCode));
  if (userTokens.size === 0) {
    return { verdict: "incorrect", similarity: 0, confidence: 1 };
  }

  let bestSim = 0;
  for (const candidate of candidates) {
    const expTokens = new Set(tokenize(candidate));
    const intersection = new Set([...userTokens].filter((t) => expTokens.has(t)));
    const union = new Set([...userTokens, ...expTokens]);
    const sim = union.size > 0 ? intersection.size / union.size : 0;
    bestSim = Math.max(bestSim, sim);
  }

  if (bestSim >= 0.8) return { verdict: "close", similarity: bestSim, confidence: 3 };
  if (bestSim >= 0.5) return { verdict: "close", similarity: bestSim, confidence: 2 };
  return { verdict: "incorrect", similarity: bestSim, confidence: 1 };
}

const VERDICT_STYLES = {
  correct: { border: "border-green-500/40", bg: "bg-green-500/10", text: "text-green-500", label: "Correct!", icon: "✓" },
  close: { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-500", label: "Close — review the differences", icon: "≈" },
  incorrect: { border: "border-red-500/40", bg: "bg-red-500/10", text: "text-red-500", label: "Not quite — study the expected answer", icon: "✗" },
};

interface DrillCardProps {
  drill: DemoDrill;
  onRate: (confidence: DrillConfidence, userCode: string) => void;
  position?: number;
  total?: number;
}

export function DrillCard({ drill, onRate, position, total }: DrillCardProps) {
  const [phase, setPhase] = useState<DrillCardPhase>("prompt");
  const [userCode, setUserCode] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);

  const handleSubmit = useCallback(() => {
    const match = checkCode(userCode, drill.expectedCode, drill.alternatives ?? []);
    setResult(match);
    setPhase("result");
  }, [userCode, drill.expectedCode, drill.alternatives]);

  const handleNext = useCallback(() => {
    if (result) {
      onRate(result.confidence, userCode);
    }
  }, [result, userCode, onRate]);

  const verdict = result ? VERDICT_STYLES[result.verdict] : null;
  const returnHint = inferReturnHint(drill.expectedCode);

  return (
    <div className="rounded-lg border border-border bg-muted p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${LEVEL_BADGE[drill.level]}`}>
            L{drill.level}
          </span>
          <span className="text-xs text-muted-foreground">{drill.category}</span>
        </div>
        {position != null && total != null && (
          <span className="text-xs text-muted-foreground tabular-nums">
            Drill {position}/{total}
          </span>
        )}
      </div>

      {/* Title & Prompt */}
      <div>
        <h3 className="text-sm font-medium text-foreground">{drill.title}</h3>
        <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
          {renderInlineCode(drill.prompt)}
        </p>
        {returnHint && (
          <p className="text-[11px] text-accent/70 font-mono mt-1">{returnHint}</p>
        )}
      </div>

      {/* Code Input */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Your code</p>
        <textarea
          value={userCode}
          onChange={(e) => setUserCode(e.target.value)}
          placeholder="Write your code here…"
          rows={8}
          className="w-full font-mono text-sm bg-card border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground/50 resize-y focus:outline-none focus:border-accent/50"
          readOnly={phase === "result"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey && e.shiftKey && phase === "prompt") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>

      {/* Phase: Prompt — submit button */}
      {phase === "prompt" && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleSubmit}
            disabled={userCode.trim().length === 0}
            className="inline-flex h-8 items-center rounded-md bg-accent px-4 text-xs font-medium text-accent-foreground transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check Answer
          </button>
          <span className="text-[10px] text-muted-foreground">Ctrl+Shift+Enter</span>
        </div>
      )}

      {/* Phase: Result — verdict + expected + explanation + next */}
      {phase === "result" && result && verdict && (
        <div className="space-y-3">
          {/* Verdict banner */}
          <div className={`rounded-lg border ${verdict.border} ${verdict.bg} px-3 py-2 flex items-center gap-2`}>
            <span className={`text-lg font-bold ${verdict.text}`}>{verdict.icon}</span>
            <span className={`text-sm font-medium ${verdict.text}`}>{verdict.label}</span>
            {result.verdict !== "correct" && (
              <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">
                {Math.round(result.similarity * 100)}% match
              </span>
            )}
          </div>

          {/* Expected code — always shown */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Expected</p>
            <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">{drill.expectedCode}</pre>
          </div>

          {/* Explanation */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Why</p>
            <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5">
              {drill.explanation.split("\n\n").map((paragraph, i) => (
                <p key={i} className="whitespace-pre-wrap">{renderInlineCode(paragraph)}</p>
              ))}
            </div>
          </div>

          {/* Next button — auto-rated, shows what confidence was assigned */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleNext}
              className="inline-flex h-8 items-center rounded-md bg-accent px-4 text-xs font-medium text-accent-foreground transition-colors hover:opacity-90"
            >
              Next →
            </button>
            <span className="text-[10px] text-muted-foreground">
              Auto-rated:{" "}
              <span className={
                result.confidence === 4 ? "text-green-500 font-medium" :
                result.confidence === 3 ? "text-accent font-medium" :
                result.confidence === 2 ? "text-orange-500 font-medium" :
                "text-red-500 font-medium"
              }>
                {result.confidence === 4 ? "Easy" : result.confidence === 3 ? "Good" : result.confidence === 2 ? "Hard" : "Again"}
              </span>
              {" "}— SRS scheduling based on your accuracy
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
