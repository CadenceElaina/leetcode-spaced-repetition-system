"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";

type Props = {
  videoId: string;
};

export function VideoEmbed({ videoId }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm text-foreground transition-colors duration-150 hover:bg-muted"
      >
        <Play size={14} />
        Watch Video
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Video Explanation</h2>
        <button
          onClick={() => setOpen(false)}
          className="inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm text-foreground transition-colors duration-150 hover:bg-muted"
        >
          <X size={14} />
          Close
        </button>
      </div>
      <div className="relative w-full overflow-hidden rounded-lg border border-border" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`}
          title="NeetCode Video Explanation"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
