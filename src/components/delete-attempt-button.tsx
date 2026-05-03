"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAttemptButton({ attemptId }: { attemptId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    setFailed(false);
    const res = await fetch(`/api/attempts?id=${attemptId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setFailed(true);
    }
    setDeleting(false);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-500 hover:text-red-400 font-medium disabled:opacity-50"
        >
          {deleting ? "…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </span>
    );
  }

  if (failed) {
    return <span className="text-xs text-red-500" title="Delete failed — try again">✕ failed</span>;
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
      title="Delete this attempt"
    >
      ✕
    </button>
  );
}
