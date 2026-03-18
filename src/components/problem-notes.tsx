"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Props = {
  problemId: number;
  initialNotes?: string;
};

export function ProblemNotes({ problemId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  // Load notes on mount if not provided via props
  useEffect(() => {
    if (initialNotes !== undefined || loadedRef.current) return;
    loadedRef.current = true;
    fetch(`/api/notes?problemId=${problemId}`)
      .then((r) => r.json())
      .then((data) => setNotes(data.notes ?? ""))
      .catch(() => {});
  }, [problemId, initialNotes]);

  const save = useCallback(
    async (text: string) => {
      setSaving(true);
      try {
        await fetch("/api/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemId, notes: text }),
        });
        setLastSaved(new Date().toLocaleTimeString());
      } catch {
        // silent fail — user can retry
      } finally {
        setSaving(false);
      }
    },
    [problemId],
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setNotes(text);
    // Debounce auto-save: 1s after last keystroke
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(text), 1000);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notes</h2>
        <span className="text-xs text-muted-foreground">
          {saving ? "Saving…" : lastSaved ? `Saved ${lastSaved}` : ""}
        </span>
      </div>
      <textarea
        value={notes}
        onChange={handleChange}
        rows={6}
        placeholder="Scratch work, key insights, patterns to remember…"
        className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      />
    </div>
  );
}
