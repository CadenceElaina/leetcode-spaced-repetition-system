"use client";

import type { DrillConfidence } from "@/app/dashboard/demo-data";

interface SessionHeaderProps {
  current: number;         // 0-based index of current drill
  total: number;           // total drills in session
  combo: number;           // consecutive correct streak
  results: DrillConfidence[];
  autoContinue: boolean;
  muted: boolean;
  syntaxRefEnabled: boolean;
  onToggleAutoContinue: () => void;
  onToggleMute: () => void;
  onToggleSyntaxRef: () => void;
  onExit: () => void;
  onPrevious?: () => void;
  categoryLabel?: string;
}

/** Shared class for all right-side control buttons */
const CTRL = "inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors";
const CTRL_ON  = "border-accent/30 bg-accent/15 text-accent hover:bg-accent/20";
const CTRL_OFF = "border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80";

export function SessionHeader({
  current,
  total,
  combo,
  results,
  autoContinue,
  muted,
  syntaxRefEnabled,
  onToggleAutoContinue,
  onToggleMute,
  onToggleSyntaxRef,
  onExit,
  onPrevious,
  categoryLabel,
}: SessionHeaderProps) {
  const correctCount = results.filter((c) => c >= 3).length;
  const scored = results.length;

  return (
    <div className="flex items-center justify-between shrink-0 py-1 gap-2">
      {/* Left: back + label + pips + score + combo */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onPrevious ?? undefined}
          disabled={!onPrevious}
          title="Previous drill (Ctrl+,)"
          className={`${CTRL} ${onPrevious ? CTRL_OFF : "border-transparent bg-transparent text-muted-foreground/25 cursor-default"}`}
        >
          ‹ prev
        </button>

        <span className="text-xs font-medium text-foreground whitespace-nowrap">
          {categoryLabel ? `${categoryLabel} Practice` : "Daily Drill"}
        </span>

        {/* Dot pips */}
        <div className="flex items-center gap-1 shrink-0" aria-label={`Drill ${current + 1} of ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`inline-block rounded-full transition-colors duration-200 ${
                i < current  ? "w-2 h-2 bg-accent/60" :
                i === current ? "w-2 h-2 bg-accent"    :
                                "w-2 h-2 bg-border"
              }`}
            />
          ))}
        </div>

        {/* Running score */}
        {scored > 0 && (
          <span className="tabular-nums text-[11px] text-muted-foreground whitespace-nowrap">
            <span className="text-green-500 font-semibold">{correctCount}</span>/{scored}
          </span>
        )}

        {/* Combo badge — appears only at ≥4 */}
        {combo >= 4 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-400 whitespace-nowrap">
            🔥 {combo}
          </span>
        )}
      </div>

      {/* Right: uniform control buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToggleAutoContinue}
          title={autoContinue ? "Auto-continue on — click to disable" : "Auto-continue off — click to enable"}
          className={`${CTRL} ${autoContinue ? CTRL_ON : CTRL_OFF}`}
        >
          auto {autoContinue ? "▶" : "▷"}
        </button>

        <button
          onClick={onToggleSyntaxRef}
          title={syntaxRefEnabled ? "Syntax ref on — click to hide" : "Syntax ref off — click to show"}
          className={`${CTRL} ${syntaxRefEnabled ? CTRL_ON : CTRL_OFF}`}
        >
          ref {syntaxRefEnabled ? "on" : "off"}
        </button>

        <button
          onClick={onToggleMute}
          title={muted ? "Unmute sounds" : "Mute sounds"}
          className={`${CTRL} ${muted ? CTRL_OFF : CTRL_ON}`}
        >
          {muted ? "muted" : "sound"}
        </button>

        <button
          onClick={onExit}
          title="End session"
          className={`${CTRL} border-border bg-card text-muted-foreground hover:border-red-500/40 hover:text-red-400`}
        >
          exit
        </button>
      </div>
    </div>
  );
}
