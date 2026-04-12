"use client";

import { useState } from "react";
import type { DrillConfidence, DrillLevel, DemoDrill } from "@/app/dashboard/demo-data";

type DrillCardPhase = "prompt" | "reveal" | "rate";

const LEVEL_BADGE: Record<DrillLevel, string> = {
  1: "bg-muted text-muted-foreground",
  2: "bg-accent/30 text-accent",
  3: "bg-accent/60 text-white",
  4: "bg-accent text-accent-foreground",
};

const CONFIDENCE_LABELS: { value: DrillConfidence; label: string; shortcut: string; className: string }[] = [
  { value: 1, label: "Again", shortcut: "1", className: "bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/30" },
  { value: 2, label: "Hard", shortcut: "2", className: "bg-orange-500/15 text-orange-500 hover:bg-orange-500/25 border-orange-500/30" },
  { value: 3, label: "Good", shortcut: "3", className: "bg-accent/15 text-accent hover:bg-accent/25 border-accent/30" },
  { value: 4, label: "Easy", shortcut: "4", className: "bg-green-500/15 text-green-500 hover:bg-green-500/25 border-green-500/30" },
];

interface DrillCardProps {
  drill: DemoDrill;
  onRate: (confidence: DrillConfidence) => void;
  position?: number;
  total?: number;
}

export function DrillCard({ drill, onRate, position, total }: DrillCardProps) {
  const [phase, setPhase] = useState<DrillCardPhase>("prompt");
  const [userCode, setUserCode] = useState("");

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
        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{drill.prompt}</p>
      </div>

      {/* Code Input */}
      <textarea
        value={userCode}
        onChange={(e) => setUserCode(e.target.value)}
        placeholder="Write your code here…"
        rows={8}
        className="w-full font-mono text-sm bg-card border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground/50 resize-y focus:outline-none focus:border-accent/50"
        readOnly={phase !== "prompt"}
      />

      {/* Phase: Prompt – show "Reveal Answer" button */}
      {phase === "prompt" && (
        <button
          onClick={() => setPhase("reveal")}
          className="inline-flex h-8 items-center rounded-md bg-accent px-4 text-xs font-medium text-accent-foreground transition-colors hover:opacity-90"
        >
          Reveal Answer
        </button>
      )}

      {/* Phase: Reveal – show expected code + explanation */}
      {phase === "reveal" && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Expected</p>
            <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">{drill.expectedCode}</pre>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Explanation</p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{drill.explanation}</p>
          </div>
          <button
            onClick={() => setPhase("rate")}
            className="inline-flex h-8 items-center rounded-md bg-accent px-4 text-xs font-medium text-accent-foreground transition-colors hover:opacity-90"
          >
            Rate Your Recall
          </button>
        </div>
      )}

      {/* Phase: Rate – 4 confidence buttons */}
      {phase === "rate" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">How well did you recall the syntax?</p>
          <div className="flex gap-2">
            {CONFIDENCE_LABELS.map((c) => (
              <button
                key={c.value}
                onClick={() => onRate(c.value)}
                className={`flex-1 h-9 rounded-md border text-sm font-medium transition-colors ${c.className}`}
              >
                {c.label}
                <span className="ml-1 text-[10px] opacity-60">({c.shortcut})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
